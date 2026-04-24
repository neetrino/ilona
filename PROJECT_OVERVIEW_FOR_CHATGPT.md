# Ilona English Center — Project Overview (for AI assistants)

This document describes the **ilona-english-center** monorepo: an English learning center management platform. It is based on the repository as of the analysis date and cites concrete file paths so another assistant can navigate the codebase quickly.

---

## 1. Project Summary

**What it is:** A full-stack **business / school operations** web application for Ilona English Center: CRM for leads, student and teacher lifecycle, groups, lessons and scheduling, attendance, payments and salaries, internal chat, daily lesson plans, voice recordings (CRM + chat flows), analytics dashboards, and public marketing home content.

**System type:** Multi-tenant–style **center-based** data model (physical branches as `Center` entities). Users authenticate once; **role** determines UI routes and API authorization.

**Main users:**

| Role | Typical use |
|------|-------------|
| **Admin** | Full system configuration, finance, analytics, all centers |
| **Manager** | Single assigned center (`ManagerProfile.centerId`); CRM, groups, teachers, students, schedule, finance UI (with backend restrictions), no global analytics/finance dashboard in some flows |
| **Teacher** | Own schedule, students, attendance register, daily plans, recordings, salary view, chat, optional **teacher CRM leads** |
| **Student** | Dashboard, payments, attendance/absence reporting, recordings, feedbacks, chat, “our teachers” |

**Problem solved:** Replaces ad-hoc spreadsheets and messaging with a single platform for enrollment (CRM → paid student), ongoing teaching operations, attendance, parent/student comms (chat), and money tracking (tuition + teacher salaries).

---

## 2. Tech Stack

### Monorepo & tooling

- **pnpm** workspaces (`packageManager: pnpm@8.15.0`), **Turbo** (`turbo.json`) for `dev`, `build`, `lint`, `typecheck`, `test`.
- Root `package.json`: scripts orchestrate `@ilona/database`, `@ilona/types`, `@ilona/api`, `@ilona/web`.

### Frontend (`apps/web`)

- **Next.js 15** (App Router), **React 19**, **TypeScript**.
- **next-intl** — locale segment `[locale]` (`en`, `hy`); config in `apps/web/src/config/i18n.ts`, messages in `apps/web/languages/en.json`, `hy.json`.
- **Tailwind CSS 3**, **Radix UI** primitives, **class-variance-authority**, **tailwind-merge**, **tailwindcss-animate**.
- **TanStack Query v5** for server state; **Zustand** for auth (persisted).
- **react-hook-form** + **zod** + **@hookform/resolvers**.
- **framer-motion**, **lucide-react**, **recharts** (charts where used).
- **socket.io-client** for real-time chat (pairs with API gateway).

### Backend (`apps/api`)

- **NestJS 10** (HTTP + validation, modular architecture).
- **Prisma** via workspace package `@ilona/database` (client generated into `packages/database/src/generated/client`).
- **PostgreSQL** (`DATABASE_URL`, `DIRECT_URL` in Prisma schema).
- **JWT** access + refresh (`@nestjs/jwt`, `passport-jwt`); **bcrypt** for passwords.
- **Swagger** in non-production (`apps/api/src/main.ts`).
- **@nestjs/throttler** — global rate limit (see `apps/api/src/app.module.ts`).
- **@nestjs/cache-manager** — in-memory cache (e.g. settings).
- **Socket.io** (`@nestjs/platform-socket.io`, `ChatGateway` in `apps/api/src/modules/chat/chat.gateway.ts`).
- **AWS SDK S3** + presigning — storage module (`apps/api/src/modules/storage/`).
- **Resend** — email capability in notifications module (`apps/api/src/modules/notifications/email.service.ts`).
- **Vitest** for unit/e2e-style tests.

### Database

- **Prisma** schema: `packages/database/prisma/schema.prisma` (single PostgreSQL database, rich relational model; enums for roles, lesson status, payments, CRM, etc.).

### Authentication

