-- Migrate any leads with status PROCESSING to PAID, then remove enum value if present
DO $$
BEGIN
  UPDATE "crm_leads" SET "status" = 'PAID' WHERE "status" = 'PROCESSING';
  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'CrmLeadStatus' AND e.enumlabel = 'PROCESSING'
  ) THEN
    ALTER TYPE "CrmLeadStatus" REMOVE VALUE 'PROCESSING';
  END IF;
END $$;
