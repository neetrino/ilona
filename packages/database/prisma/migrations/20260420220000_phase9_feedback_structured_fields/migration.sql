-- Phase 9: structured Feedback form fields + CEFR level enum.
-- Data-preserving: no existing columns are removed. New columns are
-- nullable / default to empty arrays so historic feedback rows stay valid.

-- 1) Create CEFR level enum (idempotent).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CefrLevel') THEN
    CREATE TYPE "CefrLevel" AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
  END IF;
END $$;

-- 2) Extend Feedback table with structured fields used by the new form.
ALTER TABLE "feedbacks"
  ADD COLUMN IF NOT EXISTS "level"          "CefrLevel",
  ADD COLUMN IF NOT EXISTS "grammarTopics"  TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "skills"         TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "skillsNote"     TEXT,
  ADD COLUMN IF NOT EXISTS "participation"  INTEGER,
  ADD COLUMN IF NOT EXISTS "progress"       TEXT,
  ADD COLUMN IF NOT EXISTS "encouragement"  TEXT;