- **Stateless JWT**: login returns `user` + `tokens`; refresh via `POST /auth/refresh`.
- **NestJS**: global `JwtAuthGuard` + `RolesGuard` (`apps/api/src/app.module.ts`); `@Public()` skips JWT; `@Roles(...)` restricts by `UserRole` from `@ilona/database`.

### Storage / media

- **StorageController** (`apps/api/src/modules/storage/storage.controller.ts`): avatars, files, presigned uploads; integrates with **S3-compatible** storage (R2 mentioned in settings comments).
- CRM lead voice attachments stored as `CrmLeadAttachment` with `r2Key` (see Prisma `CrmLeadAttachment`).

### Deployment / ops (from code, not live infra)

- `apps/api/src/main.ts`: production checks for `DATABASE_URL`, TLS hints for Neon, `PORT` for PaaS; CORS from `CORS_ORIGIN` in production.
- **GitHub Actions**: `.github/workflows/security.yml` (security-oriented workflow present in repo).
- No `Dockerfile` found in the repository snapshot used for this overview.

---

## 3. Project Structure

### Root

| Path | Purpose |
|------|---------|
| `package.json` | Monorepo scripts (`turbo dev`, `db:*`, etc.) |
| `turbo.json` | Pipeline tasks |
| `tsconfig.json` | Root TS references (if present) |
| `Rules/.cursor/rules/` | Cursor project rules (optional reading for agents) |

### `apps/web` — Next.js frontend

| Area | Location |
|------|----------|
| **App Router pages** | `apps/web/src/app/[locale]/` — route groups: `(auth)`, `(admin)`, `(teacher)`, `(student)` |
| **Layouts / shells** | Role layouts: `apps/web/src/app/[locale]/(admin)/layout.tsx`, `(teacher)/layout.tsx`, `(student)/layout.tsx`; locale layout: `apps/web/src/app/[locale]/layout.tsx` |
| **Feature modules** | `apps/web/src/features/*` — e.g. `auth`, `crm`, `dashboard`, `students`, `teachers`, `groups`, `lessons`, `attendance`, `finance`, `chat`, `analytics`, `settings`, etc. |
| **Shared UI** | `apps/web/src/shared/components/` — `layout/` (`DashboardLayout`, `Sidebar`, `Header`), `ui/` (shadcn-style primitives) |
| **API client** | `apps/web/src/shared/lib/api.ts` (re-exports), `api-client.ts`, `api-config.ts`, `api-errors.ts` |
| **Middleware** | `apps/web/src/middleware.ts` — **next-intl only** (locale routing), **not** auth |
| **i18n** | `apps/web/src/config/i18n.ts` + `apps/web/languages/*.json` |

### `apps/api` — NestJS backend

| Area | Location |
|------|----------|
| **Bootstrap** | `apps/api/src/main.ts`, `apps/api/src/app.module.ts` |
| **Feature modules** | `apps/api/src/modules/<name>/` — each typically has `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/` |
| **Auth** | `apps/api/src/modules/auth/` |
| **Prisma access** | `apps/api/src/modules/prisma/` |
| **Cross-cutting** | `apps/api/src/common/` — guards, decorators, filters, interceptors, `utils/manager-scope.util.ts` |

### `packages/database`

- `prisma/schema.prisma` — schema source of truth.
- `prisma/seed.ts` — seed script.
- `package.json` — `db:generate`, `db:migrate`, `db:push`, `db:seed`, etc.

### `packages/types`

- Shared TypeScript types exported from `packages/types/src/` (e.g. `user.types.ts`, `finance.types.ts`). **Note:** `UserRole` in `packages/types/src/user.types.ts` does **not** list `MANAGER`; the web app uses `apps/web/src/types/index.ts` which **does** include `MANAGER`. Prefer **Prisma / API** enums for authoritative roles.

---

## 4. User Roles and Permissions

### How roles are defined

