# Audit Report: API, Database, SSR, Caching, State, UX, and Logging

**Re-verification (2025-02-24):** Codebase re-checked; all findings below confirmed. No code changes have been made. Implementation to proceed only after your confirmation.

---

**Project:** Next.js (App Router) + NestJS  
**Scope:** Performance, database efficiency, SSR/SSG, caching, React state, UX, logging.  
**Constraint:** No business logic changes; website must function exactly as before.

---

## 1. API Requests Optimization

### 1.1 Multiple Independent Requests on Page Load

**Findings:**

- **Attendance register (admin & teacher):** On load, the page triggers **4–6+ independent requests**:
  - `useGroups` / `useMyGroups` → GET groups
  - `useLessons` (today) or `useTodayLessons` → GET today’s lessons
  - `useLessons` (with date range + groupIds) → GET lessons for range
  - `useStudents` (with groupIds) → GET students
  - **N requests** via `useQueries`: one `GET /attendance/lesson/:lessonId` per filtered lesson

- **Other pages:** Dashboard, calendar, students list, etc. use multiple `useQuery` hooks in parallel. No aggregate endpoints were found that batch these into a single call.

**Recommendations:**

1. **Batch attendance by lessons (N+1):**
   - **Backend:** Add `GET /attendance/lessons?lessonIds=id1,id2,...` that returns attendance for all given lesson IDs in one response (e.g. `Record<lessonId, LessonAttendance>`).
   - **Frontend:** In `useAttendanceData.ts` and `useTeacherAttendanceData.ts`, replace `useQueries(… filteredLessons.map(lesson => ({ queryFn: () => fetchLessonAttendance(lesson.id), … })))` with a **single** `useQuery` that calls the new batch endpoint when `filteredLessons.length > 0`, and build `attendanceData` from that response.
   - This reduces **N** requests to **1** for the attendance register.

2. **Optional aggregate for attendance page:** Consider an endpoint such as `GET /attendance/register?groupIds=...&dateFrom=...&dateTo=...` that returns groups, lessons, students, and attendance in one response to cut down to a single request for the whole page (larger refactor).

### 1.2 N+1-Style Queries

**Findings:**

- **Attendance:** Confirmed N+1: one request per lesson (`fetchLessonAttendance(lesson.id)`) in both:
  - `apps/web/src/app/[locale]/(admin)/admin/attendance-register/hooks/useAttendanceData.ts`
  - `apps/web/src/app/[locale]/(teacher)/teacher/attendance-register/hooks/useTeacherAttendanceData.ts`

**Recommendations:**

- Implement the batch endpoint and single-query usage as in §1.1.

### 1.3 Response-Time Logging

**Findings:**

- **NestJS:** No global middleware or interceptor measures response time or logs it.
- **main.ts** uses `console.log` for startup messages only.
- No APM or structured “request completed in Xms” logging.

**Recommendations:**

1. Add a **global logging interceptor** (e.g. `LoggingInterceptor`) that:
   - Records start time before `next.handle()`.
   - After the response, computes duration and logs: method, path, statusCode, durationMs.
2. Use **NestJS Logger** (see §7) instead of `console.log`.
3. Optionally add a **correlation ID** (see §7) to each request and include it in this log line for traceability.

---

## 2. Database Query Optimization

### 2.1 Composite Indexes

**Findings (Prisma schema in `packages/database/prisma/schema.prisma`):**

- **Lesson:** Has `@@index([groupId])`, `@@index([teacherId])`, `@@index([scheduledAt])`. Queries that filter by `groupId` + `scheduledAt` (e.g. lessons by group and date range) would benefit from a **composite** index.
- **Attendance:** Has `@@unique([lessonId, studentId])` and `@@index([studentId])`. No standalone `@@index([lessonId])`. Lookups by `lessonId` (e.g. for batch attendance) can use the unique constraint’s index in PostgreSQL; if batch endpoint filters by `lessonId IN (...)`, consider explicitly adding `@@index([lessonId])` if the planner does not use the unique index efficiently.
- **Feedback:** Has `@@unique([lessonId, studentId])` and `@@index([teacherId])`. No separate `lessonId` index; usually the unique index suffices for lesson-based lookups.

