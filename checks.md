# Performance and Server-Side Checks Report

**Project:** Ilona English Center (Next.js + Nest.js)  
**Date:** 2025-02-24  
**Scope:** API performance, database queries, SSR, caching, React state, loading UX, and logs.  
**Note:** No code changes were made; this document only reports findings for discussion.

---

## 1. API Requests Performance

### Findings

- **Multiple parallel requests on page load (no batching)**  
  Several pages fire 4+ independent API calls as soon as they mount, with no single “page data” endpoint or request batching:
  - **Admin Students** (`apps/web/src/app/[locale]/(admin)/admin/students/hooks/useStudentsPage.ts`): On load, the page runs:
    - `useTeachers({ take: 50 })`
    - `useGroups({ take: 50 })`
    - `useCenters({ isActive: true })`
    - `useStudents({ ... })` (paginated)
  - **Admin Finance** (`apps/web/src/app/[locale]/(admin)/admin/finance/page.tsx`): Uses `useFinanceDashboard()`, `usePayments()`, `useSalaries()` (and related mutations). Dashboard + list data load in parallel with no single aggregated endpoint.
  - **Teacher Salary** (`apps/web/src/app/[locale]/(teacher)/teacher/salary/page.tsx`): Four parallel queries: `useMySalaries()`, `useMySalarySummary()`, `useMyDeductions()`, `useMySalaryBreakdown()`.
  - **Admin Attendance Register** (`apps/web/src/app/[locale]/(admin)/admin/attendance-register/hooks/useAttendanceData.ts`): Uses `useGroups()`, `useLessons()` (twice: today + date range), `useStudents()`, and **one `useQueries` per lesson** for attendance (`fetchLessonAttendance(lesson.id)`). So if there are 20 lessons in range, that’s **20 additional GET requests** (one per lesson) with no batch endpoint.

- **Attendance N+1-style client requests**  
  - **Location:** `useAttendanceData.ts` (admin) and `useTeacherAttendanceData.ts` (teacher).  
  - **Pattern:** `useQueries({ queries: filteredLessons.map(lesson => ({ queryKey: attendanceKeys.lesson(lesson.id), queryFn: () => fetchLessonAttendance(lesson.id), ... })) })`.  
  - **Impact:** Number of HTTP calls scales with number of lessons (e.g. 15 lessons → 15× `GET /attendance/lesson/:id`). This can cause slower initial load and more server load.  
  - **Backend:** Each call hits `GET /attendance/lesson/:lessonId`; there is no batch endpoint like `GET /attendance/lessons?ids=...` to fetch multiple lessons in one request.

- **API client behavior**  
  - **File:** `apps/web/src/shared/lib/api-client.ts`.  
  - **Positive:** Single-flight token refresh, request queue during refresh, exponential backoff (100ms → 2s), proactive refresh when token expires within 60s.  
  - **Development:** `console.log` on every request and on 401; consider reducing or gating behind a debug flag to avoid log noise.

- **No response-time or performance logging**  
  There is no middleware or interceptor that logs request duration or slow requests. Identifying slow endpoints requires external tooling (e.g. browser DevTools, APM).

### Summary

| Issue | Severity | Location |
|-------|----------|----------|
| Multiple uncoordinated requests on Students page | Medium | `useStudentsPage.ts` |
| Multiple uncoordinated requests on Finance / Salary pages | Medium | Finance & Salary pages |
| N+1-style attendance requests (one per lesson) | High | `useAttendanceData.ts`, `useTeacherAttendanceData.ts` |
| No request timing/slow-request logging | Low | API client / server |

---

## 2. Database Queries

### Findings

- **Prisma only (no raw SQL or query plans in repo)**  
  All data access goes through Prisma. There are no stored query execution plans or EXPLAIN outputs in the repo; optimization would require running EXPLAIN locally or in production.

- **Missing composite indexes (already noted in PROJECT-AUDIT.md)**  
  - **Schema:** `packages/database/prisma/schema.prisma`.  
  - **Student:** Only `@@index([groupId])` and `@@index([teacherId])`. Common filters use both (e.g. list by center/group and teacher). A composite such as `@@index([groupId, teacherId])` could help.  
  - **Lesson:** Indexes on `groupId`, `teacherId`, `scheduledAt`, `status` exist separately. Queries that filter by e.g. `groupId` + `status` or `groupId` + `scheduledAt` could benefit from composite indexes.