- **Database / API source of truth:** Prisma enum `UserRole` in `packages/database/prisma/schema.prisma`: `ADMIN`, `MANAGER`, `TEACHER`, `STUDENT`.
- **JWT payload** includes `role` and, for managers, `managerCenterId` (set in `apps/api/src/modules/auth/auth.service.ts` when issuing tokens).
- **Frontend** compares string roles (e.g. `user?.role === 'MANAGER'`) in layouts and components.

### Where role checks happen

1. **API — declarative:** `@Roles(UserRole....)` on controller methods; enforced by `RolesGuard` (`apps/api/src/common/guards/roles.guard.ts`). If no `@Roles`, any authenticated user passes the roles guard (JWT still required unless `@Public()`).
2. **API — imperative:** Services such as `StudentCrudService`, finance controller private methods, CRM leads service — scope by `managerCenterId`, teacher’s groups, etc.
3. **Web — route protection:** Client-side `useEffect` redirects in `(admin)/layout.tsx`, `(teacher)/layout.tsx`, `(student)/layout.tsx` using `useAuthStore` (not middleware).
4. **Web — navigation:** `getNavItems` in `apps/web/src/shared/components/layout/Sidebar.tsx` shows different menus per role.
5. **Web — manager-only UI blocking:** `(admin)/layout.tsx` redirects managers away from `/admin/finance` and `/admin/analytics` to dashboard (defense in depth; sidebar also hides some items for managers).

### What each role can access (high level)

- **Admin:** All `@Roles` combinations that include `ADMIN`; full finance, salaries, deductions, user/manager creation, analytics HTTP API, settings mutations, chat admin endpoints, CRM delete, etc. See per-controller `@Roles` in section 9.
- **Manager:** Uses same `/admin/*` UI shell as admin but: JWT carries **one** `managerCenterId`; APIs use `getManagerCenterIdOrThrow` / `assertManagerCenterAccess` (`apps/api/src/common/utils/manager-scope.util.ts`) and service-level filters (students, CRM, finance reads where allowed). **Cannot** use admin-only analytics routes (`AnalyticsController` is ADMIN-only). Finance dashboard `GET /finance/dashboard` behavior: web catches 403 for managers in `apps/web/src/features/dashboard/api/dashboard.api.ts`.
- **Teacher:** Lessons, groups (read), assigned students, attendance, daily plans (teacher write paths), teacher salary endpoints, teacher chat + teacher recordings listing, `teacher/leads` CRM slice, etc.
- **Student:** `students/me/*`, student payments, student attendance reporting, student chat, `student-notes`, etc.

### Files central to RBAC

- `packages/database/prisma/schema.prisma` — `UserRole`, `ManagerProfile`.
- `apps/api/src/common/decorators/roles.decorator.ts`, `public.decorator.ts`.
- `apps/api/src/common/guards/roles.guard.ts`, `apps/api/src/modules/auth/guards/jwt-auth.guard.ts`.
- All `*.controller.ts` files under `apps/api/src/modules/` (search `@Roles`).
- `apps/web/src/app/[locale]/(admin)/layout.tsx`, `(teacher)/layout.tsx`, `(student)/layout.tsx`.
- `apps/web/src/shared/components/layout/Sidebar.tsx`.

---

## 5. Authentication Flow

### Login (backend)

1. `POST /api/auth/login` (`apps/api/src/modules/auth/auth.controller.ts`, `@Public()`).
2. `AuthService.login` (`apps/api/src/modules/auth/auth.service.ts`): load user by email (`UsersService.findByEmail`), verify bcrypt password, ensure `UserStatus.ACTIVE`, optional `updateLastLogin`, build payload with `managerCenterId` for managers, `generateTokens`, return `{ user, tokens }`.

### Login (frontend)

1. Page: `apps/web/src/app/[locale]/(auth)/login/page.tsx` — after hydration, if already authenticated, `router.replace(getDashboardPath(user.role))`.
2. Form: `apps/web/src/features/auth/components/LoginForm.tsx` — calls `useAuthStore.getState().login(email, password)` then `router.push(getDashboardPath(user.role))` on success.

