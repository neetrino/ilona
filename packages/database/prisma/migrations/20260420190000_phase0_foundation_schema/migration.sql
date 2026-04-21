-- Phase 0 — Foundation schema (data-preserving)
-- Adds: Group substitute teacher + schedule, Teacher↔Center M:N, Teacher.videoUrl,
-- Student DOB/firstLessonDate/status/riskLabel, CrmLead parent + comment + firstLessonDate,
-- new models: TeacherCenter, TeacherNote, DailyPlan(+Topic+Resource), StudentStreak, RecordingItem,
-- new enums: StudentStatus, RiskLabel, DailyPlanResourceKind, SystemSettings.penaltyDailyPlanAmd.

-- ===========================================================================
-- ENUMS
-- ===========================================================================

CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'UNGROUPED', 'NEW', 'RISK', 'HIGH_RISK');
CREATE TYPE "RiskLabel" AS ENUM ('NONE', 'RISK', 'HIGH_RISK');
CREATE TYPE "DailyPlanResourceKind" AS ENUM ('READING', 'LISTENING', 'WRITING', 'SPEAKING');

-- ===========================================================================
-- GROUPS: substitute teacher + schedule
-- ===========================================================================

ALTER TABLE "groups"
  ADD COLUMN "substituteTeacherId" TEXT,
  ADD COLUMN "schedule" JSONB;

CREATE INDEX "groups_substituteTeacherId_idx" ON "groups"("substituteTeacherId");

ALTER TABLE "groups"
  ADD CONSTRAINT "groups_substituteTeacherId_fkey"
  FOREIGN KEY ("substituteTeacherId") REFERENCES "teachers"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ===========================================================================
-- TEACHERS: video link
-- ===========================================================================

ALTER TABLE "teachers" ADD COLUMN "videoUrl" TEXT;

-- ===========================================================================
-- TEACHER ↔ CENTER (many-to-many via join table)
-- ===========================================================================

CREATE TABLE "teacher_centers" (
  "id"        TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "centerId"  TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "teacher_centers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "teacher_centers_teacherId_centerId_key" ON "teacher_centers"("teacherId", "centerId");
CREATE INDEX "teacher_centers_teacherId_idx" ON "teacher_centers"("teacherId");
CREATE INDEX "teacher_centers_centerId_idx" ON "teacher_centers"("centerId");

ALTER TABLE "teacher_centers"
  ADD CONSTRAINT "teacher_centers_teacherId_fkey"
  FOREIGN KEY ("teacherId") REFERENCES "teachers"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "teacher_centers"
  ADD CONSTRAINT "teacher_centers_centerId_fkey"
  FOREIGN KEY ("centerId") REFERENCES "centers"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: teacher gets membership in every center where they currently teach a group.
INSERT INTO "teacher_centers" ("id", "teacherId", "centerId", "createdAt")
SELECT
  CONCAT('tc_', g."teacherId", '_', g."centerId") AS "id",
  g."teacherId",
  g."centerId",
  CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT "teacherId", "centerId"
  FROM "groups"
  WHERE "teacherId" IS NOT NULL
) AS g
ON CONFLICT ("teacherId", "centerId") DO NOTHING;

-- ===========================================================================
-- TEACHER NOTES (sticky notes feature for teacher dashboard)
-- ===========================================================================

