# Final Prisma Migration Recovery Plan

## Root causes

- **Enum cleanup migrations** that removed `AGREED` and `PROCESSING` from `CrmLeadStatus` were applied in an order or state that left `_prisma_migrations` out of sync with the actual schema and data.
- **Automatic rollback-on-deploy** (via `migrate-deploy-with-resolve.js`) was marking migrations as rolled back or reapplying them during deploy, which further corrupted migration history.
- **Data migrations** that update existing rows by status needed to use `"status"::text = 'AGREED'` (and similar) so they remain valid after the enum values are removed; any use of `WHERE "status" = 'AGREED'` after enum change would be unsafe or invalid.

## Files changed

| File | Change |
|------|--------|
| `packages/database/prisma/migrations/20260304180000_remove_agreed_from_crm_lead_status/migration.sql` | Contents set to data-only UPDATE mapping AGREED → FIRST_LESSON (already correct). |
| `packages/database/prisma/migrations/20260304190000_remove_processing_from_crm_lead_status/migration.sql` | Contents set to data-only UPDATE mapping PROCESSING → PAID (already correct). |
| `packages/database/prisma/migrations/20260305130000_clean_agreed_processing_from_crm_activities/migration.sql` | Contents set to data migrations for `crm_leads` and `crm_lead_activities.payload` (AGREED→FIRST_LESSON, PROCESSING→PAID) with consistent `jsonb_set` form. |
| `packages/database/prisma/migrations/20260305120000_add_teacher_approved_at_crm_lead/migration.sql` | Contents set to `ADD COLUMN IF NOT EXISTS "teacherApprovedAt"` (already correct). |
| `packages/database/package.json` | `db:migrate` script changed from `node scripts/migrate-deploy-with-resolve.js` to `prisma migrate deploy`. |

The script `scripts/migrate-deploy-with-resolve.js` is **not** deleted but is no longer used for the default production deploy.

## Why automatic rollback-on-deploy was unsafe

- **Non-idempotent history edits**: Automatically resolving or rolling back migrations during every deploy can mark migrations as rolled back or applied based on heuristics, not on what actually ran in each environment.
- **Divergent history across envs**: Different deploys (or retries) could leave production, staging, and CI with different `_prisma_migrations` state, making future migrations and rollbacks unpredictable.
- **No single source of truth**: Recovery should be a one-time, explicit operation (e.g. `prisma migrate resolve`) run by an operator after verifying state, not a script that runs on every deploy.

## One-time production recovery commands

Run these **once** in the production database context (e.g. from `packages/database` with production `DATABASE_URL`), in this order:

```bash
# 1. Mark the additive migration as applied (if it already ran or column exists)
prisma migrate resolve --applied 20260305120000_add_teacher_approved_at_crm_lead

# 2. Mark the two enum-cleanup migrations as rolled back so they can be re-applied cleanly
prisma migrate resolve --rolled-back 20260304180000_remove_agreed_from_crm_lead_status
prisma migrate resolve --rolled-back 20260304190000_remove_processing_from_crm_lead_status

# 3. Run pending migrations (will re-apply the fixed migrations)
prisma migrate deploy
```

**Note:** Resolve `20260305130000_clean_agreed_processing_from_crm_activities` **only if** it is actually in a failed or inconsistent state (e.g. recorded as failed in `_prisma_migrations` or never applied but data already migrated). If it is already applied and consistent, do **not** run `prisma migrate resolve` for it. If you need to mark it as rolled back to re-run it:

```bash
prisma migrate resolve --rolled-back 20260305130000_clean_agreed_processing_from_crm_activities
```

Then run `prisma migrate deploy` again. Use only when you have confirmed the migration is in a failed or needs-reapply state.

## Verification checklist

- [ ] `_prisma_migrations` in production has no failed rows for these migration names, or you have run the appropriate `prisma migrate resolve` steps above.
- [ ] `prisma migrate status` in production shows all migrations applied (or only the ones you intend to run).
- [ ] Column `crm_leads.teacherApprovedAt` exists and is nullable.
- [ ] Enum `CrmLeadStatus` no longer contains `AGREED` or `PROCESSING` in the Prisma schema and in the database.
- [ ] No rows in `crm_leads` have `status` equal to `AGREED` or `PROCESSING` (all mapped to `FIRST_LESSON` or `PAID`).
- [ ] Deploys use `prisma migrate deploy` only (no automatic resolve/rollback script in the default pipeline).
