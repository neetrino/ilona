-- Keep one payment per (studentId, calendar year, calendar month); delete the rest.
-- Keeps the row with smallest id per group (earliest created).
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

-- Normalize month to first day of month in UTC (matches backend startOfMonth UTC)
UPDATE "payments"
SET "month" = (date_trunc('month', "month" AT TIME ZONE 'UTC') AT TIME ZONE 'UTC');
