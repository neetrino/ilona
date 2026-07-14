/**
 * Script to add colorHex column to centers table
 * This script applies the migration SQL directly to the database
 */

const { loadRootEnv } = require('./load-root-env.cjs');

loadRootEnv();

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is not set.');
  console.error('Please set DATABASE_URL in your .env file, or export it in your shell.');
  console.error('\nAlternatively, you can run the SQL migration directly:');
  console.error('  psql $DATABASE_URL -f packages/database/prisma/migrations/apply_color_hex_migration.sql');
  process.exit(1);
}

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyMigration() {
  console.log('🚀 Adding colorHex column to centers table...\n');

  try {
    // Check if column already exists (tagged template — no user input, safe)
    const existingColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'centers' 
      AND column_name = 'colorHex'
    `;

    if (existingColumns.length > 0) {
      console.log('✅ Column colorHex already exists in centers table.\n');
      return;
    }

    // Apply migration SQL (tagged template — static, safe)
    await prisma.$executeRaw`
      ALTER TABLE "centers" ADD COLUMN IF NOT EXISTS "colorHex" TEXT
    `;
    
    console.log('✅ Column colorHex added successfully to centers table!\n');
    console.log('📝 Next steps:');
    console.log('   1. Regenerate Prisma Client: pnpm db:generate');
    console.log('   2. Restart your API server');
    
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();

