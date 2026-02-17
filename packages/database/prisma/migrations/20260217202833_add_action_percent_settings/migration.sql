-- AlterTable
-- Add columns with default values (using IF NOT EXISTS to avoid errors if columns already exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_settings' AND column_name = 'absencePercent') THEN
    ALTER TABLE "system_settings" ADD COLUMN "absencePercent" INTEGER NOT NULL DEFAULT 25;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_settings' AND column_name = 'feedbacksPercent') THEN
    ALTER TABLE "system_settings" ADD COLUMN "feedbacksPercent" INTEGER NOT NULL DEFAULT 25;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_settings' AND column_name = 'voicePercent') THEN
    ALTER TABLE "system_settings" ADD COLUMN "voicePercent" INTEGER NOT NULL DEFAULT 25;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_settings' AND column_name = 'textPercent') THEN
    ALTER TABLE "system_settings" ADD COLUMN "textPercent" INTEGER NOT NULL DEFAULT 25;
  END IF;
END $$;

-- Update existing records to have default values (in case columns were added without defaults)
UPDATE "system_settings" 
SET 
  "absencePercent" = COALESCE("absencePercent", 25),
  "feedbacksPercent" = COALESCE("feedbacksPercent", 25),
  "voicePercent" = COALESCE("voicePercent", 25),
  "textPercent" = COALESCE("textPercent", 25);
