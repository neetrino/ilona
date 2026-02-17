-- Add lessonRateAMD column to teachers table
-- This migration adds the lessonRateAMD field for per-lesson salary calculation

ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "lessonRateAMD" DECIMAL(10,2);

