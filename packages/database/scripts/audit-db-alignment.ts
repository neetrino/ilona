import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import { Prisma, PrismaClient } from '../src/generated/client';

type RowTable = { tablename: string };
type RowColumn = { table_name: string; column_name: string };
type RowMigration = { migration_name: string };
type RowColumnUsage = { total_rows: number; non_null_rows: number };
type RowDuplicateMigration = { migration_name: string; rows: number };

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

function localMigrationNames(): Set<string> {
  const dir = resolve(__dirname, '../prisma/migrations');
  if (!existsSync(dir)) return new Set<string>();
  const names = readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  return new Set(names);
}

function expectedSchemaFromDmmf(): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const model of Prisma.dmmf.datamodel.models) {
    const table = model.dbName ?? model.name;
    const cols = new Set<string>();
    for (const field of model.fields) {
      if (field.kind === 'object') continue;
      cols.add(field.dbName ?? field.name);
    }
    map.set(table, cols);
  }
  return map;
}

async function main(): Promise<void> {
  loadEnv();

  const expected = expectedSchemaFromDmmf();
  const expectedTables = new Set(expected.keys());
  const ignoredTables = new Set(['_prisma_migrations']);

  const dbTablesRows = await prisma.$queryRaw<RowTable[]>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `;
  const dbTables = new Set(
    dbTablesRows
      .map((r) => r.tablename)
      .filter((t) => !ignoredTables.has(t))
  );

  const dbColumnsRows = await prisma.$queryRaw<RowColumn[]>`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `;
  const dbColumnsByTable = new Map<string, Set<string>>();
  for (const row of dbColumnsRows) {
    if (ignoredTables.has(row.table_name)) continue;
    const existing = dbColumnsByTable.get(row.table_name) ?? new Set<string>();
    existing.add(row.column_name);
    dbColumnsByTable.set(row.table_name, existing);
  }

  const extraTables = [...dbTables].filter((t) => !expectedTables.has(t));
  const missingTables = [...expectedTables].filter((t) => !dbTables.has(t));

  const tableDiffs: Array<{ table: string; extra: string[]; missing: string[] }> = [];
  for (const table of expectedTables) {
    if (!dbTables.has(table)) continue;
    const expectedCols = expected.get(table) ?? new Set<string>();
    const dbCols = dbColumnsByTable.get(table) ?? new Set<string>();
    const extra = [...dbCols].filter((c) => !expectedCols.has(c));
    const missing = [...expectedCols].filter((c) => !dbCols.has(c));
    if (extra.length > 0 || missing.length > 0) {
      tableDiffs.push({ table, extra, missing });
    }
  }

  const localMigrations = localMigrationNames();
  const dbMigrations = await prisma.$queryRaw<RowMigration[]>`
    SELECT migration_name
    FROM _prisma_migrations
    ORDER BY migration_name
  `;
  const orphanMigrations = dbMigrations
    .map((m) => m.migration_name)
    .filter((m) => !localMigrations.has(m));

  const duplicateMigrationRows = await prisma.$queryRaw<RowDuplicateMigration[]>`
    SELECT migration_name, COUNT(*)::int AS rows
    FROM _prisma_migrations
    GROUP BY migration_name
    HAVING COUNT(*) > 1
    ORDER BY migration_name
  `;

  const extraColumnUsage: Array<{
    table: string;
    column: string;
    totalRows: number;
    nonNullRows: number;
  }> = [];
  for (const diff of tableDiffs) {
    for (const column of diff.extra) {
      const usage = await prisma.$queryRawUnsafe<RowColumnUsage[]>(
        `SELECT COUNT(*)::int AS total_rows, COUNT("${column}")::int AS non_null_rows FROM "${diff.table}"`
      );
      extraColumnUsage.push({
        table: diff.table,
        column,
        totalRows: usage[0]?.total_rows ?? 0,
        nonNullRows: usage[0]?.non_null_rows ?? 0,
      });
    }
  }

  const report = {
    summary: {
      expectedTables: expectedTables.size,
      databaseTables: dbTables.size,
      extraTables: extraTables.length,
      missingTables: missingTables.length,
      tablesWithColumnDiffs: tableDiffs.length,
      orphanMigrations: orphanMigrations.length,
      duplicateMigrationNames: duplicateMigrationRows.length,
    },
    extraTables,
    missingTables,
    tableDiffs,
    extraColumnUsage,
    orphanMigrations,
    duplicateMigrationRows,
  };

  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
