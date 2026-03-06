UPDATE "crm_leads"
SET "status" = 'PAID'::"CrmLeadStatus"
WHERE "status"::text = 'PROCESSING';
