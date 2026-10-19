CREATE TABLE "daily_plan_comments" (
    "id" TEXT NOT NULL,
    "dailyPlanId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_plan_comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "parent_quarterly_reports" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "quarterKey" TEXT NOT NULL,
    "parentEmail" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parent_quarterly_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "daily_plan_comments_dailyPlanId_idx" ON "daily_plan_comments"("dailyPlanId");

CREATE INDEX "parent_quarterly_reports_quarterKey_idx" ON "parent_quarterly_reports"("quarterKey");

CREATE UNIQUE INDEX "parent_quarterly_reports_studentId_quarterKey_key" ON "parent_quarterly_reports"("studentId", "quarterKey");

ALTER TABLE "daily_plan_comments" ADD CONSTRAINT "daily_plan_comments_dailyPlanId_fkey" FOREIGN KEY ("dailyPlanId") REFERENCES "daily_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "daily_plan_comments" ADD CONSTRAINT "daily_plan_comments_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "parent_quarterly_reports" ADD CONSTRAINT "parent_quarterly_reports_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
