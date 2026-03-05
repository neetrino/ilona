-- Migrate any leads with status AGREED to FIRST_LESSON.
-- (Enum value is not dropped: not supported on Neon/this PostgreSQL.)
UPDATE "crm_leads" SET "status" = 'FIRST_LESSON' WHERE "status" = 'AGREED';
