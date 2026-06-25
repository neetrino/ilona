-- Replace group substitute teacher with second teacher + optional responsible teacher.

ALTER TABLE "groups" RENAME COLUMN "substituteTeacherId" TO "secondTeacherId";

ALTER INDEX IF EXISTS "groups_substituteTeacherId_idx" RENAME TO "groups_secondTeacherId_idx";

ALTER TABLE "groups" RENAME CONSTRAINT "groups_substituteTeacherId_fkey" TO "groups_secondTeacherId_fkey";