**Locale note:** `LoginForm` uses `router.push(getDashboardPath(user.role))` **without** the `[locale]` prefix, while `register/page.tsx` and `home` page use `/${locale}${getDashboardPath(...)}`. With `localePrefix: 'always'` in middleware, this is a potential **i18n routing inconsistency** worth verifying in the running app.

### Sessions / tokens

- **Zustand + persist** (`apps/web/src/features/auth/store/auth.store.ts`): localStorage key `ilona-auth` stores `user`, `tokens`, `isAuthenticated`.
- **API client** (`apps/web/src/shared/lib/api-client.ts` via `api`): attaches Bearer access token; on 401 attempts refresh via `POST /auth/refresh` with `skipAuthRefresh` option to avoid loops; wires `initializeApiClient()` from `QueryProvider` (`apps/web/src/shared/lib/query-client.tsx`).
- **Session expired (non-destructive):** `sessionExpired` flag + `SessionExpiredBanner` (`apps/web/src/shared/components/SessionExpiredBanner.tsx`) — user is not always forced to re-login immediately on refresh failure.

### Protected pages (web)

- **No Next.js middleware auth.** Protection is **client-side** in role layouts and pages (`useEffect` + spinner while redirecting). Unauthenticated users hitting `/admin/*` get sent to `/` from `(admin)/layout.tsx`.

### Redirect after login

- `getDashboardPath` in `apps/web/src/features/auth/store/auth.store.ts`:
  - `ADMIN` / `MANAGER` → `/admin/dashboard`
  - `TEACHER` → `/teacher/dashboard`
  - `STUDENT` → `/student/dashboard`
- Home page auto-redirect for logged-in users: `apps/web/src/app/[locale]/page.tsx` uses `/${locale}${dashboardPath}`.

---

## 6. Main Features (and where they live)

### Marketing / public home

- `apps/web/src/app/[locale]/page.tsx` — landing sections; pulls **active centers** via `useCenters` (public `GET /centers`).

### Admin & Manager (shared `/admin/*` shell)

- **Dashboard:** `apps/web/src/app/[locale]/(admin)/admin/dashboard/page.tsx` + `apps/web/src/features/dashboard/*` — stats aggregation partially TODO (see section 11).
- **CRM:** `apps/web/src/app/[locale]/(admin)/admin/crm/page.tsx`, `apps/web/src/features/crm/*`, API `apps/api/src/modules/crm/*` (`leads.controller.ts`, `teacher-leads.controller.ts`, `leads.service.ts`).
- **Groups:** `admin/groups`, `features/groups`, API `groups`.
- **Teachers:** `admin/teachers`, `features/teachers`, API `teachers`.
- **Students:** `admin/students`, `features` scattered (hooks, APIs), API `students` + large `student-crud.service.ts`, `student-query.service.ts`.
- **Schedule:** `admin/schedule`, lessons feature.
- **Calendar:** `admin/calendar`, lesson detail routes.
- **Attendance register (staff):** `admin/attendance-register`, API `attendance`.
- **Finance (admin-heavy):** `admin/finance`, `features/finance`, API `finance` (payments, salaries, deductions).
- **Analytics (admin UI):** `admin/analytics`, `features/analytics` — backed by `AnalyticsController` (**ADMIN only**).
- **Settings (system):** `admin/settings`, API `settings` (penalties, logo, percentages, etc.).
- **Chat (admin view):** `admin/chat`, API `chat` (admin list endpoints).
- **Recordings (admin UI):** `admin/recording` — uses chat/admin recording APIs (see `ChatController` routes for `admin/student-recordings`).
- **Profile:** `admin/profile`, `admin/manager/profile`.

### Teacher

- Dashboard, students, schedule, calendar, daily plan, recordings, attendance register, salary, analytics (page composes **lessons + finance** hooks, not `/analytics/*` admin endpoints), settings, profile, **teacher leads** `teacher/leads`, **chat** `teacher/chat`, **today** `teacher/today`.

### Student

- Dashboard, recordings, feedbacks, our teachers, payments, analytics (uses `/attendance/my` + payments, etc.), attendance/absence flows, settings, profile, chat.

