-- Remove deprecated action percent columns (salary uses fixed AMD penalties per duty)

ALTER TABLE "system_settings" DROP COLUMN IF EXISTS "absencePercent";
ALTER TABLE "system_settings" DROP COLUMN IF EXISTS "feedbacksPercent";
ALTER TABLE "system_settings" DROP COLUMN IF EXISTS "voicePercent";
ALTER TABLE "system_settings" DROP COLUMN IF EXISTS "textPercent";
