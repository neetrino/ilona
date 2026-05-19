-- Allow multiple manager profile rows per center over time; only one current assignment per center.
ALTER TABLE "manager_profiles" ADD COLUMN IF NOT EXISTS "isCurrentAssignment" BOOLEAN NOT NULL DEFAULT true;

DROP INDEX IF EXISTS "manager_profiles_centerId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "manager_profiles_one_current_per_center_idx"
  ON "manager_profiles"("centerId")
  WHERE "isCurrentAssignment" = true;
