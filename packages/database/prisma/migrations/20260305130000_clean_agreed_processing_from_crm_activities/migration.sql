-- Migrate CRM AGREED/PROCESSING to FIRST_LESSON/PAID (data only; no ALTER TYPE - not supported on Neon).

-- crm_leads
UPDATE "crm_leads" SET "status" = 'FIRST_LESSON' WHERE "status" = 'AGREED';
UPDATE "crm_leads" SET "status" = 'PAID' WHERE "status" = 'PROCESSING';

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
