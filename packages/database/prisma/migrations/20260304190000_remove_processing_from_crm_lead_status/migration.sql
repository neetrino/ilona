-- Migrate any leads with status PROCESSING to PAID.
-- We do not remove the enum value from PostgreSQL (avoids ALTER TYPE issues in all environments).
UPDATE "crm_leads" SET "status" = 'PAID' WHERE "status" = 'PROCESSING';
