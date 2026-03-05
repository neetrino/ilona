-- Migrate any leads with status PROCESSING to PAID.
-- (Enum value is not dropped: not supported on Neon/this PostgreSQL.)
UPDATE "crm_leads" SET "status" = 'PAID' WHERE "status" = 'PROCESSING';