- **Heavy list query with in-memory sort**  
  - **File:** `apps/api/src/modules/students/student-crud.service.ts` (e.g. `findAll`).  
  - **Behavior:** For `sortBy === 'student'` or `sortBy === 'absence'`, the code uses `fetchSkip = 0` and `fetchTake = undefined`, so it fetches **all matching students**, then sorts in memory and presumably paginates in application code.  
  - **Impact:** With large datasets, this can be slow and memory-heavy. Database-level sorting with a proper index would scale better.

- **Teacher scope in students list: extra round-trips**  
  For `userRole === UserRole.TEACHER`, `findAll` does:  
  1) `prisma.teacher.findUnique({ where: { userId } })`,  
  2) `prisma.group.findMany({ where: { teacherId, isActive: true } })`,  
  then builds `where` and runs the main `findMany` + `count` + `aggregate`. So at least 3–4 DB round-trips per request. Could be reduced with a single query or a raw query that joins through group membership.

- **Connection resilience**  
  - **File:** `apps/api/src/modules/prisma/prisma.service.ts`.  
  - **Positive:** Retry with exponential backoff (150ms base, 3 retries), detection of transient errors (P1001, P1002, 10054, ECONNRESET, etc.), safe reconnect with mutex and cooldown, periodic health check (`SELECT 1` every 30s).  
  - **Risk:** PROJECT-AUDIT.md notes that connection resets (e.g. Neon/Postgres pooling) can still surface as 500s in edge cases.

### Summary

| Issue | Severity | Location |
|-------|----------|----------|
| No composite indexes for Student (groupId+teacherId) / Lesson (e.g. groupId+status) | Medium | `schema.prisma` |
| In-memory sort for student list (fetch all then sort) | Medium | `student-crud.service.ts` |
| Multiple round-trips for teacher-scoped student list | Low–Medium | `student-crud.service.ts` |
| No EXPLAIN/query plan checks in repo | Low | N/A (process to add) |

---

## 3. Server-Side Rendering (SSR)

### Findings

- **No `getServerSideProps` or `getStaticProps`**  
  The app uses the **Next.js App Router** only. A project-wide search found no usage of `getServerSideProps` or `getStaticProps`.

- **Data fetching is client-side**  
  - **Layout:** `apps/web/src/app/[locale]/layout.tsx` is a Server Component that only loads locale and messages (`getMessages()`), then wraps children in `QueryProvider`.  
  - **Pages:** All checked pages are client components (`'use client'`) and use React Query hooks (`useStudents`, `useTeachers`, etc.) for data. So **initial HTML does not include list/dashboard data**; everything loads after hydration.

- **Impact**  
  - First contentful paint can be fast (shell + layout).  
  - Time to useful content (e.g. students table, dashboard) depends on: JS load → hydrate → N parallel API calls → render.  
  - No SEO-friendly server-rendered body for admin/teacher/student dashboards (likely acceptable for an authenticated app).

- **Static params**  
  `generateStaticParams()` in the locale layout returns `locales`, so locale segments can be statically generated; no other static params were found for data-heavy routes.

### Summary

| Finding | Severity | Notes |
|---------|----------|--------|
| No SSR for page data | Informational | All data via client-side React Query |
| Locale layout uses server for i18n only | OK | No issue |
| No static generation of data pages | Informational | Consistent with client-side data |

---

## 4. Caching

### Findings

- **No server-side Redis/cache in Nest**  
  - **Search:** No `CacheModule`, `Redis`, or `@nestjs/cache-manager` in `apps/api/src`.  
  - **Env:** `env.example` mentions Redis (e.g. `REDIS_URL` for Upstash). Docs (`docs/02-TECH_STACK.md`, `docs/01-ARCHITECTURE.md`) describe Redis for caching/rate limiting.  
  - **Conclusion:** Redis is **not** used in the current API codebase. Repeated identical requests (e.g. same student list, same lesson) always hit the database.

- **React Query (client-side)**  
  - **Global defaults:** `apps/web/src/shared/lib/query-client.tsx`: `staleTime: 5 * 60 * 1000` (5 min), `gcTime: 10 * 60 * 1000` (10 min), `refetchOnWindowFocus: false`.  
  - **Overrides:** Several hooks use a shorter `staleTime`:  
    - `useCenters`: `staleTime: 30 * 1000` (30 s) — **shorter** than global.  
    - Chat: many hooks use `staleTime: 60 * 1000` (1 min).  
    - Settings: `staleTime: 5 * 60 * 1000` (5 min).  
    - Students: `staleTime: 60 * 1000` (1 min).  
  - **Impact:** Mixed stale times can cause more refetches than necessary (e.g. centers refetch every 30s while global is 5 min) and inconsistent UX. PROJECT-AUDIT.md also flags this.

