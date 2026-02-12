/**
 * Script to apply lesson obligations migration
 * This script applies the migration SQL directly to the database
 */

// Load environment variables from .env.local
const path = require('path');
const fs = require('fs');

// Try to load .env.local from root directory
const envPath = path.join(__dirname, '../../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyMigration() {
  console.log('🚀 Starting migration application...\n');

  try {
    // Check if columns already exist
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'lessons' 
      AND column_name IN ('absenceMarked', 'voiceSent', 'textSent')
    `;
    
    const existingColumns = await prisma.$queryRawUnsafe(checkQuery);
    const existingColumnNames = existingColumns.map((col) => col.column_name);
    
    console.log('Existing columns:', existingColumnNames);

    // Apply migration SQL
    const migrationSQL = `
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lessons' AND column_name = 'absenceMarked') THEN
              ALTER TABLE "lessons" ADD COLUMN "absenceMarked" BOOLEAN NOT NULL DEFAULT false;
              RAISE NOTICE 'Column absenceMarked added successfully';
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lessons' AND column_name = 'absenceMarkedAt') THEN
              ALTER TABLE "lessons" ADD COLUMN "absenceMarkedAt" TIMESTAMP(3);
              RAISE NOTICE 'Column absenceMarkedAt added successfully';
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lessons' AND column_name = 'voiceSent') THEN
              ALTER TABLE "lessons" ADD COLUMN "voiceSent" BOOLEAN NOT NULL DEFAULT false;
              RAISE NOTICE 'Column voiceSent added successfully';
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lessons' AND column_name = 'voiceSentAt') THEN
              ALTER TABLE "lessons" ADD COLUMN "voiceSentAt" TIMESTAMP(3);
              RAISE NOTICE 'Column voiceSentAt added successfully';
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lessons' AND column_name = 'textSent') THEN
              ALTER TABLE "lessons" ADD COLUMN "textSent" BOOLEAN NOT NULL DEFAULT false;
              RAISE NOTICE 'Column textSent added successfully';
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lessons' AND column_name = 'textSentAt') THEN
              ALTER TABLE "lessons" ADD COLUMN "textSentAt" TIMESTAMP(3);
              RAISE NOTICE 'Column textSentAt added successfully';
          END IF;
      END $$;
    `;

    await prisma.$executeRawUnsafe(migrationSQL);
    
    console.log('✅ Migration applied successfully!\n');
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

