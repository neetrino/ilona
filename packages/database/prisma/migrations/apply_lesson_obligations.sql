-- Apply lesson obligations migration
-- Run this SQL directly on your database if migration commands fail

ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "absenceMarked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "absenceMarkedAt" TIMESTAMP(3);
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "voiceSent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "voiceSentAt" TIMESTAMP(3);
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "textSent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "textSentAt" TIMESTAMP(3);







