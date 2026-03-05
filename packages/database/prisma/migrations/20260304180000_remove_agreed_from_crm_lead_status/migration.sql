-- Migrate any leads with status AGREED to FIRST_LESSON.
-- Compare by text so this works even if the enum no longer includes AGREED (e.g. after a prior migration or restore).
UPDATE "crm_leads" SET "status" = 'FIRST_LESSON'::"CrmLeadStatus" WHERE "status"::text = 'AGREED';
