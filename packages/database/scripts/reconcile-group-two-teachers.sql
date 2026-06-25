-- Idempotent reconcile: group second teacher column.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'substituteTeacherId'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'secondTeacherId'
  ) THEN
    ALTER TABLE "groups" RENAME COLUMN "substituteTeacherId" TO "secondTeacherId";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'groups_substituteTeacherId_idx'
  ) THEN
    ALTER INDEX "groups_substituteTeacherId_idx" RENAME TO "groups_secondTeacherId_idx";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'groups_substituteTeacherId_fkey'
  ) THEN
    ALTER TABLE "groups" RENAME CONSTRAINT "groups_substituteTeacherId_fkey" TO "groups_secondTeacherId_fkey";
  END IF;
END $$;

ALTER TABLE "groups" DROP CONSTRAINT IF EXISTS "groups_responsibleTeacherId_fkey";
DROP INDEX IF EXISTS "groups_responsibleTeacherId_idx";
ALTER TABLE "groups" DROP COLUMN IF EXISTS "responsibleTeacherId";
