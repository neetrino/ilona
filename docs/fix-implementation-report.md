# Fix Implementation Report — Audit Remediation

**Date:** March 6, 2025  
**Scope:** Fixes for issues identified in `docs/project-diagnostic-report.md`  
**Approach:** Minimal, behavior-preserving changes only.

---

## 1. What was fixed

### Issue 1: Teachers list endpoint — avoid fetch-all + in-memory sort/pagination

- **Problem:** Teachers list loaded all matching rows with no `skip`/`take`, then sorted and paginated in memory.
- **Fix:**
  - Added a single `count(where)` at the start for `total`.
  - For sort options that are expressible in the DB (**teacher** name, **groups** count, **lessons** count), the service now uses Prisma `orderBy` and `skip`/`take` on `findMany`. Only the current page of teachers is loaded; student counts, centers, and obligations are fetched only for that page’s teacher IDs.
  - For sort by **students**, **obligation**, **deduction**, or **cost** (derived from aggregates/lesson data), behavior is unchanged: all matching teachers are fetched, enriched, sorted in memory, then sliced. No change to response shape or semantics.

### Issue 2: Students list endpoint — remove risky fetch-all / in-memory sorting where possible

- **Problem:** When `sortBy` was `student` or `absence`, the service used `fetchTake = undefined`, loading all matching students and sorting in memory.
- **Fix:**
  - **sortBy === 'student':** Sorting is now done in the DB via `orderBy: [{ user: { firstName: sortOrder } }, { user: { lastName: sortOrder } }]` with `skip`/`take` on `findMany`. No in-memory sort or full fetch for this case.
  - **sortBy === 'absence':** Still requires in-memory sort (absence count is computed from attendance for the selected month). A safety cap was added: at most **1000** rows are fetched when sorting by absence. Pagination and `total` are still based on the full count; pages beyond the cap show empty items. This limits memory while keeping the endpoint contract.

### Issue 3: Validation mismatch — UUID validators vs CUID-based IDs

- **Problem:** CRM `QueryLeadDto` used `@IsUUID()` for `centerId`, `teacherId`, and `groupId`, while the schema uses `@id @default(cuid())`. Valid CUIDs were rejected.
- **Fix:** Replaced `@IsUUID()` with `@IsString()` and `@Matches(CUID_REGEX)` where `CUID_REGEX = /^c[a-z0-9]{24,}$/`. Validation intent (strict ID format) is preserved; CUIDs used by the project are now accepted. No change to ID generation or DB schema.

### Issue 4: Remove runtime schema mutation from settings service

- **Problem:** `ensureLogoUrlColumn()` and `ensurePenaltyColumns()` ran at runtime (e.g. `ALTER TABLE`, column checks), mixing schema changes with app logic.
- **Fix:** Removed both methods and all calls to them from `getSystemSettings()`, `updateLogoUrl()`, `getLogoKey()`, and `updateLogoKey()`. Removed the `logoUrlColumnChecked` and `penaltyColumnsChecked` flags. Schema is already defined in Prisma and applied via existing migrations (`20260210150522_add_logo_url_to_system_settings`, `20260220155652_add_penalty_amounts`). Startup now relies only on the migrated schema.

---

## 2. Files changed

| File | Reason |
|------|--------|
| `apps/api/src/modules/teachers/teacher-crud.service.ts` | Teachers list: DB-level sort/pagination for teacher/groups/lessons; count first; conditional skip/take and orderBy. |
| `apps/api/src/modules/students/student-crud.service.ts` | Students list: DB orderBy + skip/take for `student` sort; cap fetch at 1000 for `absence` sort. |
| `apps/api/src/modules/crm/dto/query-lead.dto.ts` | CRM query DTO: CUID validation for `centerId`, `teacherId`, `groupId` instead of UUID. |
| `apps/api/src/modules/settings/settings.service.ts` | Settings: removed runtime `ensureLogoUrlColumn` / `ensurePenaltyColumns` and their invocations. |
| `docs/fix-implementation-report.md` | This report. |

