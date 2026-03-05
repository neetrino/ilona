-- Migrate any leads with status PROCESSING to PAID.
-- Compare by text so this works even if the enum no longer includes PROCESSING (e.g. after a prior migration or restore).
UPDATE "crm_leads" SET "status" = 'PAID'::"CrmLeadStatus" WHERE "status"::text = 'PROCESSING';
