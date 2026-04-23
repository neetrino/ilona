-- =============================================================================
-- Idempotent reconciliation of Phase 0 foundation schema.
--
-- Production DB diverged from local migrations: an older `add_teacher_centers`
-- migration was applied directly, so the original Phase 0 SQL would crash on
-- the existing `teacher_centers` table. This script applies the *effective*
-- Phase 0 changes safely, using IF NOT EXISTS / DO blocks throughout. It is
-- safe to re-run.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ENUMS (idempotent)
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StudentStatus') THEN
    CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'UNGROUPED', 'NEW', 'RISK', 'HIGH_RISK');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RiskLabel') THEN
    CREATE TYPE "RiskLabel" AS ENUM ('NONE', 'RISK', 'HIGH_RISK');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DailyPlanResourceKind') THEN
    CREATE TYPE "DailyPlanResourceKind" AS ENUM ('READING', 'LISTENING', 'WRITING', 'SPEAKING');
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- GROUPS: substitute teacher + schedule
-- -----------------------------------------------------------------------------
ALTER TABLE "groups"
  ADD COLUMN IF NOT EXISTS "substituteTeacherId" TEXT,
  ADD COLUMN IF NOT EXISTS "schedule" JSONB;

CREATE INDEX IF NOT EXISTS "groups_substituteTeacherId_idx" ON "groups"("substituteTeacherId");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'groups_substituteTeacherId_fkey'
  ) THEN
    ALTER TABLE "groups"
      ADD CONSTRAINT "groups_substituteTeacherId_fkey"
      FOREIGN KEY ("substituteTeacherId") REFERENCES "teachers"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- TEACHERS: video link
-- -----------------------------------------------------------------------------
ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;

-- -----------------------------------------------------------------------------
-- TEACHER ↔ CENTER (already created by 20250306120000_add_teacher_centers).
-- We only ensure indexes/backfill, never CREATE TABLE again.
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teacher_centers') THEN
    -- Indexes (safe if already present)
    BEGIN
      CREATE UNIQUE INDEX IF NOT EXISTS "teacher_centers_teacherId_centerId_key"
        ON "teacher_centers"("teacherId", "centerId");
    EXCEPTION WHEN others THEN NULL; END;
    BEGIN
      CREATE INDEX IF NOT EXISTS "teacher_centers_teacherId_idx" ON "teacher_centers"("teacherId");
    EXCEPTION WHEN others THEN NULL; END;
    BEGIN
      CREATE INDEX IF NOT EXISTS "teacher_centers_centerId_idx" ON "teacher_centers"("centerId");
    EXCEPTION WHEN others THEN NULL; END;

    -- Backfill: ensure each (teacher, center) pair from groups exists in teacher_centers
    INSERT INTO "teacher_centers" ("id", "teacherId", "centerId", "createdAt")
    SELECT
      CONCAT('tc_', g."teacherId", '_', g."centerId"),
      g."teacherId",
      g."centerId",
      CURRENT_TIMESTAMP
    FROM (
      SELECT DISTINCT "teacherId", "centerId"
      FROM "groups"
      WHERE "teacherId" IS NOT NULL
    ) AS g
    ON CONFLICT ("teacherId", "centerId") DO NOTHING;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- TEACHER NOTES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "teacher_notes" (
  "id"        TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "content"   TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "teacher_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "teacher_notes_teacherId_idx" ON "teacher_notes"("teacherId");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'teacher_notes_teacherId_fkey'
  ) THEN
    ALTER TABLE "teacher_notes"
      ADD CONSTRAINT "teacher_notes_teacherId_fkey"
      FOREIGN KEY ("teacherId") REFERENCES "teachers"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- STUDENTS: DOB, first-lesson date, status, risk label
-- -----------------------------------------------------------------------------
ALTER TABLE "students"
  ADD COLUMN IF NOT EXISTS "dateOfBirth"     TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "firstLessonDate" TIMESTAMP(3);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'status'
  ) THEN
    ALTER TABLE "students"
      ADD COLUMN "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'riskLabel'
  ) THEN
    ALTER TABLE "students"
      ADD COLUMN "riskLabel" "RiskLabel" NOT NULL DEFAULT 'NONE';
  END IF;
END $$;

-- Backfill DOB from existing age (only where age column still exists).
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'age'
  ) THEN
    EXECUTE $sql$
      UPDATE "students"
      SET "dateOfBirth" = (CURRENT_DATE - (("age" || ' years')::interval))::date
      WHERE "age" IS NOT NULL AND "dateOfBirth" IS NULL
    $sql$;
  END IF;
END $$;

-- Mark students without a group as UNGROUPED.
UPDATE "students" SET "status" = 'UNGROUPED'
WHERE "groupId" IS NULL AND "status" = 'ACTIVE';

CREATE INDEX IF NOT EXISTS "students_status_idx"    ON "students"("status");
CREATE INDEX IF NOT EXISTS "students_riskLabel_idx" ON "students"("riskLabel");

-- -----------------------------------------------------------------------------
-- CRM LEADS: parent fields, comment, first-lesson date, DOB
-- -----------------------------------------------------------------------------
ALTER TABLE "crm_leads"
  ADD COLUMN IF NOT EXISTS "dateOfBirth"        TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "parentName"         TEXT,
  ADD COLUMN IF NOT EXISTS "parentPhone"        TEXT,
  ADD COLUMN IF NOT EXISTS "parentPassportInfo" TEXT,
  ADD COLUMN IF NOT EXISTS "firstLessonDate"    TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "comment"            TEXT;