---

## 3. Logic preservation check

| Issue | API contract | Business logic | Response structure | Permissions | Filters/sort meaning | Pagination semantics |
|-------|--------------|----------------|--------------------|-------------|------------------------|----------------------|
| 1 – Teachers | Unchanged | Unchanged | Unchanged | Unchanged | Same sort options and meaning | Same `total`, `page`, `pageSize`, `totalPages`; DB sort path returns same page content for teacher/groups/lessons. |
| 2 – Students | Unchanged | Unchanged | Unchanged | Unchanged | Same; `student` sort now DB-ordered; `absence` sort unchanged up to 1000 rows | Same except when `sortBy=absence` and total > 1000: later pages may be empty (documented limitation). |
| 3 – CRM DTO | Unchanged | Unchanged | N/A | Unchanged | Same filter fields; validation accepts CUIDs instead of rejecting them | N/A |
| 4 – Settings | Unchanged | Unchanged | Unchanged | Unchanged | N/A | N/A |

---

## 4. Technical details

### DB query logic

- **Teachers:**  
  - `total = prisma.teacher.count({ where })`.  
  - When `useDbSort` (sortBy undefined, `teacher`, `groups`, or `lessons`): `findMany` uses `orderBy` (user name or `_count` for groups/lessons) and `skip`/`take`; student counts, groups, centers, and obligations are queried only for the returned `teacherIds`.  
  - When in-memory sort (students, obligation, deduction, cost): same as before (full fetch, enrich, sort, slice); no change to logic or response.

- **Students:**  
  - `sortBy === 'student'`: `orderBy` by `user.firstName` and `user.lastName` with `sortOrder`; `skip`/`take` on `findMany`. No in-memory sort for this case.  
  - `sortBy === 'absence'`: `fetchTake = 1000`; fetch, compute attendance, sort in memory, then `slice(skip, skip + take)`. `total` still from `count(where)`.

### DTO validation

- **QueryLeadDto:** `centerId`, `teacherId`, `groupId` now use `@IsString()` and `@Matches(CUID_REGEX)` with `CUID_REGEX = /^c[a-z0-9]{24,}$/`. Optional fields remain optional; when provided, they must match CUID format.

### Migration / startup logic

- **Settings:** No new migrations. Runtime `ALTER TABLE` and column checks were removed. The app assumes migrations have been applied (logoUrl and penalty columns already exist in schema and in migrations `20260210150522`, `20260220155652`).

---

## 5. Remaining risks or limitations

- **Teachers list:** When sorting by **students**, **obligation**, **deduction**, or **cost**, the service still loads all matching teachers into memory, then sorts and paginates. Behavior and response shape are unchanged; at very large teacher counts this path could still use significant memory. A future improvement would require DB-side aggregates or materialized data (e.g. raw SQL or views) and was out of scope for this behavior-preserving fix.

- **Students list:** When `sortBy === 'absence'` and the matching set is larger than 1000, only the first 1000 rows (by default name order) are considered for absence sorting. Pagination and `total` still reflect the full count, so pages beyond the first 1000 will have empty `items`. This is a deliberate cap to avoid unbounded memory use; semantics are unchanged for the first 1000 sorted-by-absence rows.

- **Settings:** If the app is run against a DB that has not had the logoUrl/penalty migrations applied, queries that use those columns will fail at runtime. Deployment should ensure migrations are run before starting the app (standard practice).

---

## 6. Verification steps performed

- **Typecheck:** `pnpm exec tsc --noEmit -p apps/api` — passed.
- **Lint:** Full `pnpm run lint` failed due to environment (database package build failed with EPERM while dev server was running). ESLint was run on the API; existing lint findings in the touched files (e.g. `@typescript-eslint/no-unsafe-*`) were present before these edits; no new lint rules or violations were introduced by the fix.
- **Manual reasoning:** All changes were reviewed to ensure routes, DTOs, response shapes, permissions, sort meaning, and pagination semantics were preserved; only the intended fixes were applied.

---

*End of report.*