### Dashboard logic (data)

- Admin/manager dashboard fetches teachers count via `GET /teachers?take=1` and optionally finance dashboard; see `apps/web/src/features/dashboard/api/dashboard.api.ts`.

### Students / teachers / groups / lessons

- Core Prisma models: `Student`, `Teacher`, `Group`, `Lesson`, relations in `schema.prisma`.
- API entry: `students.controller.ts`, `teachers.controller.ts`, `groups.controller.ts`, `lessons.controller.ts`.

### Attendance

- Model `Attendance` tied to `Lesson` + `Student`; staff marking vs student planned absences (`PlannedAbsence`).
- API: `attendance.controller.ts`; web features under `apps/web/src/features/attendance`.

### Schedule

- Derived from **lessons** and **group** `schedule` JSON; pages under `admin/schedule`, `teacher/schedule`.

### Payments / finance

- Models: `Payment`, `SalaryRecord`, `Deduction`.
- API: `finance.controller.ts` + services; student-specific safe helpers resolve student id from JWT (see `getCurrentStudentOrThrow` in finance controller).

### Recordings

- **CRM lead** voice: presign/confirm in `leads.controller.ts`; attachments in DB.
- **Lesson / student voice (chat):** `ChatController` routes `admin/student-recordings`, `teacher/student-recordings`, `student/voice-to-teacher-recordings`.
- **RecordingItem** model exists for structured recording metadata (`recording_items` table) — UI may use chat or dedicated flows depending on screen.

### Global Search

- **UI only** in header — see section 7.

### Notifications

- Prisma `Notification` model exists.
- Backend: `notifications.service.ts`, `email.service.ts`, `notifications.module.ts` — **no `notifications.controller.ts` found** in the tree surveyed; in-app notification bell in `Header.tsx` is a **static button** with a red dot, not wired to API in that component.

---

## 7. Global Search Analysis

### Where it is

- **Visual placement:** `apps/web/src/shared/components/layout/Header.tsx` — search `Input` next to language switcher, used inside `DashboardLayout` (`apps/web/src/shared/components/layout/DashboardLayout.tsx`).
- **Copy:** `apps/web/languages/en.json` / `hy.json` key `common.globalSearch`.

### Responsibility

- **Only** `Header.tsx`: local React state `searchValue` / `setSearchValue`. **No** `onSubmit`, **no** API calls, **no** navigation, **no** debounced query.

### Real search logic?

- **None.** Pure controlled input placeholder experience.

### What data it could search (domain candidates)

- Students (name, email, phone), teachers, groups, CRM leads, lessons, chat messages, recording filenames — all exist in DB with various indexes (see Prisma `@@index` on several models).

### What is missing

1. UX: submit handler, dropdown results, keyboard navigation, empty states, loading/error.
2. **Backend:** dedicated endpoint e.g. `GET /search?q=&types=...` or separate queries per entity with unified ranking.
3. **Authorization:** reuse JWT + role + manager center scoping (same rules as `StudentCrudService.findAll`, `leads.service`, etc.).
4. **Frontend:** hook + TanStack Query + route targets (open student drawer, CRM lead, lesson modal).

### How to connect to real data (recommended direction)

1. Add **SearchModule** in Nest with a `SearchService` that runs **scoped** Prisma queries (parallel `findMany` with `take` limits per type) or PostgreSQL full-text if needed later.
2. Apply **`getManagerCenterIdOrThrow`** pattern for managers; teachers only their groups/students; students only self-served resources (or hide search).
3. Expose e.g. `GET /search?query=&limit=` returning discriminated union `{ type, id, title, subtitle, hrefKey }`.
4. Replace `Header` local state with debounced query + popover; optionally navigate to existing list pages with query string filters where already supported (e.g. students list has `search` in `QueryStudentDto`).

---

## 8. Database and Models

**Schema file:** `packages/database/prisma/schema.prisma`.

### Core entities (selected)

