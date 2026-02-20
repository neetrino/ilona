-- AlterTable
-- Add penalty amount columns with default values (using IF NOT EXISTS to avoid errors if columns already exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_settings' AND column_name = 'penaltyAbsenceAmd') THEN
    ALTER TABLE "system_settings" ADD COLUMN "penaltyAbsenceAmd" DECIMAL(10, 2) NOT NULL DEFAULT 1000;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_settings' AND column_name = 'penaltyFeedbackAmd') THEN
    ALTER TABLE "system_settings" ADD COLUMN "penaltyFeedbackAmd" DECIMAL(10, 2) NOT NULL DEFAULT 1000;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_settings' AND column_name = 'penaltyVoiceAmd') THEN
    ALTER TABLE "system_settings" ADD COLUMN "penaltyVoiceAmd" DECIMAL(10, 2) NOT NULL DEFAULT 1000;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_settings' AND column_name = 'penaltyTextAmd') THEN
    ALTER TABLE "system_settings" ADD COLUMN "penaltyTextAmd" DECIMAL(10, 2) NOT NULL DEFAULT 1000;
  END IF;
END $$;

-- Update existing records to have default values (in case columns were added without defaults)
UPDATE "system_settings" 
SET 
  "penaltyAbsenceAmd" = COALESCE("penaltyAbsenceAmd", 1000),
  "penaltyFeedbackAmd" = COALESCE("penaltyFeedbackAmd", 1000),
  "penaltyVoiceAmd" = COALESCE("penaltyVoiceAmd", 1000),
  "penaltyTextAmd" = COALESCE("penaltyTextAmd", 1000);

