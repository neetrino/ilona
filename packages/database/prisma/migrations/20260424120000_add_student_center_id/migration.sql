-- Optional admin-assigned center on student (independent of group.centerId in UI/API).
ALTER TABLE "students" ADD COLUMN "centerId" TEXT;

ALTER TABLE "students" ADD CONSTRAINT "students_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "students_centerId_idx" ON "students"("centerId");

-- Backfill from current group so existing rows keep the same displayed center until admins change it.
UPDATE "students" s
SET "centerId" = g."centerId"
FROM "groups" g
WHERE s."groupId" = g."id" AND s."centerId" IS NULL;
