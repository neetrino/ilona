# Project Diagnostic Report — Ilona English Center

**Date:** March 6, 2025  
**Scope:** Full diagnostic audit (architecture, backend, database integration, security, maintainability)  
**Method:** Codebase inspection only — no code changes, no refactors.

---

## 1. Executive Summary

### Overall verdict

The project is **professionally structured** with a clear monorepo, a dedicated NestJS backend, and a shared Prisma-based database layer. Database connection handling is **strong** and explicitly designed for Neon (retries, reconnection, health checks). The main gaps are **scalability of a few list endpoints** (in-memory sort/pagination), **one validation mismatch** (CUID vs UUID in CRM query DTO), and **runtime schema changes in application code** (settings service). With those addressed, the project is suitable for production and further scaling.

### Main strengths

- **Database connection:** Single PrismaService in NestJS with retry middleware, reconnection mutex/cooldown, startup retries, and health checks — well aligned with Neon/serverless.
- **Clear separation:** Backend is NestJS (not Next.js API routes); frontend (Next.js) does not touch the database and calls the API via a shared client.
- **Auth and guards:** Global JWT + Roles guards, `@Public()` for health/warmup, rate limiting, production error filter (no stack in response body).
- **Validation:** Global `ValidationPipe` with `whitelist` and `forbidNonWhitelisted`; DTOs use class-validator widely.
- **Transactions:** Used where needed (student create, lead status change, teacher/group updates, settings).
- **Raw SQL:** Tagged template literals only (`$queryRaw\`...\``) — no string concatenation; SQL injection risk is low.

### Main weaknesses

- **Teachers list:** No server-side pagination — loads all teachers then in-memory sort and slice (`teacher-crud.service.ts`).
- **Students list:** When `sortBy` is `student` or `absence`, the service fetches **all** matching students (no `take`), then sorts and paginates in memory — risk of high memory and response time at scale.
- **CRM query DTO:** `centerId`, `teacherId`, `groupId` use `@IsUUID()` but schema uses CUID — valid CUIDs can be rejected.
- **Settings service:** Runtime `ALTER TABLE` and column checks in app code instead of migrations-only — fragile and not standard practice.

### Engineering maturity level

**Acceptable to Strong.** The foundation (architecture, DB layer, auth, validation, error handling) is solid. The issues above are localized and fixable without structural changes.

---

## 2. Stack and Architecture Overview

### Detected stack

| Layer        | Technology |
|-------------|------------|
| Monorepo    | pnpm workspaces, Turbo |
| Frontend    | Next.js 15, React 19, TanStack Query, Zustand |
| Backend     | **NestJS 10** (separate app, not Next.js API routes) |
| Database    | PostgreSQL (Neon); Prisma 5 in `packages/database` |
| Shared      | `@ilona/database` (Prisma client + schema types), `@ilona/types` |

**Note:** The task stated "Backend: Next.js"; the actual backend is **NestJS** (`apps/api`). The Next.js app (`apps/web`) is frontend-only and does not host API routes that access the database (except a cron proxy that calls the NestJS warmup endpoint).

### High-level architecture

- **apps/api:** NestJS app; single entry `main.ts`, `AppModule` imports `ConfigModule`, `PrismaModule` (global), `RequestContextModule`, and feature modules (auth, users, centers, groups, lessons, attendance, students, teachers, chat, finance, analytics, notifications, storage, feedback, settings, CRM).
- **apps/web:** Next.js with app router; uses `getApiBaseUrl()` and a shared `api` client to call the NestJS API (e.g. `http://localhost:4000/api` in dev). No Prisma or direct DB usage.
- **packages/database:** Prisma schema, generated client under `src/generated/client`, and `src/index.ts` that exports the client and a **singleton** (`globalForPrisma`) for non-production. The **NestJS API does not use this singleton** — it uses its own `PrismaService` (extends `PrismaClient`) provided by `PrismaModule`.
- **Responsibility split:** Clear: API = business logic and DB access; Web = UI and API consumption. No DB logic in the UI layer.

### Architectural observations

