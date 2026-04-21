/**
 * Reconcile production DB with local Phase 0 + Phase 9 migrations.
 *
 * Production diverged: an older `add_teacher_centers` migration was already
 * applied directly, so running the un-applied Phase 0 migration verbatim would
 * crash on existing objects. This script:
 *   1. Loads .env.local (DATABASE_URL).
 *   2. Executes `reconcile-phase0-schema.sql` (idempotent DDL).
 *   3. Marks the three local-only migrations as APPLIED in `_prisma_migrations`
 *      so future `prisma migrate deploy` calls succeed cleanly.
 *
 * Run with:
 *   pnpm --filter @ilona/database db:reconcile-phase0
 */
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';
import { createHash, randomUUID } from 'crypto';
import { PrismaClient } from '../src/generated/client';

const possibleEnvPaths = [
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), '../../.env.local'),
  resolve(__dirname, '../../../.env.local'),
];
for (const p of possibleEnvPaths) {
  if (existsSync(p)) {
    config({ path: p });
    break;
  }
}
config({ path: resolve(process.cwd(), '.env') });

const MIGRATIONS_DIR = resolve(__dirname, '../prisma/migrations');
const SQL_FILE = resolve(__dirname, 'reconcile-phase0-schema.sql');

const TARGET_MIGRATIONS = [
  '20260420120000_remove_student_age_and_parent_passport_info',
  '20260420190000_phase0_foundation_schema',
  '20260420220000_phase9_feedback_structured_fields',
] as const;

const prisma = new PrismaClient();

function readMigrationSql(name: string): string {
  const file = resolve(MIGRATIONS_DIR, name, 'migration.sql');
  if (!existsSync(file)) {
    throw new Error(`Migration file not found: ${file}`);
  }
  return readFileSync(file, 'utf8');
}

function checksumOf(sql: string): string {
  // Prisma stores a SHA-256 of the migration.sql contents.
  return createHash('sha256').update(sql).digest('hex');
}

/**
 * Split a SQL script into top-level statements at `;`, while preserving the
 * contents of `$$ … $$` dollar-quoted blocks (which contain inner semicolons).
 * Strips line comments. Empty results are filtered out.
 */
function splitSqlStatements(sql: string): string[] {
  const stripped = sql
    .split('\n')
    .map((line) => {
      const idx = line.indexOf('--');
      return idx === -1 ? line : line.slice(0, idx);
    })
    .join('\n');

  const statements: string[] = [];
  let buffer = '';
  let inDollar = false;
  let i = 0;
  while (i < stripped.length) {
    const ch = stripped[i];
    if (!inDollar && ch === '$' && stripped[i + 1] === '$') {
      inDollar = true;
      buffer += '$$';
      i += 2;
      continue;
    }
    if (inDollar && ch === '$' && stripped[i + 1] === '$') {
      inDollar = false;
      buffer += '$$';
      i += 2;
      continue;
    }
    if (!inDollar && ch === ';') {
      const trimmed = buffer.trim();
      if (trimmed.length > 0) statements.push(trimmed);
      buffer = '';
      i += 1;
      continue;
    }
    buffer += ch;
    i += 1;
  }
  const tail = buffer.trim();
  if (tail.length > 0) statements.push(tail);
  return statements;
}

async function applyDdl(): Promise<void> {
  const sql = readFileSync(SQL_FILE, 'utf8');
  const statements = splitSqlStatements(sql).filter((s) => {
    const upper = s.toUpperCase();
    // Transaction control is handled by Prisma's $transaction.
    return upper !== 'BEGIN' && upper !== 'COMMIT';
  });

  console.log(`• Applying idempotent DDL (${statements.length} statements)...`);
  // Run statements sequentially. The SQL is fully idempotent, so a partial
  // failure is safe to re-run; this avoids interactive-transaction timeouts on
  // remote PostgreSQL hosts (e.g. Neon) where 48 round-trips can exceed the
  // default 5 s transaction window.
  let i = 0;
  for (const stmt of statements) {
    i += 1;
    try {
      await prisma.$executeRawUnsafe(stmt);
    } catch (err) {
      console.error(`  ✗ Statement ${i} failed:\n${stmt}\n`);
      throw err;
    }
    if (i % 10 === 0) console.log(`  …${i}/${statements.length}`);
  }
  console.log('  ✔ DDL applied');
}

async function markApplied(migrationName: string): Promise<void> {
  const sql = readMigrationSql(migrationName);
  const checksum = checksumOf(sql);

  const existing = await prisma.$queryRaw<{ id: string; finished_at: Date | null }[]>`
    SELECT id, finished_at FROM _prisma_migrations WHERE migration_name = ${migrationName} LIMIT 1
  `;

  if (existing.length > 0) {
    if (existing[0].finished_at !== null) {
      console.log(`  • ${migrationName} already marked applied`);
      return;
    }
    await prisma.$executeRaw`
      UPDATE _prisma_migrations
      SET finished_at = NOW(), applied_steps_count = 1, checksum = ${checksum}
      WHERE migration_name = ${migrationName}
    `;
    console.log(`  ✔ ${migrationName} marked applied (was pending)`);
    return;
  }

  await prisma.$executeRaw`
    INSERT INTO _prisma_migrations (
      id, checksum, finished_at, migration_name, started_at, applied_steps_count
    ) VALUES (
      ${randomUUID()}, ${checksum}, NOW(), ${migrationName}, NOW(), 1
    )
  `;
  console.log(`  ✔ ${migrationName} inserted as applied`);
}

async function reconcile(): Promise<void> {
  console.log('=== Phase 0 / Phase 9 reconciliation ===');
  await applyDdl();

  console.log('• Marking migrations as applied in _prisma_migrations...');
  for (const name of TARGET_MIGRATIONS) {
    await markApplied(name);
  }

  console.log('=== Done. Migration history is now in sync. ===');
}

reconcile()
  .catch((err) => {
    console.error('Reconciliation failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