**Recommendations:**

1. **Lesson:** Add composite index for common filter:  
   `@@index([groupId, scheduledAt])`  
   to optimize “lessons by group(s) and date range”.
2. **Attendance:** Add `@@index([lessonId])` if profiling shows slow batch-by-lesson queries.
3. Run migrations after schema change and verify query plans for heavy endpoints.

### 2.2 In-Memory vs Database-Level Sorting

**Findings:**

- **Students (teacher-scoped):** `student-query.service.ts` uses `orderBy: { user: { firstName: 'asc' } }` in `findMany` — sorting is **database-level**. No in-memory sort on large lists found there.
- **Lessons:** List endpoints use Prisma `orderBy` (e.g. `scheduledAt`). No evidence of loading full list and sorting in JS.

**Recommendations:**

- Keep sorting in the database. If any list is later sorted in the app (e.g. in a table component), prefer adding `sortBy`/`sortOrder` to the API and using DB `orderBy`.

### 2.3 Round-Trip / Teacher-Scoped Student List

**Findings:**

- **findAssignedToTeacherByUserId** (`student-query.service.ts`): Resolves teacher by `userId` (one query), then calls `findAssignedToTeacher(teacher.id, params)` which runs `findMany` + `count` in `Promise.all` — **2 queries** for the list. No N+1.
- When `groupId` is provided, there is an extra `findUnique` for the group to check `teacherId`; that’s one more round-trip but acceptable for correctness.

**Recommendations:**

- Current design is already efficient (teacher lookup + single list+count). Optional: use a raw query or a single SQL with JOINs if you need to squeeze more performance; not required for correctness.

---

## 3. SSR and Static Props

### 3.1 Current Data-Fetching

**Findings:**

- The app uses **Next.js App Router** (`app/[locale]/...`). There are **no** `getServerSideProps` or `getStaticProps` (those are Pages Router).
- All data-heavy pages (attendance, students, calendar, dashboard, etc.) are **client components** (`'use client'`) and use **React Query** (`useQuery`/`useQueries`) for fetching. No server-side `fetch` in page/layout components for these routes.
- **SEO:** Critical content (e.g. dashboard, lists) is not in the initial HTML; it appears after client-side fetch, which can hurt indexability and first-contentful paint.

**Recommendations:**

1. **Public/SEO-relevant routes:** For any route that should be indexable (e.g. marketing, public info), use **Server Components** and fetch data in the server component (or in a server layout). That way the initial HTML contains the content.
2. **Auth-protected routes:** For dashboard, admin, teacher, student panels, keeping client-side React Query is fine. Optionally, for a faster first paint:
   - Use **Server Components** for the shell and fetch a minimal payload (e.g. user, permissions) on the server; then let the client hydrate and run React Query for the rest. This requires passing auth (e.g. cookies/session) to the server.
3. Do **not** change business logic; only move data-fetching to the server where it improves SEO or perceived performance, and keep existing APIs and responses unchanged.

---

## 4. Caching Implementation

### 4.1 Server-Side (Redis)

**Findings:**

- **API:** No `CacheModule`, `@nestjs/cache-manager`, or Redis usage in `apps/api/src`. `checks.md` and docs mention Redis (e.g. `REDIS_URL`, Upstash), but the codebase does not use it.
- Repeated identical requests (e.g. same student list, same lesson, settings) always hit the database.

**Recommendations:**

1. Integrate **Redis** (e.g. `@nestjs/cache-manager` with `cache-manager-redis-store` or Upstash Redis) in the NestJS app.
2. Use it for **hot read endpoints** where traffic justifies it, e.g.:
   - System settings (`GET /settings` or similar)
   - Centers list
   - Optional: student list per teacher/group (with short TTL and cache invalidation on mutation)
