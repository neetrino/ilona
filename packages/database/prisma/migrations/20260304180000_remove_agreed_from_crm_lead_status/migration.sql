-- Migrate any leads with status AGREED to FIRST_LESSON, then remove enum value if present
DO $$
BEGIN
  UPDATE "crm_leads" SET "status" = 'FIRST_LESSON' WHERE "status" = 'AGREED';
  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'CrmLeadStatus' AND e.enumlabel = 'AGREED'
  ) THEN
    ALTER TYPE "CrmLeadStatus" REMOVE VALUE 'AGREED';
  END IF;
END $$;