-- -----------------------------------------------------------------------------
-- DAILY PLAN (+ topics + resources)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "daily_plans" (
  "id"        TEXT NOT NULL,
  "lessonId"  TEXT,
  "teacherId" TEXT NOT NULL,
  "groupId"   TEXT,
  "date"      TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "daily_plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "daily_plans_lessonId_key" ON "daily_plans"("lessonId");
CREATE INDEX IF NOT EXISTS "daily_plans_teacherId_idx" ON "daily_plans"("teacherId");
CREATE INDEX IF NOT EXISTS "daily_plans_groupId_idx"   ON "daily_plans"("groupId");
CREATE INDEX IF NOT EXISTS "daily_plans_date_idx"      ON "daily_plans"("date");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daily_plans_lessonId_fkey') THEN
    ALTER TABLE "daily_plans"
      ADD CONSTRAINT "daily_plans_lessonId_fkey"
      FOREIGN KEY ("lessonId") REFERENCES "lessons"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daily_plans_teacherId_fkey') THEN
    ALTER TABLE "daily_plans"
      ADD CONSTRAINT "daily_plans_teacherId_fkey"
      FOREIGN KEY ("teacherId") REFERENCES "teachers"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daily_plans_groupId_fkey') THEN
    ALTER TABLE "daily_plans"
      ADD CONSTRAINT "daily_plans_groupId_fkey"
      FOREIGN KEY ("groupId") REFERENCES "groups"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "daily_plan_topics" (
  "id"          TEXT NOT NULL,
  "dailyPlanId" TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "order"       INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "daily_plan_topics_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "daily_plan_topics_dailyPlanId_idx" ON "daily_plan_topics"("dailyPlanId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daily_plan_topics_dailyPlanId_fkey') THEN
    ALTER TABLE "daily_plan_topics"
      ADD CONSTRAINT "daily_plan_topics_dailyPlanId_fkey"
      FOREIGN KEY ("dailyPlanId") REFERENCES "daily_plans"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "daily_plan_resources" (
  "id"          TEXT NOT NULL,
  "topicId"     TEXT NOT NULL,
  "kind"        "DailyPlanResourceKind" NOT NULL,
  "title"       TEXT NOT NULL,
  "link"        TEXT,
  "description" TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "daily_plan_resources_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "daily_plan_resources_topicId_idx" ON "daily_plan_resources"("topicId");
CREATE INDEX IF NOT EXISTS "daily_plan_resources_kind_idx"    ON "daily_plan_resources"("kind");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daily_plan_resources_topicId_fkey') THEN
    ALTER TABLE "daily_plan_resources"
      ADD CONSTRAINT "daily_plan_resources_topicId_fkey"
      FOREIGN KEY ("topicId") REFERENCES "daily_plan_topics"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- RECORDING ITEMS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "recording_items" (
  "id"          TEXT NOT NULL,
  "groupId"     TEXT NOT NULL,
  "studentId"   TEXT NOT NULL,
  "lessonId"    TEXT,
  "fileUrl"     TEXT NOT NULL,
  "fileName"    TEXT,
  "durationSec" INTEGER,
  "recordedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "recording_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "recording_items_groupId_idx"    ON "recording_items"("groupId");
CREATE INDEX IF NOT EXISTS "recording_items_studentId_idx"  ON "recording_items"("studentId");
CREATE INDEX IF NOT EXISTS "recording_items_lessonId_idx"   ON "recording_items"("lessonId");
CREATE INDEX IF NOT EXISTS "recording_items_recordedAt_idx" ON "recording_items"("recordedAt");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recording_items_groupId_fkey') THEN
    ALTER TABLE "recording_items"
      ADD CONSTRAINT "recording_items_groupId_fkey"
      FOREIGN KEY ("groupId") REFERENCES "groups"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recording_items_studentId_fkey') THEN
    ALTER TABLE "recording_items"
      ADD CONSTRAINT "recording_items_studentId_fkey"
      FOREIGN KEY ("studentId") REFERENCES "students"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recording_items_lessonId_fkey') THEN
    ALTER TABLE "recording_items"
      ADD CONSTRAINT "recording_items_lessonId_fkey"
      FOREIGN KEY ("lessonId") REFERENCES "lessons"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- SYSTEM SETTINGS: Daily Plan penalty
-- -----------------------------------------------------------------------------
ALTER TABLE "system_settings"
  ADD COLUMN IF NOT EXISTS "penaltyDailyPlanAmd" DECIMAL(10, 2) NOT NULL DEFAULT 1000;

-- -----------------------------------------------------------------------------
-- PHASE 9: Structured Feedback fields (idempotent — original migration was
-- already idempotent; included here so the entire reconciliation runs in one
-- transaction).
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CefrLevel') THEN
    CREATE TYPE "CefrLevel" AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
  END IF;
END $$;

ALTER TABLE "feedbacks"
  ADD COLUMN IF NOT EXISTS "level"          "CefrLevel",
  ADD COLUMN IF NOT EXISTS "grammarTopics"  TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "skills"         TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "skillsNote"     TEXT,
  ADD COLUMN IF NOT EXISTS "participation"  INTEGER,
  ADD COLUMN IF NOT EXISTS "progress"       TEXT,
  ADD COLUMN IF NOT EXISTS "encouragement"  TEXT;
