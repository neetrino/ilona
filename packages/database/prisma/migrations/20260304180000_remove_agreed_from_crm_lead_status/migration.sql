UPDATE "crm_leads"
SET "status" = 'FIRST_LESSON'::"CrmLeadStatus"
WHERE "status"::text = 'AGREED';