CREATE TABLE "teacher_notes" (
  "id"        TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "content"   TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "teacher_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "teacher_notes_teacherId_idx" ON "teacher_notes"("teacherId");

ALTER TABLE "teacher_notes"
  ADD CONSTRAINT "teacher_notes_teacherId_fkey"
  FOREIGN KEY ("teacherId") REFERENCES "teachers"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ===========================================================================
-- STUDENTS: DOB, first-lesson date, status, risk label
-- ===========================================================================

ALTER TABLE "students"
  ADD COLUMN "dateOfBirth"     TIMESTAMP(3),
  ADD COLUMN "firstLessonDate" TIMESTAMP(3),
  ADD COLUMN "status"          "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "riskLabel"       "RiskLabel"     NOT NULL DEFAULT 'NONE';

-- Backfill DOB from existing age (approximate: today - age years).
UPDATE "students"
SET "dateOfBirth" = (CURRENT_DATE - (("age" || ' years')::interval))::date
WHERE "age" IS NOT NULL AND "dateOfBirth" IS NULL;

-- Mark students without a group as UNGROUPED (UI-level concept).
UPDATE "students" SET "status" = 'UNGROUPED' WHERE "groupId" IS NULL AND "status" = 'ACTIVE';

CREATE INDEX "students_status_idx"    ON "students"("status");
CREATE INDEX "students_riskLabel_idx" ON "students"("riskLabel");

-- ===========================================================================
-- CRM LEADS: parent fields, comment, first-lesson date, DOB
-- ===========================================================================

ALTER TABLE "crm_leads"
  ADD COLUMN "dateOfBirth"        TIMESTAMP(3),
  ADD COLUMN "parentName"         TEXT,
  ADD COLUMN "parentPhone"        TEXT,
  ADD COLUMN "parentPassportInfo" TEXT,
  ADD COLUMN "firstLessonDate"    TIMESTAMP(3),
  ADD COLUMN "comment"            TEXT;

-- ===========================================================================
-- DAILY PLAN (+ topics + resources)
-- ===========================================================================

CREATE TABLE "daily_plans" (
  "id"        TEXT NOT NULL,
  "lessonId"  TEXT,
  "teacherId" TEXT NOT NULL,
  "groupId"   TEXT,
  "date"      TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "daily_plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "daily_plans_lessonId_key" ON "daily_plans"("lessonId");
CREATE INDEX "daily_plans_teacherId_idx" ON "daily_plans"("teacherId");
CREATE INDEX "daily_plans_groupId_idx"   ON "daily_plans"("groupId");
CREATE INDEX "daily_plans_date_idx"      ON "daily_plans"("date");

ALTER TABLE "daily_plans"
  ADD CONSTRAINT "daily_plans_lessonId_fkey"
  FOREIGN KEY ("lessonId") REFERENCES "lessons"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "daily_plans"
  ADD CONSTRAINT "daily_plans_teacherId_fkey"
  FOREIGN KEY ("teacherId") REFERENCES "teachers"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "daily_plans"
  ADD CONSTRAINT "daily_plans_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "groups"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "daily_plan_topics" (
  "id"          TEXT NOT NULL,
  "dailyPlanId" TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "order"       INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "daily_plan_topics_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "daily_plan_topics_dailyPlanId_idx" ON "daily_plan_topics"("dailyPlanId");

ALTER TABLE "daily_plan_topics"
  ADD CONSTRAINT "daily_plan_topics_dailyPlanId_fkey"
  FOREIGN KEY ("dailyPlanId") REFERENCES "daily_plans"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "daily_plan_resources" (
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

CREATE INDEX "daily_plan_resources_topicId_idx" ON "daily_plan_resources"("topicId");
CREATE INDEX "daily_plan_resources_kind_idx"    ON "daily_plan_resources"("kind");

ALTER TABLE "daily_plan_resources"
  ADD CONSTRAINT "daily_plan_resources_topicId_fkey"
  FOREIGN KEY ("topicId") REFERENCES "daily_plan_topics"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ===========================================================================
-- STUDENT STREAK
-- ===========================================================================

CREATE TABLE "student_streaks" (
  "id"                 TEXT NOT NULL,
  "studentId"          TEXT NOT NULL,
  "currentStreak"      INTEGER NOT NULL DEFAULT 0,
  "lastAttendanceDate" TIMESTAMP(3),
  "updatedAt"          TIMESTAMP(3) NOT NULL,
  CONSTRAINT "student_streaks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "student_streaks_studentId_key" ON "student_streaks"("studentId");

ALTER TABLE "student_streaks"
  ADD CONSTRAINT "student_streaks_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "students"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ===========================================================================
-- RECORDING ITEMS (lesson-scoped student recordings — for the new module)
-- ===========================================================================

CREATE TABLE "recording_items" (
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

CREATE INDEX "recording_items_groupId_idx"    ON "recording_items"("groupId");
CREATE INDEX "recording_items_studentId_idx"  ON "recording_items"("studentId");
CREATE INDEX "recording_items_lessonId_idx"   ON "recording_items"("lessonId");
CREATE INDEX "recording_items_recordedAt_idx" ON "recording_items"("recordedAt");

ALTER TABLE "recording_items"
  ADD CONSTRAINT "recording_items_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "groups"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "recording_items"
  ADD CONSTRAINT "recording_items_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "students"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "recording_items"
  ADD CONSTRAINT "recording_items_lessonId_fkey"
  FOREIGN KEY ("lessonId") REFERENCES "lessons"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ===========================================================================
-- SYSTEM SETTINGS: Daily Plan penalty
-- ===========================================================================

ALTER TABLE "system_settings"
  ADD COLUMN "penaltyDailyPlanAmd" DECIMAL(10, 2) NOT NULL DEFAULT 1000;
