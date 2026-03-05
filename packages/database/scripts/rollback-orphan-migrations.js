/**
 * Removes orphan migration records from _prisma_migrations.
 * Orphan = migration was applied to DB but the migration file no longer exists in code.
 * Loads .env.local from repo root for DATABASE_URL/DIRECT_URL.
 */
const path = require('path');
const fs = require('fs');

const prismaDir = path.join(__dirname, '..');
const repoRoot = path.join(prismaDir, '../..');

const envPath = path.join(repoRoot, '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

const DIRECT_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!DIRECT_URL) {
  console.error('Missing DIRECT_URL or DATABASE_URL (e.g. in .env.local)');
  process.exit(1);
}

const ORPHAN_MIGRATION_NAMES = [
  '20260305130000_clean_agreed_processing_from_crm_activities',
];

async function main() {
  let PrismaClient;
  try {
    PrismaClient = require(path.join(prismaDir, 'src', 'generated', 'client')).PrismaClient;
  } catch (e) {
    console.error('Prisma client not generated. Run: pnpm run db:generate');
    process.exit(1);
  }

  const prisma = new PrismaClient({
    datasources: { db: { url: DIRECT_URL } },
  });

  try {
    for (const name of ORPHAN_MIGRATION_NAMES) {
      const result = await prisma.$executeRawUnsafe(
        'DELETE FROM _prisma_migrations WHERE migration_name = $1',
        name
      );
      console.log(`Deleted ${result} row(s) for migration: ${name}`);
    }
    console.log('Done.');
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
