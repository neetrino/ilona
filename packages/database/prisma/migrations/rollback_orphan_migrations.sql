-- Run this ONLY if your DB has migration records for migrations that no longer exist in code
-- (e.g. you reverted git and removed a migration folder, but it was already applied to DB).
--
-- This removes the record from _prisma_migrations so Prisma no longer expects that migration.
-- Your data stays as-is (e.g. FIRST_LESSON/PAID are valid in current schema).
--
-- Replace or add migration_name values as needed. Run in DB client (psql, Prisma Studio, etc.).

-- DELETE FROM _prisma_migrations
-- WHERE migration_name = '20260305130000_clean_agreed_processing_from_crm_activities';
