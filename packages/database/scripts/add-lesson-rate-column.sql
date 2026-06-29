-- Manual fix: add lessonRateAMD column to teachers table.
-- Prefer: pnpm --filter @ilona/database exec prisma migrate deploy
-- Or run: pnpm --filter @ilona/database exec tsx scripts/add-lesson-rate-column.ts

ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "lessonRateAMD" DECIMAL(10, 2);

-- Verify:
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'teachers' AND column_name = 'lessonRateAMD';
