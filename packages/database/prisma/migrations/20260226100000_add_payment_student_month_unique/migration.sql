-- CreateIndex: Prevent duplicate payments for the same student and month
CREATE UNIQUE INDEX IF NOT EXISTS "payments_studentId_month_key" ON "payments"("studentId", "month");
