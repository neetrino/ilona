-- Migrate CRM AGREED/PROCESSING to FIRST_LESSON/PAID everywhere.
-- (Neon/this PostgreSQL does not support ALTER TYPE ... DROP VALUE, so we only migrate data;
--  the enum values AGREED/PROCESSING may remain in the type but no rows use them.)

-- crm_leads: migrate AGREED -> FIRST_LESSON, PROCESSING -> PAID
UPDATE "crm_leads" SET "status" = 'FIRST_LESSON' WHERE "status" = 'AGREED';
UPDATE "crm_leads" SET "status" = 'PAID' WHERE "status" = 'PROCESSING';

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
