-- Drop unused parent/student passport fields from students and CRM leads.
ALTER TABLE "students" DROP COLUMN IF EXISTS "parentPassportInfo";
ALTER TABLE "crm_leads" DROP COLUMN IF EXISTS "parentPassportInfo";