- Module boundaries are clear (per-domain controllers, services, DTOs).
- No circular dependencies observed between modules; each feature module depends on `PrismaModule` and shared common (guards, decorators, filters).
- Some service files are large (e.g. `teacher-crud.service.ts`, `student-crud.service.ts`, `leads.service.ts`, `chat-lists.service.ts`) but remain single-responsibility per domain; consider splitting only if they grow further.

---

## 3. Database Connection Review

This section details how the database is connected and used, and whether it is correct for Next.js (frontend) + NestJS (backend) + Neon.

### Where the database is used

- **NestJS API (`apps/api`):** All persistent data access goes through **PrismaService** (in `apps/api/src/modules/prisma/prisma.service.ts`). No other Prisma client is used in the API.
- **Next.js (`apps/web`):** Does **not** import `@ilona/database` or Prisma. No DB connection from the web app.
- **Scripts:** `packages/database/prisma/seed.ts` creates a **new `PrismaClient()`** locally, runs the seed, then calls `$disconnect()`. It does not use the package singleton.

### How the API connects (PrismaService)

- **Initialization:** `PrismaService` extends `PrismaClient` and is provided by `PrismaModule`, which is `@Global()` and exported. One instance per NestJS application.
- **Constructor:** Calls `super()` with log options (e.g. `['warn','error']` in dev, `['error']` otherwise). No explicit `datasourceUrl` — Prisma reads `DATABASE_URL` from the environment (loaded via `main.ts` dotenv and NestJS `ConfigModule`).
- **Lifecycle:**
  - `onModuleInit()`: Registers a metrics middleware (query count/latency into `RequestContextService`), then calls `await this.$connect()` with **startup retries** (6 attempts with delays 5s, 5s, 10s, 15s, 20s, 25s) for Neon cold start. Then starts a **periodic health check** (every 30s) that runs `SELECT 1` and skips when the server has been idle for 2 minutes.
  - `onModuleDestroy()`: Clears the health-check interval and calls `await this.$disconnect()`.
- **Retry and reconnection:**
  - A **Prisma middleware** wraps all operations with `withRetry()` (transient connection errors only). On retry it calls `safeReconnect()` (disconnect + short delay + `$connect`) and uses a **mutex** and **cooldown** (2s) to avoid reconnect storms.
  - `prismaWithRetry()` is available for explicit retry (e.g. 503 after 3 attempts). Transient detection includes Prisma codes (e.g. P1001, P1002, P1008, P1017), Windows 10054, and common network codes (ECONNRESET, ETIMEDOUT, etc.).

### Prisma schema (Neon)

- **Schema** (`packages/database/prisma/schema.prisma`):
  - `url = env("DATABASE_URL")` — pooled connection for the app (Neon pooler).
  - `directUrl = env("DIRECT_URL")` — direct connection for migrations.
- This matches Neon’s recommendation: pooled URL for runtime, direct URL for migrations.

### Connection reuse and pooling

- **Single client:** One `PrismaService` instance per process. All services inject this same instance. No per-request client creation.
- **Pooling:** Prisma (and thus Neon’s pooled endpoint) manages the connection pool. The API does not create additional pools or clients.
- **Safe for serverless:** The NestJS app runs as a long-lived process (e.g. on Render), not as per-request serverless. For that model, one shared client with retry/reconnect is appropriate. If the API were ever deployed as serverless (e.g. Lambda), the package’s singleton pattern in `packages/database/src/index.ts` could be used there; currently the API does not use that export.

### Environment and secrets

- **Loading:** `main.ts` loads `.env.local` (and fallback `.env`) from several possible paths (root, `apps/api`, `dist`). `ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.local', '.env'] })` is used.
- **Production:** `main.ts` checks that `DATABASE_URL` is set and warns if `sslmode=` or (for Neon) `connect_timeout=` is missing or too low.
- **Secrets:** No hardcoded DB URLs or credentials in the repo. Env vars are the single source; no evidence of logging or exposing connection strings.

### Risks and recommendations

| Topic | Status | Note |
|-------|--------|------|
| Multiple clients per process | **OK** | Single PrismaService; no duplicate clients. |
| Connection reuse | **OK** | One instance, proper lifecycle. |
| Neon pooling | **OK** | `DATABASE_URL` for app, `DIRECT_URL` for migrations. |
| Retry / reconnect | **Strong** | Middleware + safeReconnect with mutex/cooldown. |
| Startup / cold start | **OK** | Startup retries and Neon timeout warnings. |
| Env / secrets | **OK** | No hardcoded secrets; production checks present. |
| Next.js and DB | **N/A** | Next.js does not connect to the DB. |

