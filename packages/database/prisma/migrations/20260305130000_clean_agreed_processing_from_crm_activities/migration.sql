-- Remove CRM AGREED/PROCESSING from everywhere in the database:
-- 1) crm_leads.status (migrate rows then remove enum values if still present)
-- 2) crm_lead_activities.payload (fromStatus/toStatus in JSONB)

DO $$
BEGIN
  -- crm_leads: migrate AGREED -> FIRST_LESSON, PROCESSING -> PAID
  UPDATE "crm_leads" SET "status" = 'FIRST_LESSON' WHERE "status" = 'AGREED';
  UPDATE "crm_leads" SET "status" = 'PAID' WHERE "status" = 'PROCESSING';

  -- Remove AGREED from enum if present
  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'CrmLeadStatus' AND e.enumlabel = 'AGREED'
  ) THEN
    ALTER TYPE "CrmLeadStatus" DROP VALUE 'AGREED';
  END IF;

  -- Remove PROCESSING from enum if present
  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'CrmLeadStatus' AND e.enumlabel = 'PROCESSING'
  ) THEN
    ALTER TYPE "CrmLeadStatus" DROP VALUE 'PROCESSING';
  END IF;
END $$;

-- crm_lead_activities.payload: replace AGREED -> FIRST_LESSON, PROCESSING -> PAID in fromStatus/toStatus
UPDATE "crm_lead_activities"
SET "payload" = jsonb_set("payload", '{fromStatus}', '"FIRST_LESSON"')
WHERE "payload" IS NOT NULL AND "payload"->>'fromStatus' = 'AGREED';

UPDATE "crm_lead_activities"
SET "payload" = jsonb_set("payload", '{toStatus}', '"FIRST_LESSON"')
WHERE "payload" IS NOT NULL AND "payload"->>'toStatus' = 'AGREED';

UPDATE "crm_lead_activities"
SET "payload" = jsonb_set("payload", '{fromStatus}', '"PAID"')
WHERE "payload" IS NOT NULL AND "payload"->>'fromStatus' = 'PROCESSING';

UPDATE "crm_lead_activities"
SET "payload" = jsonb_set("payload", '{toStatus}', '"PAID"')
WHERE "payload" IS NOT NULL AND "payload"->>'toStatus' = 'PROCESSING';
