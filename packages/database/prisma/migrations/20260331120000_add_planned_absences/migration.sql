-- CreateTable (idempotent: table may already exist from db push or manual DDL)
CREATE TABLE IF NOT EXISTS "planned_absences" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planned_absence',
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planned_absences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "planned_absences_studentId_idx" ON "planned_absences"("studentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "planned_absences_date_idx" ON "planned_absences"("date");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "planned_absences_studentId_date_key" ON "planned_absences"("studentId", "date");

-- AddForeignKey (skip if constraint already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'planned_absences_studentId_fkey'
  ) THEN
    ALTER TABLE "planned_absences" ADD CONSTRAINT "planned_absences_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
