-- Remove optional administrative responsible teacher from groups.

ALTER TABLE "groups" DROP CONSTRAINT IF EXISTS "groups_responsibleTeacherId_fkey";
DROP INDEX IF EXISTS "groups_responsibleTeacherId_idx";
ALTER TABLE "groups" DROP COLUMN IF EXISTS "responsibleTeacherId";