**Conclusion:** Database connection handling is **professional and appropriate** for NestJS + Neon. Connection reuse is safe; retry and reconnection logic are above average. No changes required for correctness; optional improvement: document recommended `connect_timeout` and `sslmode=require` for production in a runbook or env template.

---

## 4. Detailed Findings

| Severity | Area | Finding | Evidence | Why it matters | Recommended fix |
|----------|------|---------|-----------|----------------|------------------|
| **High** | Backend / scalability | Teachers list loads all rows then paginates in memory | `apps/api/src/modules/teachers/teacher-crud.service.ts`: `findMany` has no `skip`/`take`; later `finalSortedTeachers.slice(skip, skip + take)` | With many teachers, memory and CPU grow unbounded; slow responses | Add `skip`/`take` to the initial `findMany` where sort is DB-expressible; for sorts that require aggregates (e.g. student count), consider a materialized view, raw query, or capped in-memory sort (e.g. max 500) with pagination in DB. |
| **High** | Backend / scalability | Students list can fetch all matching rows when sorting by name or absence | `apps/api/src/modules/students/student-crud.service.ts`: when `sortBy === 'student' \|\| sortBy === 'absence'`, `fetchTake = undefined` so `findMany` returns all matching students, then in-memory sort and slice | Same as above: memory and latency at scale | Cap `fetchTake` (e.g. 1000) when `shouldSortInMemory`, or implement DB-side ordering (e.g. order by user firstName/lastName) and compute absence in a follow-up query for the current page only. |
| **Medium** | Validation | CRM query DTO uses @IsUUID() for IDs that are CUIDs | `apps/api/src/modules/crm/dto/query-lead.dto.ts`: `centerId`, `teacherId`, `groupId` use `@IsUUID()`; schema uses `@id @default(cuid())` | Valid CUIDs (e.g. `clxx...`) fail validation; filters may not work | Replace with `@IsString()` and optional `@Matches(/^c[a-z0-9]{24,}$/)` or a custom CUID validator, or document that only UUIDs are accepted and align schema to UUID if intended. |
| **Medium** | Backend / schema | Settings service runs ALTER TABLE at runtime | `apps/api/src/modules/settings/settings.service.ts`: `ensureLogoUrlColumn()` and `ensurePenaltyColumns()` run `$queryRaw`/`$executeRaw` to add columns if missing | Mixing migrations with app logic; race conditions and drift between environments | Move all schema changes to Prisma migrations; remove runtime ALTER from the service and rely on migrations for new columns. |
| **Medium** | Backend / performance | Lesson count per group done in a loop (N queries) | `apps/api/src/modules/students/student-crud.service.ts`: `uniqueGroupIds.map(async (groupId) => this.prisma.lesson.count(...))` in `Promise.all` | One query per group; acceptable for small N, scales poorly with many groups | Replace with a single query: e.g. `groupBy` by `groupId` with `_count` and filter by `groupId: { in: uniqueGroupIds }` and date range. |
| **Low** | Backend / API design | Salary records list uses hardcoded take: 500 | `apps/api/src/modules/finance/finance.controller.ts`: `findAllRecordsByTeacher(teacher.id, { take: 500 })` | Unbounded growth over time; 500 is a hidden cap | Add query params (skip/take) and/or a max cap (e.g. 100) in DTO; document or enforce in service. |
| **Low** | Config | No .env.example in repo | No `.env.example` or `.env.sample` found in root or apps | New devs may miss required vars (DATABASE_URL, DIRECT_URL, JWT, etc.) | Add `.env.example` with all required keys (values redacted) and document in README. |
| **Info** | Package export | packages/database exports a singleton not used by API | `packages/database/src/index.ts`: `globalForPrisma` singleton; API uses only NestJS PrismaService | No bug; potential confusion or future misuse if someone imports the package in API | Document that the API must use PrismaService; keep singleton for scripts or future serverless if needed. |

---

