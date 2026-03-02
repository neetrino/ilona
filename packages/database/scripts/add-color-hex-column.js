/**
 * Script to add colorHex column to centers table
 * This script applies the migration SQL directly to the database
 */

// Load environment variables from .env.local
const path = require('path');
const fs = require('fs');

// Try to load .env.local or .env from root directory
const rootDir = path.join(__dirname, '../..');
const envPaths = [
  path.join(rootDir, '.env.local'),
  path.join(rootDir, '.env'),
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    console.log(`Loading environment from: ${envPath}`);
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach((line) => {
      const trimmedLine = line.trim();
      // Skip comments and empty lines
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const match = trimmedLine.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          // Remove quotes if present
          value = value.replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
    break; // Use first found file
  }
}

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is not set.');
  console.error('Please set DATABASE_URL in your .env.local or .env file, or export it in your shell.');
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