| Model | Role |
|-------|------|
| `User` | Login identity; `role`, `passwordHash`, links to `Student` / `Teacher` / `ManagerProfile` |
| `ManagerProfile` | Maps one manager user to **one** `Center` |
| `Center` | Branch / location |
| `Teacher` / `TeacherCenter` | Teacher profile + many-to-many centers |
| `Student` | Profile, `groupId`, `teacherId`, fees, status, `leadId` |
| `Group` | Class, `centerId`, teacher, substitute, `schedule` JSON |
| `Lesson` | Scheduled class; status pipeline; flags for vocabulary, feedback, voice, text, absence |
| `Attendance` | Per lesson per student |
| `Feedback` | Per lesson per student (extended structured fields) |
| `Payment` | Student tuition by month |
| `SalaryRecord`, `Deduction` | Teacher compensation |
| `CrmLead` + `CrmLeadActivity` + `CrmLeadAttachment` | Sales pipeline |
| `Chat`, `ChatParticipant`, `Message` | Messaging |
| `Notification` | In-app notifications (persistence ready) |
| `SystemSettings` | Global business rules / penalties / logo key |
| `DailyPlan`, `DailyPlanTopic`, `DailyPlanResource` | Lesson planning |
| `RecordingItem` | File metadata linked to group/student/lesson |
| `PlannedAbsence` | Student-declared future absence |
| `StudentGroupHistory` | Group membership history |
| `AuditLog` | Audit trail fields |

### Relationships (summary)

- `Student` → `User` (1:1), optional `Group`, optional `Teacher`, optional `CrmLead`.
- `Lesson` → `Group`, `Teacher`; `Attendance` / `Feedback` hang off `Lesson` + `Student`.
- `ManagerProfile` ties **manager user** to **single center** — all manager scoping derives from here.

---

## 9. API Routes (NestJS) — Overview

**Global prefix:** configurable `API_PREFIX` (default **`api`**) → e.g. `http://localhost:4000/api/...` (`apps/api/src/main.ts`).

**Auth:** Unless `@Public()`, routes need `Authorization: Bearer <accessToken>`.

Below: **controller base path** + **notable behavior** (not every method). For exact methods, open the listed file.

| Base path | File | Auth / roles (summary) |
|-----------|------|-------------------------|
| `/auth` | `apps/api/src/modules/auth/auth.controller.ts` | `login`, `refresh` **public**; `change-password` authenticated |
| `/users` | `apps/api/src/modules/users/users.controller.ts` | `me` / `patch me` any logged-in user; listings + `managers` **ADMIN** |
| `/centers` | `apps/api/src/modules/centers/centers.controller.ts` | `GET /` **@Public** (branches on marketing site); mutations **ADMIN**; details **ADMIN, MANAGER** |
| `/groups` | `apps/api/src/modules/groups/groups.controller.ts` | Mixed **ADMIN, MANAGER, TEACHER** by route |
| `/students` | `apps/api/src/modules/students/students.controller.ts` | Staff vs `me` vs teacher assigned routes; see `@Roles` per method |
| `/teachers` | `apps/api/src/modules/teachers/teachers.controller.ts` | Profile updates for self-teacher; admin/manager management routes |
| `/lessons` | `apps/api/src/modules/lessons/lessons.controller.ts` | Scheduling, completion, teacher actions — mixed roles |
| `/attendance` | `apps/api/src/modules/attendance/attendance.controller.ts` | Student vs staff marking |
| `/feedback` | `apps/api/src/modules/feedback/feedback.controller.ts` | Teachers/admins create; broader read in places |
| `/finance` | `apps/api/src/modules/finance/finance.controller.ts` | Teacher salary self-service; student payment self-service; admin/manager payment and salary ops with extra manager checks |
| `/analytics` | `apps/api/src/modules/analytics/analytics.controller.ts` | **All routes ADMIN only** |
| `/settings` | `apps/api/src/modules/settings/settings.controller.ts` | Logo endpoints **public**; sensitive updates **ADMIN** |
| `/storage` | `apps/api/src/modules/storage/storage.controller.ts` | Authenticated uploads / presigns |
| `/chat` | `apps/api/src/modules/chat/chat.controller.ts` | Admin / teacher / student slices for chats, messages, recordings |
| `/crm/leads` | `apps/api/src/modules/crm/leads.controller.ts` | **ADMIN, MANAGER** for most; some routes **ADMIN** only (see file) |
| `/teacher/leads` | `apps/api/src/modules/crm/teacher-leads.controller.ts` | **TEACHER** |
| `/daily-plans` | `apps/api/src/modules/daily-plan/daily-plan.controller.ts` | **TEACHER** can write own plans; broader read |
| `/teacher-notes` | `apps/api/src/modules/teacher-notes/teacher-notes.controller.ts` | **TEACHER** |
| `/student-notes` | `apps/api/src/modules/student-notes/student-notes.controller.ts` | **STUDENT** |

