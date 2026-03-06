-- Migrate CRM AGREED/PROCESSING to FIRST_LESSON/PAID everywhere.
-- (Neon/this PostgreSQL does not support ALTER TYPE ... DROP VALUE, so we only migrate data;
--  the enum values AGREED/PROCESSING may remain in the type but no rows use them.)
-- Only run crm_leads updates when enum values exist (avoids 22P02 when baseline never had them).

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'CrmLeadStatus' AND e.enumlabel = 'AGREED') THEN
    UPDATE "crm_leads" SET "status" = 'FIRST_LESSON' WHERE "status" = 'AGREED'::"CrmLeadStatus";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'CrmLeadStatus' AND e.enumlabel = 'PROCESSING') THEN
    UPDATE "crm_leads" SET "status" = 'PAID' WHERE "status" = 'PROCESSING'::"CrmLeadStatus";
  END IF;
END $$;

-- crm_lead_activities.payload fromStatus/toStatus
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
