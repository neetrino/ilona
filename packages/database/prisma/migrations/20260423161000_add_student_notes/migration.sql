CREATE TABLE IF NOT EXISTS "student_notes" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "student_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "student_notes_studentId_idx" ON "student_notes"("studentId");

DO $$
BEGIN
  ALTER TABLE "student_notes"
    ADD CONSTRAINT "student_notes_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "students"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
