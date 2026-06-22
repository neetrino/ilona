-- AlterTable
ALTER TABLE "system_settings"
ADD COLUMN IF NOT EXISTS "dashboardBannerTitle" TEXT,
ADD COLUMN IF NOT EXISTS "dashboardBannerSubtitle" TEXT;
