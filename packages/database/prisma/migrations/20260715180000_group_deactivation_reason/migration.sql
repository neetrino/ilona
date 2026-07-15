-- Store reason when a manager deactivates a group.

ALTER TABLE "groups" ADD COLUMN "deactivationReason" TEXT;