**Note:** There is **no** dedicated `/search` route in the codebase surveyed.

### Server Actions

- This project uses a **separate Nest API** consumed from the client; Next.js **server actions** are not the primary integration pattern (the app is client-heavy with TanStack Query).

---

## 10. UI and Layout System

### Layout composition

- **`DashboardLayout`** (`apps/web/src/shared/components/layout/DashboardLayout.tsx`): left `Sidebar`, top `Header`, scrollable main, **`FloatingChatWidget`** (`apps/web/src/features/chat`).
- **Role route groups** wrap pages that use `DashboardLayout` per screen.

### Sidebar and navigation

- **`Sidebar.tsx`**: role-based `getNavItems`, uses `next-intl` for labels, logo from `useLogo()` + `getFullApiUrl`.

### Header

- **`Header.tsx`**: title/subtitle, **non-functional global search**, language switcher, decorative notifications button, profile + logout.

### Design system

- **Tailwind** + **Radix**-based UI primitives under `apps/web/src/shared/components/ui/` (`button`, `input`, `dialog`, `tabs`, etc.).
- **Global styles:** `apps/web/src/app/globals.css` (not re-read here; standard Tailwind entry).
- **Motion:** framer-motion on marketing and auth screens.

### Page organization

- URLs always prefixed with locale: `/en/admin/dashboard`, `/hy/student/payments`, etc. (`middleware.ts` matcher excludes `_next`, static files).

---

## 11. Current Problems / Incomplete Areas

From static analysis (not runtime QA):

1. **Global search:** no backend, no navigation (section 7).
2. **Dashboard aggregation TODOs:** `apps/web/src/features/dashboard/api/dashboard.api.ts` — `active` teachers approximated; **students / groups / centers counts and lesson metrics** returned as **0** or TODO comments; pending payments come from finance dashboard when allowed.
3. **Admin dashboard StatCard “change” props:** `admin/dashboard/page.tsx` uses **hard-coded** percentage strings (`+4.5%`, etc.) — cosmetic / misleading.
4. **Notifications UI:** `Header.tsx` bell is not connected to `Notification` model or API; **no notifications REST controller** found in the API module tree listed.
5. **`packages/types` `UserRole`:** omits `MANAGER` while Prisma and web include it — **type drift** risk for consumers of `@ilona/types`.
6. **Login redirect locale:** possible mismatch between `LoginForm` (`router.push` without locale) vs other pages using `/${locale}` (section 5).
7. **Client-only route protection:** layouts check auth in `useEffect` — **flash of content** and **not SEO-safe**; determined scrapers or slow networks might see brief UI; security must rely on API (which it does).
8. **Centers `GET /centers/:id/statistics`:** in controller, not marked `@Public()` — requires JWT even if marketing might want public stats; verify intention.
9. **Student bulk delete comment mismatch:** `deleteMany` in `student-crud.service.ts` says “Only ADMIN” but implements **manager-scoped** deletion too — comment is misleading.
10. **CRM / feature complexity:** large services (`leads.service.ts`, `student-crud.service.ts`) — higher regression risk; rely on tests where present (`*.spec.ts`).

---

## 12. Recommendations

