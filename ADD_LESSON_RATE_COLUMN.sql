-- Quick fix: Add lessonRateAMD column to teachers table
-- Run this SQL directly in your PostgreSQL database

ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "lessonRateAMD" DECIMAL(10,2);

-- Verify the column was added:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'lessonRateAMD';