- **HTTP caching**  
  - Settings logo: `Cache-Control: public, max-age=86400, must-revalidate` and cache-busting query param.  
  - Storage controller: `Cache-Control: public, max-age=31536000` for some responses.  
  - No caching headers observed for typical JSON API list/detail endpoints (expected for dynamic data).

### Summary

| Issue | Severity | Location |
|-------|----------|----------|
| Redis not used in API | Medium | Backend (env/docs only) |
| Inconsistent React Query staleTime | Medium | `query-client.tsx` vs centers, chat, students, etc. |
| No server-side cache for hot reads | Medium | API layer |

---

## 5. React State Synchronization

### Findings

- **React Query as source of truth**  
  List/detail data lives in React Query cache. Components use `data`, `isLoading`, `error` from hooks; mutations use `onSuccess` / `invalidateQueries` / `setQueryData` to keep UI in sync. No duplicate store (e.g. Zustand) for server data.

- **Correct invalidation patterns**  
  - Students: delete/update invalidate list and related caches.  
  - Chat: `useAddMessageToCache`, `useUpdateMessageInCache`, `useRemoveMessageToCache` update the messages cache and chat list so real-time and HTTP stay consistent.  
  - Centers: toggle active uses optimistic update + rollback on error.  
  - Attendance: `markBulkAttendance` invalidates `attendanceKeys.lesson(data.lessonId)` and `attendanceKeys.atRisk()`.

- **Possible race**  
  On Students page, `teachersData`, `groupsData`, `centersData`, and `studentsData` load in parallel. If a user changes filters or page before all four resolve, the combined view (e.g. filters + list) can briefly show a mix of old and new data. React Query’s keying by params minimizes this; no obvious bug found, but worth keeping in mind for very fast filter changes.

- **Bulk delete**  
  `useStudentsPage`: bulk delete runs sequential `deleteStudent.mutateAsync(id)` in a loop. Success path invalidates/refetches via mutation defaults; no manual `setQueryData` for partial success. State stays consistent; only the sequential network calls are a performance concern.

### Summary

| Finding | Severity | Notes |
|---------|----------|--------|
| State after fetch | OK | React Query + invalidation/setQueryData used correctly |
| Chat cache updates | OK | Socket + HTTP updates synced via cache helpers |
| Possible filter/page race | Low | Parallel queries; consider refetch on filter change if issues appear |

---

## 6. Loading Spinners and User Experience

### Findings

- **Loading states are wired**  
  Pages and hooks expose `isLoading` / `isPending` and pass them to layout or tables. Examples:  
  - Admin Finance: `isLoadingDashboard`, `isLoadingPayments`, `isLoadingSalaries`; stats and tables show loading.  
  - Admin Students: `isLoading` from `useStudents`; lists/board show loading.  
  - Admin Attendance: `isLoadingGroups`, `isLoadingLessons`, `isLoadingStudents`, `isLoadingAttendance`; Day/Month/Week views show `AttendanceLoadingState` when any of these are true.

- **Attendance loading UX**  
  - **Component:** `AttendanceLoadingState` shows a single spinner and text: “Loading attendance records...” or “Loading lessons...” depending on `isLoadingAttendance`.  
  - **Behavior:** Loading is true while **any** of groups, lessons, students, or per-lesson attendance queries are loading. So with many lessons, the spinner can stay visible until all N attendance requests finish.  
  - **Impact:** Users may see a spinner for several seconds on the attendance register when many lessons are in range; no skeleton or progressive loading per lesson.

- **Lesson detail**  
  - **File:** `apps/web/src/app/[locale]/(admin)/admin/calendar/[lessonId]/page.tsx` (and teacher equivalent).  
  - **Behavior:** While `isLoading`, it renders “Loading...” in the layout. No skeleton.

- **No global “request in progress” indicator**  
  There is no top-level progress bar (e.g. NProgress) or global spinner for in-flight API calls. Each page handles its own loading. Acceptable but can be improved for slow pages.

### Summary

