-- Migrate any leads with status AGREED to FIRST_LESSON.
-- (Enum value is not dropped: not supported on Neon/this PostgreSQL.)
-- Only run UPDATE if 'AGREED' exists in CrmLeadStatus (avoids P3018/22P02 when
-- the enum was never created with AGREED, e.g. different migration baseline).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'CrmLeadStatus' AND e.enumlabel = 'AGREED'
  ) THEN
    UPDATE "crm_leads" SET "status" = 'FIRST_LESSON' WHERE "status" = 'AGREED'::"CrmLeadStatus";
  END IF;
END $$;