1. **Ship global search incrementally:** start with **students + CRM leads** (highest ops value), single API route, strict scoping, debounced UI; expand to teachers/groups/lessons.
2. **Fix dashboard stats:** either call existing list endpoints with minimal `take: 1` + `total` fields or add one **`GET /dashboard/summary`** backed by efficient SQL/counts — remove hard-coded StatCard deltas or drive them from real month-over-month data.
3. **Align shared types:** extend `packages/types` `UserRole` with `MANAGER` or generate types from Prisma to avoid drift.
4. **Hardening web auth:** consider **Next.js middleware** that at least checks presence of a session cookie or redirects unauthenticated users server-side for `/admin`, `/teacher`, `/student` paths (paired with continued API JWT enforcement).
5. **Notifications:** add `NotificationsController` + web hook; wire `Header` bell to unread count and dropdown.
6. **Unify locale navigation:** always prefix `router.push`/`replace` with `useLocale()` for post-login redirects.
7. **For AI agents:** when changing RBAC, update **both** `@Roles` on controllers **and** any service-level scope checks; grep `UserRole.MANAGER` and `managerCenterId`.

---

## 13. Important Files Reference

| File path | Purpose | Why it matters |
|-----------|---------|----------------|
| `packages/database/prisma/schema.prisma` | Full DB schema | Single source of truth for entities and enums |
| `apps/api/src/app.module.ts` | Root module | Registers all feature modules and global guards |
| `apps/api/src/main.ts` | Bootstrap | Prefix, CORS, Swagger, body limits, production DB warnings |
| `apps/api/src/modules/auth/auth.service.ts` | Login, tokens | JWT claims, manager center id injection |
| `apps/api/src/common/guards/roles.guard.ts` | RBAC enforcement | Throws 403 when role mismatch |
| `apps/api/src/common/utils/manager-scope.util.ts` | Manager scoping | Forbidden when crossing centers |
| `apps/api/src/modules/students/students.controller.ts` | Student HTTP API | Central CRUD + query params |
| `apps/api/src/modules/students/student-crud.service.ts` | Student business logic | Large: access rules, CRM linkage, deletes |
| `apps/api/src/modules/crm/leads.controller.ts` | CRM HTTP API | Leads, recordings presign, admin-only deletes |
| `apps/api/src/modules/finance/finance.controller.ts` | Money flows | Student/teacher/admin splits, manager checks |
| `apps/api/src/modules/analytics/analytics.controller.ts` | Reporting API | **Strictly ADMIN** — mismatch breaks admin UI if roles wrong |
| `apps/api/src/modules/chat/chat.controller.ts` | Chat + recordings HTTP | Role-specific subpaths |
| `apps/api/src/modules/settings/settings.controller.ts` | System + logo | Public logo vs admin settings |
| `apps/web/src/middleware.ts` | next-intl | Locale routing only |
| `apps/web/src/features/auth/store/auth.store.ts` | Auth state, `getDashboardPath` | All authenticated navigation depends on this |
| `apps/web/src/shared/lib/api-client.ts` | HTTP + refresh | Token attachment and retry semantics |
| `apps/web/src/shared/components/layout/DashboardLayout.tsx` | App shell | Sidebar + header + chat widget |
| `apps/web/src/shared/components/layout/Sidebar.tsx` | Navigation | Per-role IA |
| `apps/web/src/shared/components/layout/Header.tsx` | Top bar | **Global search UI (non-functional)** |
| `apps/web/src/app/[locale]/(admin)/layout.tsx` | Admin gate | Auth + manager route restrictions |
| `apps/web/src/features/dashboard/api/dashboard.api.ts` | Dashboard aggregation | Known TODO / placeholder counts |
| `apps/web/src/features/analytics/api/analytics.api.ts` | Analytics client | Calls `/analytics/*` (admin-only API) |
| `turbo.json` | Task graph | Build/dev orchestration |
| `package.json` (root) | Scripts | db and monorepo commands |

---

*End of document. No application source files were modified to produce this overview.*
