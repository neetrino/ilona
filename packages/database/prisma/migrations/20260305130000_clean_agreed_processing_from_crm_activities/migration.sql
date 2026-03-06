UPDATE "crm_leads"
SET "status" = 'FIRST_LESSON'::"CrmLeadStatus"
WHERE "status"::text = 'AGREED';

UPDATE "crm_leads"
SET "status" = 'PAID'::"CrmLeadStatus"
WHERE "status"::text = 'PROCESSING';

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