## 5. Database Design and Query Review

### Schema quality

- **Naming:** Table names are plural and mapped with `@@map` (e.g. `users`, `centers`, `crm_leads`). Field names are camelCase in Prisma, consistent.
- **Constraints:** Primary keys (`@id`), uniques (e.g. `User.email`, `Payment.(studentId, month)`), and foreign keys with `onDelete` (Cascade/SetNull) are defined. Composite indexes exist where used (e.g. `lessons_groupId_scheduledAt_idx`, `attendances_lessonId_idx` in migration `20260224120000_add_composite_indexes`).
- **Timestamps:** `createdAt`/`updatedAt` used consistently. No dedicated soft-delete field; deletes are hard deletes.
- **Nullable vs required:** Aligns with domain (e.g. optional `Student.leadId`, `CrmLead.teacherId`). No obvious mistakes.
- **SystemSettings:** Single-row pattern; seed uses `id: 'default'` for upsert — valid and clear.

### Query quality and performance

- **Pagination:** Most list endpoints use `skip`/`take` and return `total`/`pageSize`/`totalPages` (e.g. leads, payments, deductions, centers, groups, lessons, students when not using in-memory sort). Exception: teachers list and students list with name/absence sort (see table above).
- **Select/include:** Services generally use `include` or `select` to limit fields and avoid over-fetching (e.g. student list includes user, group, teacher with limited fields).
- **N+1:** One confirmed pattern: student list attendance uses `Promise.all(uniqueGroupIds.map(...))` for lesson counts — **Likely issue**; rest of student list uses `groupBy` for absences and a single aggregate for fees, which is good.
- **Transactions:** Used for multi-step writes (student create with user + student + chat participant; lead status change; teacher create/update; group delete; settings updates). No missing transaction identified for operations that require atomicity.
- **Chat lists:** `take: 100` used in several places to cap result sets — good.

### Data integrity

- FKs and cascades are defined; Prisma enforces them. No raw SQL that bypasses constraints. Unique constraints (e.g. one payment per student per month) are in the schema and enforced by the DB.

---

## 6. Security and Validation Review

### Validation

- **Global:** `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` — strips unknown properties and rejects invalid payloads.
- **DTOs:** class-validator and class-transformer used across modules (e.g. `CreateLeadDto`, `QueryLeadDto`, `QueryStudentDto`, `CreateStudentDto`). Query DTOs use `@Type(() => Number)`, `@Min`/`@Max` for skip/take (e.g. take 1–100 for students/leads).
- **Weak spot:** CRM `QueryLeadDto` uses `@IsUUID()` for IDs that are CUIDs (see table above).

### Query safety

- **ORM:** Prisma is used for all DB access in the API; parameters are bound. No raw string concatenation for SQL.
- **Raw SQL:** Only `$queryRaw`/`$executeRaw` with **tagged template literals** (e.g. `$queryRaw\`SELECT 1\``, `$executeRaw\`ALTER TABLE ...\``). No user input interpolated into raw SQL — **SQL injection risk is low**.

### Secrets and access control

- **Secrets:** No hardcoded credentials. Env vars for DB, JWT, etc. Production bootstrap validates `DATABASE_URL`.
- **Auth:** All non-public routes go through `JwtAuthGuard` and `RolesGuard`. Health and warmup are `@Public()`. Controllers use `@Roles(UserRole.ADMIN, ...)` where needed.
- **Cron:** Next.js route `apps/web/src/app/api/cron/warmup/route.ts` checks `CRON_SECRET` when set (Bearer token). Good practice.

### Data exposure

- Exception filter in production returns only `statusCode` and `message` (no stack). No evidence of leaking internal errors or query details to the client.

---

## 7. Professionalism Assessment

| Dimension | Score (1–10) | Justification |
|-----------|--------------|----------------|
| **Architecture** | 8 | Clear monorepo, separated frontend/backend, modular NestJS; a few large service files. |
| **Backend structure** | 8 | Controllers → services → Prisma; DTOs and validation; some in-memory pagination and runtime schema logic. |
| **Database integration** | 9 | Single client, retry/reconnect, Neon-aware config, transactions where needed; no misuse. |
| **Security hygiene** | 8 | Auth/roles, rate limiting, validation, safe raw SQL, production error filter; CUID vs UUID in one DTO. |
| **Maintainability** | 7 | Consistent patterns and naming; settings service runtime migrations and a few complex services reduce clarity. |
| **Scalability** | 6 | Teachers and students (name/absence sort) lists do not scale with row count; rest is paginated. |
| **Production readiness** | 8 | Env checks, health/warmup, logging, no stack in responses; recommend .env.example and fixing high/medium findings. |