3. Set a reasonable TTL (e.g. 1–5 minutes for settings, shorter for lists) and invalidate on relevant mutations (e.g. update settings → clear settings cache).

### 4.2 React Query Caching

**Findings:**

- **Default** (`query-client.tsx`): `staleTime: 5 * 60 * 1000`, `gcTime: 10 * 60 * 1000` — good.
- **Per-hook:**  
  - Centers: `staleTime: 30 * 1000` (30s).  
  - Teachers: `staleTime: 30 * 1000` (30s).  
  - Dashboard: `staleTime: 30 * 1000` (30s).  
  - Chat: many 60s, one 30s, one `staleTime: 0` (always refetch).  
  - Groups: `staleTime: 0` for one hook (always refetch).  
  - Students (one hook): 60s.  
  - Attendance: 5 min (good).  
  - Settings: 5 min (good).

**Recommendations:**

1. **Groups with `staleTime: 0`:** If the list is not updated very frequently, set `staleTime` to e.g. 60–120s and rely on `invalidateQueries` after create/update/delete to keep data fresh. This reduces unnecessary refetches when navigating.
2. **Chat:** Keep short `staleTime` for real-time feel; 30–60s is reasonable. Ensure mutations invalidate the relevant chat list/message queries.
3. **Consistency:** Document a small set of recommended values (e.g. 30s for “live” lists, 5 min for reference data) and align hooks where it makes sense without changing behavior.

---

## 5. React State Synchronization

### 5.1 Invalidation and Hooks

**Findings:**

- Mutations generally call `queryClient.invalidateQueries` with the right keys (e.g. `lessonKeys.lists()`, `studentKeys.lists()`, `attendanceKeys.lesson(id)` after mark attendance). No systematic omission found.
- **useMarkBulkAttendance** (attendance feature): invalidation uses `attendanceKeys.lesson(lessonId)`; when using a batch attendance endpoint, invalidation should include all affected lesson keys or a list key if you introduce one.

**Recommendations:**

1. After introducing the batch attendance endpoint, ensure **all** affected lesson keys are invalidated (or a shared key for “attendance for these lessons”) so the grid updates correctly.
2. Keep using `invalidateQueries` (and optional `refetchQueries`) after mutations; no change to business logic.

### 5.2 Race Conditions and Filters

**Findings:**

- Attendance hooks depend on `effectiveGroupIds`, `effectiveDateRange`, and `filteredLessons`. React Query keys include the lesson IDs, so when the user changes group or date, new queries run. No obvious race where an old response overwrites a newer one, because key identity is tied to the current filters.
- Recommendation: When switching group/date quickly, consider `enabled: effectiveGroupIds.length > 0 && …` and optional `cancelRefetch: true` or similar so that outdated fetches don’t update state (React Query v5 behavior is generally safe).

### 5.3 Bulk Delete Operations

**Findings:**

- **Lessons:** Single API call `deleteLessonsBulk(lessonIds)` → `DELETE /lessons/bulk`; one network request and proper invalidation. Good.
- **Students:** **No bulk delete endpoint.** `useStudentsPage` implements bulk delete by looping and calling `deleteStudent.mutateAsync(id)` for each id — **N sequential requests**. Same pattern in **Groups** and **Centers** (multiple sequential deletes).
- **Teachers:** Backend has `DELETE /teachers/bulk` with `deleteMany(ids)`; frontend should use it (verify teachers page uses bulk endpoint and not N calls).

**Recommendations:**

1. **Students:** Add backend `DELETE /students/bulk` (body: `{ ids: string[] }`), implement with a transaction and proper cascades (or soft delete if applicable). In the admin students page, call a single `deleteStudentsBulk(ids)` and invalidate list/detail queries once. This reduces N calls to 1 and keeps state consistent.
2. **Groups / Centers:** Similarly, add bulk delete endpoints if not present, and use one call from the UI with a single invalidation after success.
3. Keep sequential delete only where business rules require it (e.g. per-item validation); otherwise prefer batch for performance and simpler state updates.