| Finding | Severity | Location |
|---------|----------|----------|
| Loading states present | OK | Pages and hooks |
| Attendance: one spinner until all lesson requests done | Medium | `AttendanceLoadingState`, `useAttendanceData` |
| No progressive/skeleton for long lists | Low | Various pages |
| No global request indicator | Low | App-wide |

---

## 7. Logs (Server and Client)

### Findings

- **Server (NestJS)**  
  - **Logger:** Used in settings, chat (message, management, lists), finance (salary-generation), prisma (connection/retry).  
  - **Console:** `apps/api/src/modules/chat/chat.gateway.ts`: `console.log` for connect/disconnect and send message; `console.warn` for rejected connection; `console.error` for errors. `chat.controller.ts`: one `console.log` for HTTP send message.  
  - **Recommendation:** Prefer Nest `Logger` (or a single logger service) everywhere so log level and format can be controlled and production logs stay consistent.

- **Client (Next.js)**  
  - **ApiClient** (`apps/web/src/shared/lib/api-client.ts`): In development, `console.log` on every request and on 401; `console.warn` on refresh failures and token issues.  
  - **Risk:** In dev, many tabs or refresh can produce a lot of logs. No evidence of `console` in production build; Next typically strips or reduces these, but worth confirming.

- **Errors that can surface in logs**  
  - **Prisma:** Connection errors (e.g. 10054, ECONNRESET) are logged in `prisma.service.ts` (e.g. “Connection error detected”, “DB connection exhausted”).  
  - **Students:** `findAssignedToTeacherByUserId` throws `NotFoundException('Teacher profile not found')` if the teacher row is missing; no try/catch in the controller, so unhandled DB errors could still bubble as 500 and be logged by Nest. PROJECT-AUDIT.md mentions this.  
  - **Settings/Storage:** Multiple `logger.error` and `logger.warn` for logo/penalty/storage failures; good for debugging.

- **No structured/correlation logging**  
  Logs are free-form. No request ID, correlation ID, or structured (e.g. JSON) format for production. Makes it harder to trace a single request across services or to parse with log aggregators.

### Summary

| Issue | Severity | Location |
|-------|----------|----------|
| Mix of Logger and console (chat) | Low | `chat.gateway.ts`, `chat.controller.ts` |
| ApiClient verbose in dev | Low | `api-client.ts` |
| findAssignedToTeacherByUserId can 500 on DB errors | Medium | `student-query.service.ts`, controller |
| No request/correlation IDs | Low | API-wide |

---

## 8. Cross-Reference with PROJECT-AUDIT.md

The existing audit aligns with this report:

- Prisma connection reset (Error 10054) and retry logic — confirmed; risk noted.  
- Missing error handling in `/students/me/assigned` — confirmed; no try/catch around Prisma in that path.  
- React Query over-fetching on page loads — confirmed (e.g. Students page).  
- Inconsistent React Query cache (staleTime) — confirmed (e.g. centers 30s vs global 5 min).  
- Missing composite indexes — confirmed in schema.  
- No general health check — confirmed: only `GET /health/db` exists, no `GET /health` for load balancers.

---

## 9. Recommended Next Steps (for Discussion)

1. **High impact**  
   - Add a **batch attendance API** (e.g. `GET /attendance/lessons?lessonIds=id1,id2,...`) and use it in `useAttendanceData` / `useTeacherAttendanceData` to replace N requests with one.  
   - Introduce **server-side caching** (e.g. Redis) for hot read endpoints (e.g. settings, centers, or heavy list queries) if traffic justifies it.

2. **Medium impact**  
   - **Unify React Query staleTime** (e.g. align centers and others with global or a single convention).  
   - Add **composite indexes** in Prisma for Student and Lesson for common filter/sort combinations.  
   - **Students list:** Avoid fetching all rows for “student”/“absence” sort; implement DB-level sort or a bounded window.

3. **Lower impact**  
   - Add **GET /health** that returns 200 when the app is up (for load balancers).  
   - **Wrap** `findAssignedToTeacherByUserId` (and controller) in try/catch; map to 404/403 and log.  
   - Replace **console** with **Logger** in chat gateway/controller.  
   - Consider **progressive loading** or **skeletons** for attendance and heavy lists.  
   - Optionally add **request timing** or **slow-request logging** in the API client or Nest middleware.

Once you confirm which of these you want to pursue, we can turn them into concrete tasks and patches.
