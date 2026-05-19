-- Track last active manager assignment for inactive manager reactivation flow.
ALTER TABLE "manager_profiles" ADD COLUMN IF NOT EXISTS "lastManagedCenterId" TEXT;
ALTER TABLE "manager_profiles" ADD COLUMN IF NOT EXISTS "lastManagedCenterName" TEXT;
ALTER TABLE "manager_profiles" ADD COLUMN IF NOT EXISTS "lastManagedAt" TIMESTAMP(3);

-- Backfill for managers already inactive with a released assignment.
UPDATE "manager_profiles" mp
SET
  "lastManagedCenterId" = mp."centerId",
  "lastManagedCenterName" = c."name",
  "lastManagedAt" = mp."updatedAt"
FROM "users" u, "centers" c
WHERE u."id" = mp."userId"
  AND c."id" = mp."centerId"
  AND u."status" <> 'ACTIVE'
  AND mp."isCurrentAssignment" = false
  AND mp."lastManagedAt" IS NULL;
