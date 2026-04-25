import { config } from 'dotenv';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '../src/generated/client';

type MigrationRow = { migration_name: string };
type BackupRow = { id: string; leadId: string; durationSec: number | null };
type DuplicateRow = { migration_name: string; rows: number };

const prisma = new PrismaClient();

function loadEnv(): void {
  const candidates = [
    resolve(process.cwd(), '.env.local'),
    resolve(process.cwd(), '../../.env.local'),
    resolve(__dirname, '../../../.env.local'),
  ];

  for (const file of candidates) {
    if (existsSync(file)) {
      config({ path: file });
      return;
    }
  }
}

function getLocalMigrationNames(): Set<string> {
  const migrationsDir = resolve(__dirname, '../prisma/migrations');
  if (!existsSync(migrationsDir)) return new Set<string>();

  const names = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  return new Set<string>(names);
}

async function backupLegacyDurationSec(): Promise<string | null> {
  const rows = await prisma.$queryRaw<BackupRow[]>`
    SELECT id, "leadId", "durationSec"
    FROM "crm_lead_attachments"
    WHERE "durationSec" IS NOT NULL
    ORDER BY "createdAt" ASC
  `;

  if (rows.length === 0) return null;

  const reportsDir = resolve(process.cwd(), 'reports');
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true });
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = resolve(reportsDir, `legacy-durationSec-backup-${stamp}.json`);
  writeFileSync(reportPath, JSON.stringify(rows, null, 2), 'utf8');
  return reportPath;
}

async function collectOrphanMigrations(): Promise<string[]> {
  const localNames = getLocalMigrationNames();
  const dbRows = await prisma.$queryRaw<MigrationRow[]>`
    SELECT migration_name
    FROM _prisma_migrations
    ORDER BY migration_name
  `;

  return dbRows
    .map((row) => row.migration_name)
    .filter((name) => !localNames.has(name));
}

async function reconcile(): Promise<void> {
  loadEnv();

  const orphanMigrations = await collectOrphanMigrations();
  const backupPath = await backupLegacyDurationSec();

  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      'ALTER TABLE "crm_lead_attachments" DROP COLUMN IF EXISTS "durationSec"'
    );

    for (const migrationName of orphanMigrations) {
      await tx.$executeRaw`
        DELETE FROM _prisma_migrations
        WHERE migration_name = ${migrationName}
      `;
    }

    await tx.$executeRawUnsafe(`
      WITH ranked AS (
        SELECT
          ctid,
          migration_name,
          ROW_NUMBER() OVER (
            PARTITION BY migration_name
            ORDER BY finished_at DESC NULLS LAST, started_at DESC, id DESC
          ) AS rn
        FROM _prisma_migrations
      )
      DELETE FROM _prisma_migrations p
      USING ranked r
      WHERE p.ctid = r.ctid AND r.rn > 1
    `);
  });

  const duplicateRows = await prisma.$queryRaw<DuplicateRow[]>`
    SELECT migration_name, COUNT(*)::int AS rows
    FROM _prisma_migrations
    GROUP BY migration_name
    HAVING COUNT(*) > 1
    ORDER BY migration_name
  `;

  console.log(
    JSON.stringify(
      {
        status: 'ok',
        droppedLegacyColumn: 'crm_lead_attachments.durationSec',
        orphanMigrationsDeleted: orphanMigrations.length,
        duplicateMigrationNamesAfterCleanup: duplicateRows.length,
        backupPath,
      },
      null,
      2
    )
  );
}

reconcile()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
