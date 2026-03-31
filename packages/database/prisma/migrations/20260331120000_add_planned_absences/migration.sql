-- CreateTable
CREATE TABLE "planned_absences" (
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
CREATE INDEX "planned_absences_studentId_idx" ON "planned_absences"("studentId");

-- CreateIndex
CREATE INDEX "planned_absences_date_idx" ON "planned_absences"("date");

-- CreateIndex
CREATE UNIQUE INDEX "planned_absences_studentId_date_key" ON "planned_absences"("studentId", "date");

-- AddForeignKey
ALTER TABLE "planned_absences" ADD CONSTRAINT "planned_absences_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
