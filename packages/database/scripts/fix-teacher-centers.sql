-- Create the missing `teacher_centers` table.
-- The historic `20250306120000_add_teacher_centers` migration is recorded as
-- applied in _prisma_migrations but its DDL never landed (orphan history row).
-- This recreates the table + indexes + FKs and re-runs the Phase-0 backfill.

CREATE TABLE IF NOT EXISTS "teacher_centers" (
  "id"        TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "centerId"  TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "teacher_centers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "teacher_centers_teacherId_centerId_key"
  ON "teacher_centers"("teacherId", "centerId");
CREATE INDEX IF NOT EXISTS "teacher_centers_teacherId_idx" ON "teacher_centers"("teacherId");
CREATE INDEX IF NOT EXISTS "teacher_centers_centerId_idx" ON "teacher_centers"("centerId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teacher_centers_teacherId_fkey') THEN
    ALTER TABLE "teacher_centers"
      ADD CONSTRAINT "teacher_centers_teacherId_fkey"
      FOREIGN KEY ("teacherId") REFERENCES "teachers"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teacher_centers_centerId_fkey') THEN
    ALTER TABLE "teacher_centers"
      ADD CONSTRAINT "teacher_centers_centerId_fkey"
      FOREIGN KEY ("centerId") REFERENCES "centers"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

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