---

## 6. User Experience (Loading States and UX)

### 6.1 Skeleton Loaders / Progressive Loading

**Findings:**

- No skeleton loaders found (`Skeleton` component or similar). Long lists (attendance grid, students table, etc.) show a single **spinner** until all data is ready.

**Recommendations:**

1. Add **skeleton loaders** for:
   - **Attendance register:** Rows for students and columns for lessons (e.g. placeholder cells) so layout is visible while attendance loads.
   - **Students table:** Table skeleton with placeholder rows.
   - **Other long lists:** Optional skeleton for lessons list, groups, etc.
2. Use the same layout as the final content (e.g. same table columns) to avoid layout shift.

### 6.2 Global Loading Indicator

**Findings:**

- No NProgress or global top-of-page loading bar. The API client (`api-client.ts`) does not trigger any global “request in progress” indicator.
- Users get no global feedback during slow or multiple parallel requests.

**Recommendations:**

1. Integrate a **global loading indicator** (e.g. **NProgress** or a thin progress bar at the top of the viewport).
2. Trigger “start” on the first request and “done” when all in-flight requests complete (e.g. by wrapping the API client or using a request counter in a context/store). Ensure it does not conflict with React Query’s own loading states.
3. Optional: show the indicator only when no component-level spinner is visible, or after a short delay (e.g. 200ms) to avoid flicker on fast requests.

### 6.3 Attendance Register Loading

**Findings:**

- **DayView** (and similarly WeekView/MonthView): A **single** spinner is shown when `isLoadingLessons || isLoadingStudents || isLoadingAttendance`. So the user sees one spinner until **all** of: groups, lessons, students, and **every** lesson’s attendance have loaded. With many lessons, this can take a long time (especially with N requests).
- **AttendanceLoadingState:** Single message: “Loading attendance records...” or “Loading lessons...”.

**Recommendations:**

1. **After** implementing the batch attendance endpoint (§1.1), the number of requests drops sharply, so the same single spinner will disappear much sooner — main UX win.
2. **Progressive loading:** Once groups and lessons and students are loaded, show the grid structure (e.g. student names + lesson columns) and fill in attendance cells as the batch response arrives, or show row/column skeletons for attendance only. That way the page feels progressive instead of one long “Loading attendance records...”.
3. Avoid showing a full-page spinner for the whole duration; prefer section-level or inline spinners/skeletons for the attendance block only when possible.

---

## 7. Logging and Error Handling

### 7.1 Consistent Logging (NestJS Logger)

**Findings:**

- **main.ts:** Uses `console.log` for startup (e.g. “Application is running on…”). No NestJS Logger.
- **Chat:** `chat.gateway.ts` and `chat.controller.ts` use `console.log` / `console.warn` / `console.error` in several places.
- **Other modules:** Many services already use `private readonly logger = new Logger(Service.name)` (e.g. SettingsService, SalaryGenerationService, MessageService, ChatListsService, PrismaService, AuthService, etc.). Inconsistent: some use Logger, some use console.

**Recommendations:**

1. Replace all **console.log / console.warn / console.error** in `apps/api/src` with **NestJS Logger** (`this.logger.log`, `this.logger.warn`, `this.logger.error`). In `main.ts`, use `Logger` from `@nestjs/common` and log startup messages there (e.g. after `app.listen()`).
2. Use **structured logging** where useful: e.g. log JSON objects `{ message, context, durationMs, ... }` so log aggregation tools can parse and filter easily.

### 7.2 Correlation IDs

**Findings:**

- No correlation or request ID is set or propagated. Logs cannot be tied to a specific request across services/layers.

**Recommendations:**

1. Add **middleware or interceptor** that:
   - Reads `X-Request-ID` from the request or generates a UUID.
   - Attaches it to the request (e.g. `request.id`) and sets `X-Request-ID` on the response.
