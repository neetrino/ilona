-- Penalty amounts are configured by admin only; no DB defaults.

ALTER TABLE "system_settings" ALTER COLUMN "penaltyAbsenceAmd" DROP DEFAULT;
ALTER TABLE "system_settings" ALTER COLUMN "penaltyFeedbackAmd" DROP DEFAULT;
ALTER TABLE "system_settings" ALTER COLUMN "penaltyVoiceAmd" DROP DEFAULT;
ALTER TABLE "system_settings" ALTER COLUMN "penaltyTextAmd" DROP DEFAULT;
ALTER TABLE "system_settings" ALTER COLUMN "penaltyDailyPlanAmd" DROP DEFAULT;

ALTER TABLE "system_settings" ALTER COLUMN "penaltyAbsenceAmd" DROP NOT NULL;
ALTER TABLE "system_settings" ALTER COLUMN "penaltyFeedbackAmd" DROP NOT NULL;
ALTER TABLE "system_settings" ALTER COLUMN "penaltyVoiceAmd" DROP NOT NULL;
ALTER TABLE "system_settings" ALTER COLUMN "penaltyTextAmd" DROP NOT NULL;
ALTER TABLE "system_settings" ALTER COLUMN "penaltyDailyPlanAmd" DROP NOT NULL;
