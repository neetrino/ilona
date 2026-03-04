-- Add registerDate to students (optional, manual date when student joined a group)
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "registerDate" TIMESTAMP(3);