2. Use **AsyncLocalStorage** (or similar) or pass the ID into a logger context so that all logs emitted during that request include the same correlation ID.
3. Optionally document that the frontend or gateway can send `X-Request-ID` for end-to-end tracing.

### 7.3 Error Handling (Try/Catch and HTTP Status)

**Findings:**

- **findAssignedToTeacherByUserId:** Already throws `NotFoundException('Teacher profile not found')` when teacher is null — returns **404**. Not unprotected.
- **Attendance controller getMyAttendance:** Uses `findFirst` for student; if not found, returns 200 with empty data instead of 404 — acceptable for “my attendance” (no student = empty list).
- **Attendance service:** Uses `findUnique` for lesson, teacher, student, etc.; throws `NotFoundException` or `ForbiddenException` where appropriate. No obvious uncaught Prisma errors that would result in 500 without mapping.
- **General:** Many services use `findUnique`/`findFirst` and throw NestJS HTTP exceptions when entity is missing. Some might not wrap in try/catch; if Prisma throws (e.g. connection error), it could bubble as 500.

**Recommendations:**

1. **Critical paths:** Ensure all “get by id” and “get by user” handlers that can “not find” either:
   - throw `NotFoundException` with a clear message, or  
   - return 404 with a consistent JSON shape.  
   Avoid returning 500 for “not found”.
2. **Defensive try/catch:** For controller or service methods that call Prisma in a way that might throw (e.g. unique constraint, connection errors), wrap in try/catch and map to `NotFoundException`, `ConflictException`, or `InternalServerErrorException` as appropriate, and log the error with the NestJS Logger (and correlation ID if implemented).
3. Do not change business rules — only ensure errors are caught and mapped to the correct HTTP status and that no sensitive details leak in responses.

---

## 8. Summary of Deliverables (To Implement After Confirmation)

| Area | Deliverable |
|------|-------------|
| **API** | Batch attendance endpoint `GET /attendance/lessons?lessonIds=...`; refactor admin/teacher attendance hooks to one request; add response-time logging interceptor. |
| **Database** | Add composite index `Lesson`: `@@index([groupId, scheduledAt])`; optionally `Attendance`: `@@index([lessonId])`. |
| **SSR/Static** | Use Server Components + server fetch for SEO-critical routes; keep client React Query for dashboards; no change to business logic. |
| **Caching** | Integrate Redis (e.g. `@nestjs/cache-manager`) for hot reads (e.g. settings, centers); align React Query `staleTime` (e.g. groups, chat) where too aggressive. |
| **State** | After batch attendance: invalidate all affected lesson keys; add students (and optionally groups/centers) bulk delete API + single frontend call with proper invalidation. |
| **UX** | Skeleton loaders for attendance grid and students table; global loading indicator (e.g. NProgress); progressive loading for attendance (show structure first, then cells). |
| **Logging** | Replace console with NestJS Logger; add correlation ID middleware/interceptor; structured logs; wrap critical DB calls in try/catch and map to proper HTTP status. |

---

## 9. Implementation Order Suggestion

1. **Phase 1 – Low risk, high impact**  
   - Response-time logging interceptor.  
   - NestJS Logger + correlation ID.  
   - Composite index `Lesson` (groupId, scheduledAt).  
   - React Query `staleTime` tweaks and documentation.

2. **Phase 2 – API and data**  
   - Batch attendance endpoint + frontend refactor (single query).  
   - Students (and if needed groups/centers) bulk delete endpoint + frontend.  
   - Optional: Redis for settings/centers.

3. **Phase 3 – UX**  
   - Skeleton loaders (attendance, students).  
   - Global loading indicator.  
   - Progressive loading for attendance grid.

4. **Phase 4 – Optional**  
   - SSR/Server Components for public or SEO-critical pages.  
   - Additional Redis caching and attendance aggregate endpoint.

---

**No changes have been made to the codebase.** Once you confirm this audit, implementation can proceed in the staged manner above, ensuring the website continues to function as before with no change in business logic.
