-- Ensure fixed AMD penalty columns exist (idempotent)
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "penaltyAbsenceAmd" DECIMAL(10, 2) NOT NULL DEFAULT 1000;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "penaltyFeedbackAmd" DECIMAL(10, 2) NOT NULL DEFAULT 500;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "penaltyVoiceAmd" DECIMAL(10, 2) NOT NULL DEFAULT 1000;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "penaltyTextAmd" DECIMAL(10, 2) NOT NULL DEFAULT 1000;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "penaltyDailyPlanAmd" DECIMAL(10, 2) NOT NULL DEFAULT 1000;

-- Remove deprecated action-percent columns (replaced by fixed AMD penalties)
ALTER TABLE "system_settings" DROP COLUMN IF EXISTS "absencePercent";
ALTER TABLE "system_settings" DROP COLUMN IF EXISTS "feedbacksPercent";
ALTER TABLE "system_settings" DROP COLUMN IF EXISTS "voicePercent";
ALTER TABLE "system_settings" DROP COLUMN IF EXISTS "textPercent";
