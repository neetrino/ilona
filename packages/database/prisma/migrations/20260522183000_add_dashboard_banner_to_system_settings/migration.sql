-- Store admin-configurable dashboard banner image key.
ALTER TABLE "system_settings"
ADD COLUMN IF NOT EXISTS "dashboardBannerUrl" TEXT;
