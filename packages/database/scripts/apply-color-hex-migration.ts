/**
 * Script to add colorHex column to centers table
 * Uses the same environment loading as the NestJS app
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { PrismaClient } from '@prisma/client';

// Load .env.local from project root (same as main.ts)
const possibleRootPaths = [
  resolve(process.cwd(), '.env.local'),           // If running from root
  resolve(process.cwd(), '../../.env.local'),    // If running from packages/database
  resolve(__dirname, '../../../.env.local'),     // If running from scripts
];

let envPath: string | undefined;
for (const path of possibleRootPaths) {
  if (existsSync(path)) {
    envPath = path;
    break;
  }
}

if (envPath) {
  config({ path: envPath });
  console.log(`✅ Loaded environment from: ${envPath}`);
  // Also try .env as fallback
  const envFallback = envPath.replace('.env.local', '.env');
  if (existsSync(envFallback)) {
    config({ path: envFallback });
  }
} else {
  // Fallback: try loading from current working directory
  config({ path: resolve(process.cwd(), '.env.local') });
  config({ path: resolve(process.cwd(), '.env') });
  console.log('⚠️  No .env.local found, trying default locations...');
}

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is not set.');
  console.error('Please ensure .env.local exists in the project root with DATABASE_URL.');
  process.exit(1);
}

const prisma = new PrismaClient();

async function applyMigration() {
  console.log('🚀 Adding colorHex column to centers table...\n');

  try {
    // Check if column already exists (tagged template — no user input, safe)
    const existingColumns = await prisma.$queryRaw<Array<{ column_name: string }>>`
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

