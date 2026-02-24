# Բարելավումների ամփոփում (Performance & UX)

Սույն փաստաթուղթը նկարագրում է նախագծում կատարված բարելավումները՝ API-ի արագացում, database օպտիմիզացիա, caching, logging, UX և error handling: **Բիզնես-լոգիկան և օգտվողի տեսանկյունից վարքը մնացել են նույնը:**

---

## 1. API – Batch request-ներ և արագացում

### 1.1 Attendance-ի N+1-ի վերացում

**Խնդիր:** Attendance register էջում յուրաքանչյուր lesson-ի համար առանձին request էր գնում (`GET /attendance/lesson/:id`) — 20 lesson = 20 request:

**Լուծում:**

- **Backend:** Ավելացվել է batch endpoint  
  `GET /attendance/lessons?lessonIds=id1,id2,...`  
  Մեկ request-ով վերադարձնում է բոլոր lesson-ների attendance-ը:
- **Frontend:** Admin և Teacher attendance register-ում `useQueries` (N request) փոխարինվել է **մեկ** `useBatchLessonAttendance()` / `fetchAttendanceByLessons()` կանչով:
- **Արդյունք:** N request → 1 request, էջի բեռնում զգալի արագանում:

### 1.2 Response time logging և correlation ID

- **CorrelationIdMiddleware:** Յուրաքանչյուր request-ին ավելացվում է `x-request-id` (կամ գեներացված ID), response header-ում էլ նույն ID-ն է:
- **LoggingInterceptor:** Յուրաքանչյուր request-ի ավարտին log է գրվում JSON ֆորմատով՝ `method`, `path`, `statusCode`, `durationMs`, `correlationId`:
- **Օգտակարություն:** Production-ում հեշտ է գտնել դանդաղ endpoint-ներ և մի request-ի log-երը միացնել:

---

## 2. Database – Index-եր

**Ֆայլ:** `packages/database/prisma/schema.prisma`

- **Lesson:** Ավելացվել է composite index `@@index([groupId, scheduledAt])` — օպտիմիզացնում է «lessons by group + date range» query-ները:
- **Attendance:** Ավելացվել է `@@index([lessonId])` — արագացնում է batch attendance query-ները:

**Migration:**  
`packages/database/prisma/migrations/20260224120000_add_composite_indexes/migration.sql`

Կիրառել՝ `pnpm exec prisma migrate deploy` (կամ `migrate dev`):

---

## 3. Students bulk delete

**Խնդիր:** Շատ student ջնջելիս front-end-ը N անգամ կանչում էր `DELETE /students/:id` (N request):

**Լուծում:**

- **Backend:** Ավելացվել է `DELETE /students/bulk` (body: `{ ids: string[] }`), `StudentCrudService.deleteMany(ids)` — transaction-ում ջնջում է students, ապա users:
- **Frontend:** `deleteStudentsBulk()`, `useDeleteStudentsBulk()`; Students էջի bulk delete-ը կանչում է **մեկ** request:
- **Արդյունք:** N request → 1 request, արագ և միասնական state:

---

## 4. Caching

### 4.1 NestJS Cache (Settings)

- **CacheModule** (in-memory, TTL 2 րոպե) գրանցված է `AppModule`-ում `isGlobal: true`, որպեսզի `CACHE_MANAGER` հասանելի լինի բոլոր մոդուլներին:
- **SettingsService:** `getSystemSettings()` արդեն cache է օգտագործում (key: `settings:system`); settings թարմացնելիս cache-ը invalidate է արվում (logo, action percents, penalty amounts):

### 4.2 React Query – staleTime

- **Groups:** `useGroups` և `useMyGroups`-ում `staleTime` դրվել է 60 վայրկյան (նախկինում 0), որպեսզի ավելորդ refetch-եր չլինեն:

---

## 5. Logging – NestJS Logger և կonsistency

- **main.ts:** Startup log-երը տեղափոխվել են NestJS `Logger`-ի:
- **Chat:** `chat.gateway.ts` և `chat.controller.ts`-ում `console.log` / `console.warn` / `console.error`-ը փոխարինվել են `this.logger.log` / `this.logger.warn` / `this.logger.error`-ով:
- **Structured logging:** Logging interceptor-ը log-երը գրում է JSON տեսքով (`message`, `method`, `path`, `statusCode`, `durationMs`, `correlationId`):

---

## 6. UX – Skeleton loader (Attendance)

- **Skeleton component:** Ավելացվել է `apps/web/src/shared/components/ui/Skeleton.tsx` (Tailwind `animate-pulse`):
- **Attendance register:** «Loading attendance records…» state-ում մեկ spinner-ի փոխարեն ցույց է տրվում **grid skeleton** (մոտ 6×8 placeholder cell), որպեսզի էջի layout-ը նախատեսվի, իսկ «Loading lessons…»-ի համար մնում է spinner:

---

## 7. Error handling

- **StudentQueryService:** `findAssignedToTeacherByUserId`-ը wrap արվել է try/catch-ով; բացի `NotFoundException`-ից բոլոր error-ները log են արվում, ապա rethrow — NestJS-ը դրանք կարող է map անել 500/404:

---

## 8. Հեռացված (ըստ ցանկության)

- **NProgress (վերևի load-ի գիծ):** Որպես global loading indicator ավելացվել էր, ապա ամբողջությամբ հեռացվել (import-ներ, `global-progress.ts`, CSS, package): Deploy-ից հետո այդ գիծը չի երևա:

---

## Ֆայլերի ցանկ (հիմնական)

| Ոլորտ | Ֆայլեր |
|--------|--------|
| API batch attendance | `apps/api/.../attendance.controller.ts`, `attendance.service.ts`; `apps/web/.../attendance.api.ts`, `useAttendance.ts`, `useAttendanceData.ts`, `useTeacherAttendanceData.ts` |
| Correlation ID + Logging | `apps/api/src/common/middleware/correlation-id.middleware.ts`, `common/interceptors/logging.interceptor.ts`, `app.module.ts` |
| Students bulk delete | `apps/api/.../students.controller.ts`, `student-crud.service.ts`, `students.service.ts`; `apps/web/.../students.api.ts`, `useStudents.ts`, `useStudentsPage.ts` |
| Cache | `apps/api/app.module.ts` (CacheModule), `modules/settings/settings.service.ts` |
| Prisma indexes | `packages/database/prisma/schema.prisma`, `migrations/20260224120000_add_composite_indexes/` |
| Skeleton | `apps/web/src/shared/components/ui/Skeleton.tsx`, `.../AttendanceLoadingState.tsx` |
| Logger (chat, main) | `apps/api/.../chat.gateway.ts`, `chat.controller.ts`, `main.ts` |

---

*Փաստաթուղթը համապատասխանում է audit-ի իրականացմանը; բիզնես-լոգիկան և API-ի վարքը (response shape) չեն փոխվել, բացի նոր batch/bulk endpoint-ների ավելացումից:*
