-- AlterTable
ALTER TABLE "system_settings"
ADD COLUMN IF NOT EXISTS "footerIconLinks" JSONB;
