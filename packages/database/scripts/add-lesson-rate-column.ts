import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from root .env.local or .env
config({ path: resolve(__dirname, '../../../.env.local') });
config({ path: resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();

async function addLessonRateColumn() {
  try {
    console.log('Checking if lessonRateAMD column exists...');
    
    // Try to query the column to see if it exists
    try {
      await prisma.$queryRaw`
        SELECT "lessonRateAMD" FROM "teachers" LIMIT 1
      `;
      console.log('✅ Column lessonRateAMD already exists!');
      return;
    } catch (error: any) {
      // If column doesn't exist, add it
      if (error?.message?.includes('does not exist') || error?.code === '42703') {
        console.log('Adding lessonRateAMD column to teachers table...');
        await prisma.$executeRaw`
          ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "lessonRateAMD" DECIMAL(10,2)
        `;
        console.log('✅ Successfully added lessonRateAMD column!');
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('❌ Error adding lessonRateAMD column:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addLessonRateColumn()
  .then(() => {
    console.log('Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

