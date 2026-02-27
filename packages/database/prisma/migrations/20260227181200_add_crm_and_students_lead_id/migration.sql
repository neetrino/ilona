-- Remove partially applied CRM objects so we can create them correctly
ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "students_leadId_fkey";
DROP INDEX IF EXISTS "students_leadId_key";
ALTER TABLE "students" DROP COLUMN IF EXISTS "leadId";
DROP TABLE IF EXISTS "crm_lead_attachments";
DROP TABLE IF EXISTS "crm_lead_activities";
-- Drop legacy/extra CRM tables that may reference crm_leads
DROP TABLE IF EXISTS "crm_lead_transfers";
DROP TABLE IF EXISTS "crm_lead_status_history";
DROP TABLE IF EXISTS "crm_leads";

-- Add MANAGER to UserRole enum (safe if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'UserRole' AND e.enumlabel = 'MANAGER'
  ) THEN
    ALTER TYPE "UserRole" ADD VALUE 'MANAGER';
  END IF;
END $$;

-- CreateEnum for CRM (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CrmLeadStatus') THEN
    CREATE TYPE "CrmLeadStatus" AS ENUM ('NEW', 'AGREED', 'FIRST_LESSON', 'PROCESSING', 'PAID', 'WAITLIST', 'ARCHIVE');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CrmLeadActivityType') THEN
    CREATE TYPE "CrmLeadActivityType" AS ENUM ('STATUS_CHANGE', 'COMMENT', 'RECORDING_UPLOADED', 'TEACHER_APPROVED', 'TEACHER_TRANSFER', 'FIELD_UPDATE');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CrmLeadAttachmentType') THEN
    CREATE TYPE "CrmLeadAttachmentType" AS ENUM ('VOICE_RECORDING', 'FILE');
  END IF;
END $$;

-- CreateTable crm_leads (if not exists)
CREATE TABLE IF NOT EXISTS "crm_leads" (
    "id" TEXT NOT NULL,
    "status" "CrmLeadStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "assignedManagerId" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "age" INTEGER,
    "levelId" TEXT,
    "teacherId" TEXT,
    "groupId" TEXT,
    "centerId" TEXT,
    "transferFlag" BOOLEAN NOT NULL DEFAULT false,
    "transferComment" TEXT,
    "archivedReason" TEXT,
    "source" TEXT,
    "notes" TEXT,

    CONSTRAINT "crm_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable crm_lead_activities (if not exists)
CREATE TABLE IF NOT EXISTS "crm_lead_activities" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "type" "CrmLeadActivityType" NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_lead_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable crm_lead_attachments (if not exists)
CREATE TABLE IF NOT EXISTS "crm_lead_attachments" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" "CrmLeadAttachmentType" NOT NULL,
    "r2Key" TEXT NOT NULL,
    "mimeType" TEXT,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_lead_attachments_pkey" PRIMARY KEY ("id")
);

-- Add leadId to students
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "leadId" TEXT;

-- CreateIndex (unique for leadId) - ignore if exists
CREATE UNIQUE INDEX IF NOT EXISTS "students_leadId_key" ON "students"("leadId");

-- AddForeignKey crm_leads (only if constraint does not exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_leads_createdByUserId_fkey') THEN
    ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_leads_assignedManagerId_fkey') THEN
    ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_assignedManagerId_fkey" FOREIGN KEY ("assignedManagerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_leads_teacherId_fkey') THEN
    ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_leads_groupId_fkey') THEN
    ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_leads_centerId_fkey') THEN
    ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_lead_activities_leadId_fkey') THEN
    ALTER TABLE "crm_lead_activities" ADD CONSTRAINT "crm_lead_activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_lead_attachments_leadId_fkey') THEN
    ALTER TABLE "crm_lead_attachments" ADD CONSTRAINT "crm_lead_attachments_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'students_leadId_fkey') THEN
    ALTER TABLE "students" ADD CONSTRAINT "students_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- CreateIndex for crm_leads
CREATE INDEX IF NOT EXISTS "crm_leads_status_idx" ON "crm_leads"("status");
CREATE INDEX IF NOT EXISTS "crm_leads_phone_idx" ON "crm_leads"("phone");
CREATE INDEX IF NOT EXISTS "crm_leads_teacherId_idx" ON "crm_leads"("teacherId");
CREATE INDEX IF NOT EXISTS "crm_leads_groupId_idx" ON "crm_leads"("groupId");
CREATE INDEX IF NOT EXISTS "crm_leads_centerId_idx" ON "crm_leads"("centerId");
CREATE INDEX IF NOT EXISTS "crm_leads_createdAt_idx" ON "crm_leads"("createdAt");
CREATE INDEX IF NOT EXISTS "crm_leads_assignedManagerId_idx" ON "crm_leads"("assignedManagerId");

-- CreateIndex for crm_lead_activities
CREATE INDEX IF NOT EXISTS "crm_lead_activities_leadId_idx" ON "crm_lead_activities"("leadId");
CREATE INDEX IF NOT EXISTS "crm_lead_activities_type_idx" ON "crm_lead_activities"("type");
CREATE INDEX IF NOT EXISTS "crm_lead_activities_createdAt_idx" ON "crm_lead_activities"("createdAt");

-- CreateIndex for crm_lead_attachments
CREATE INDEX IF NOT EXISTS "crm_lead_attachments_leadId_idx" ON "crm_lead_attachments"("leadId");
CREATE INDEX IF NOT EXISTS "crm_lead_attachments_type_idx" ON "crm_lead_attachments"("type");

-- CreateIndex for students.leadId
CREATE INDEX IF NOT EXISTS "students_leadId_idx" ON "students"("leadId");
