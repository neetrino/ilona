-- CreateIndex: Lesson composite index for groupId + scheduledAt (optimizes lessons by group and date range)
CREATE INDEX IF NOT EXISTS "lessons_groupId_scheduledAt_idx" ON "lessons"("groupId", "scheduledAt");

-- CreateIndex: Attendance index on lessonId (optimizes batch attendance lookups by lesson)
CREATE INDEX IF NOT EXISTS "attendances_lessonId_idx" ON "attendances"("lessonId");
