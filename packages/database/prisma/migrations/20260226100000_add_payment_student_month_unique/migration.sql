-- 1) Remove duplicate payments per (studentId, month), keeping one per group (smallest id).
WITH keep_ids AS (
  SELECT MIN(id) AS id
  FROM "payments"
  GROUP BY "studentId", EXTRACT(YEAR FROM month), EXTRACT(MONTH FROM month)
),
duplicate_ids AS (
  SELECT p.id
  FROM "payments" p
  WHERE p.id NOT IN (SELECT id FROM keep_ids)
)
DELETE FROM "payments"
WHERE id IN (SELECT id FROM duplicate_ids);

-- 2) Normalize month to first day of month in UTC (so unique constraint is consistent).
UPDATE "payments"
SET "month" = (date_trunc('month', "month" AT TIME ZONE 'UTC') AT TIME ZONE 'UTC');

-- 3) Create unique index: one payment per student per month.
CREATE UNIQUE INDEX IF NOT EXISTS "payments_studentId_month_key" ON "payments"("studentId", "month");
