-- Migrate any leads with status AGREED to FIRST_LESSON.
-- We do not remove the enum value from PostgreSQL (avoids ALTER TYPE issues in all environments).
UPDATE "crm_leads" SET "status" = 'FIRST_LESSON' WHERE "status" = 'AGREED';