---

## 8. Final Verdict

- **Is this project professionally built?**  
  **Yes.** Structure, backend patterns, database layer, and security measures are at a professional level. A few localized issues (scalability of two list endpoints, one DTO validator, runtime schema changes) do not undermine the overall quality.

- **Is the DB layer professionally implemented?**  
  **Yes.** Single PrismaService, correct Neon setup (pooled + direct URL), retry and reconnection with mutex/cooldown, health checks, and lifecycle handling are above average. No per-request clients, no connection leaks, no unsafe raw SQL.

- **Can this safely scale further in current form?**  
  **Partly.** It can scale in terms of traffic and connection handling. The teachers list and students list (with name/absence sort) will not scale well with large datasets until server-side pagination and/or capped or DB-side sorting are in place.

- **Top 5 things to fix first**
  1. **Teachers list:** Add DB-level pagination (and/or capped in-memory sort) so the list never loads all teachers.
  2. **Students list:** When sorting by student name or absence, cap the fetch (e.g. 1000) or implement DB-side ordering and per-page absence computation.
  3. **CRM QueryLeadDto:** Change `centerId`/`teacherId`/`groupId` from `@IsUUID()` to a CUID-compatible validator (or align IDs to UUID if that is the product decision).
  4. **Settings service:** Remove runtime `ALTER TABLE` / column checks; rely only on Prisma migrations for schema changes.
  5. **Documentation / onboarding:** Add `.env.example` and short notes on required env vars and recommended Neon settings (e.g. `connect_timeout`, `sslmode=require`).

---

## 9. Priority Action Plan

### Immediate (before or soon after production)

1. **Fix CRM lead query validation:** Update `apps/api/src/modules/crm/dto/query-lead.dto.ts` to accept CUIDs (e.g. `@IsString()` + optional regex or custom validator) for `centerId`, `teacherId`, `groupId`.
2. **Cap or fix students list when sorting by name/absence:** Either cap `fetchTake` (e.g. 1000) when `shouldSortInMemory` in `student-crud.service.ts`, or implement DB ordering and per-page attendance so that all matching rows are never loaded.
3. **Remove runtime schema changes from settings:** Move any missing columns (logoUrl, penalty columns) into a Prisma migration; remove `ensureLogoUrlColumn()` and `ensurePenaltyColumns()` from `settings.service.ts` (or make them no-ops once migrations are applied everywhere).

### Next (short term)

4. **Teachers list scalability:** Add `skip`/`take` to the teachers `findMany` and implement server-side pagination. For sorts that need aggregates (e.g. student count), either accept DB-order where possible or introduce a bounded in-memory window (e.g. fetch at most 500, then sort and slice).
5. **Salary records endpoint:** Add query params (skip/take) and/or a documented max cap for `findAllRecordsByTeacher` in the finance controller/service.
6. **Add `.env.example`:** List `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `API_PORT`, `CORS_ORIGIN`, `NEXT_PUBLIC_API_URL`, `CRON_SECRET`, etc., with placeholder values and a short README section.

### Later (improvements)

7. **Student list lesson counts:** Replace the per-group `lesson.count` loop in `student-crud.service.ts` with a single grouped query (e.g. `lesson.groupBy` by `groupId` with date filter, then map to students).
8. **Document DB connection:** In a runbook or architecture doc, state that the API uses a single PrismaService, that Neon pooled URL is for runtime and direct URL for migrations, and recommend `connect_timeout` and `sslmode=require` for production.
9. **Optional:** Split the largest services (e.g. teacher-crud, student-crud, leads, chat-lists) into smaller units (e.g. query vs command) if they continue to grow.

---

*End of report. All conclusions are based on the codebase as inspected; no assumptions were made without evidence.*
