-- Enforce fixed group capacity of 8 students for all groups.
ALTER TABLE "groups"
ALTER COLUMN "maxStudents" SET DEFAULT 8;

UPDATE "groups"
SET "maxStudents" = 8
WHERE "maxStudents" <> 8;
