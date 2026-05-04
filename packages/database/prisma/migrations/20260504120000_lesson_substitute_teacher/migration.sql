-- Per-lesson substitute teacher (one day / one occurrence); main teacher stays on lesson.teacherId.
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "substituteTeacherId" TEXT;

CREATE INDEX IF NOT EXISTS "lessons_substituteTeacherId_idx" ON "lessons"("substituteTeacherId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lessons_substituteTeacherId_fkey'
  ) THEN
    ALTER TABLE "lessons"
      ADD CONSTRAINT "lessons_substituteTeacherId_fkey"
      FOREIGN KEY ("substituteTeacherId") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
