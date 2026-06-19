# Ilona English Center — Full Project Analysis & URL/Tab/Modal Issues

> Comprehensive analysis of the platform: all pages, functionality, URL-driven UI state, and known navigation bugs (tabs, modals, query params that fail until refresh).  
> Language: English · Last updated: June 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Platform Overview](#2-platform-overview)
3. [Technology Stack](#3-technology-stack)
4. [User Roles & Portals](#4-user-roles--portals)
5. [Complete Page & Feature Inventory](#5-complete-page--feature-inventory)
6. [Backend API Modules](#6-backend-api-modules)
7. [URL State Architecture (How It Works Today)](#7-url-state-architecture-how-it-works-today)
8. [Root Causes of Tab / Modal / URL Bugs](#8-root-causes-of-tab--modal--url-bugs)
9. [Page-by-Page URL State Audit](#9-page-by-page-url-state-audit)
10. [Other Known Issues](#10-other-known-issues)
11. [Recommended Fix Strategy](#11-recommended-fix-strategy)
12. [Testing Checklist](#12-testing-checklist)

---

## 1. Executive Summary

**Ilona English Center** is a monorepo (Next.js 16 frontend + NestJS API + PostgreSQL/Prisma) for managing English learning centers: CRM, groups, teachers, students, lessons, attendance, finance, chat, and analytics across **Admin**, **Manager**, **Teacher**, and **Student** portals.

### Current pain point (reported)

> Tabs, modals, and URL-driven UI often **do not work on first client navigation**, but **work correctly after a full page refresh**.

This is a **systemic URL state synchronization problem**, not a single broken page. The codebase already contains a partial fix (`replaceAppSearchUrl`, `readUrlSearchParam`, `urlRevision`), but adoption is **inconsistent**. Some pages use the fix correctly; others still read stale `useSearchParams()` or keep modal state only in React state without URL sync.

### Severity overview

| Category | Impact | Examples |
|----------|--------|----------|
| **Stale `useSearchParams` after `router.replace`** | High | Finance tabs, Calendar filters, Settings tab on back/forward |
| **Modal state not in URL** | High | CRM lead drawer, create/voice lead modals |
| **Mixed URL sync patterns** | Medium | Groups (new page vs legacy hook), Finance vs Students |
| **Viewport hydration race** | Medium | CRM/Groups force `view=board` after `isLg` resolves |
| **Auth hydration delay** | Medium | CRM queries wait for `isAuthReady`; flash/wrong data |
| **No `Suspense` around `useSearchParams`** | Low–Medium | Next.js App Router requirement; can cause hydration warnings |
| **Legacy dead code** | Low | `useGroupsPage.ts` unused duplicate |

---

## 2. Platform Overview

End-to-end business flow:

```
Lead intake → Trial lesson → Enrollment → Group assignment → Scheduling
    → Lesson delivery (obligations) → Attendance → Feedback → Recordings
    → Student payments → Teacher salary → Analytics → Communication
```

| Metric | Count |
|--------|-------|
| Frontend routes | ~95 `page.tsx` files |
| User roles | 4 (Admin, Manager, Teacher, Student) |
| Locales | 2 (English, Armenian) |
| Prisma models | 28 |
| API modules | 20+ |

For detailed feature descriptions see also [`docs/SITE_FUNCTIONALITY.md`](./SITE_FUNCTIONALITY.md).

---

## 3. Technology Stack

| Layer | Technology |
|-------|------------|
| Monorepo | pnpm workspaces + Turborepo |
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Backend | NestJS 10, REST + Socket.IO |
| Database | PostgreSQL (Neon), Prisma ORM |
| Auth | JWT access + refresh, Zustand persist |
| Server state | TanStack Query |
| i18n | next-intl (`localePrefix: 'never'`) |
| UI | Tailwind, Radix/shadcn-style components |

---

## 4. User Roles & Portals

| Role | Base path | Scope |
|------|-----------|-------|
| **Admin** | `/admin/*` | All centers, finance, analytics, recordings |
| **Manager** | `/manager/*` | Single assigned center; same UI, restricted routes |
| **Teacher** | `/teacher/*` | Own groups, lessons, students, salary |
| **Student** | `/student/*` | Own schedule, payments, attendance, chat |

**Manager restrictions:** No `/finance`, `/analytics`, `/recording`. Cannot create centers. Admin paths redirect to manager paths and vice versa via `(admin)/layout.tsx`.

**Auth gate:** All portal layouts wait for Zustand `isHydrated` from localStorage before rendering. Unauthenticated users redirect to `/`.

---

## 5. Complete Page & Feature Inventory

### 5.1 Public

| Route | Purpose |
|-------|---------|
| `/` | Marketing landing (EN/HY), FAQ, contact, login CTA |
| `/login` | Email/password login → role dashboard |
| `/register` | Placeholder (no self-registration; admin-managed enrollment) |

### 5.2 Admin Portal (`/admin/*`)

| Route | Main functionality | URL-driven UI |
|-------|-------------------|---------------|
| `/admin/dashboard` | Revenue, unpaid/at-risk students, capacity, absences | No |
| `/admin/crm` | Lead pipeline board/list, voice/text leads, paid registration | **Partial** (`view`, `archive`, `editLead`) |
| `/admin/groups` | Centers + Groups tabs, board/list view | **Yes** (`tab`, `view`, `branch`, modals) |
| `/admin/groups/[centerId]` | Groups for one center | **Yes** (`view`, modals) |
| `/admin/teachers` | List/board, center tabs, add/edit/details modals | **Yes** (`view`, `teacherId`, `addTeacher`, `editTeacherId`, `status`) |
| `/admin/students` | List/board, filters, add/edit/feedback/details modals | **Yes** (`view`, `studentId`, `addStudent`, `feedback`) |
| `/admin/students/[id]` | Full student detail page | Path param |
| `/admin/teachers/[id]` | Full teacher detail page | Path param |
| `/admin/schedule` | Org-wide schedule grid | **Yes** (`view` week/month + localStorage) |
| `/admin/daily-plan` | Teacher daily plans | Minimal |
| `/admin/calendar` | Week/month/list, filters, add lesson modal | **Partial** (`view`, `modal=add-lesson`; filters stale) |
| `/admin/calendar/[lessonId]` | Lesson workbench tabs | **Yes** (`tab`) |
| `/admin/attendance-register` | Day/week/month grid | **Yes** (`viewMode`, `groupId`, `groupIds`) |
| `/admin/recording` | Student recordings table | No |
| `/admin/finance` | Payments / Salaries tabs | **Broken sync** (see §9) |
| `/admin/finance/teacher-salaries/[teacherId]/[month]` | Salary breakdown | Back-link uses stale params |
| `/admin/analytics` | 5 analytics tabs + date filters | **Yes** (good pattern) |
| `/admin/chat` | Admin chat (students/teachers/groups tabs) | **Yes** (`tab`, `conversationId`) |
| `/admin/settings` | Security, notifications, penalties, managers, banner | **Partial** (`tab`) |
| `/admin/notifications` | Notifications list | Minimal |
| `/admin/profile` | Admin profile | No |

### 5.3 Manager Portal (`/manager/*`)

Mirrors admin pages above (center-scoped data). Same URL state bugs apply because components are shared/re-exported.

**Not available:** finance, analytics, recording.

### 5.4 Teacher Portal (`/teacher/*`)

| Route | Purpose | URL-driven UI |
|-------|---------|---------------|
| `/teacher/dashboard` | Upcoming lessons, obligations | No |
| `/teacher/students` | Assigned students + CRM onboarding leads | **Partial** |
| `/teacher/students/[id]` | Student detail | `groupId`, `search` (stale read) |
| `/teacher/schedule` | Personal schedule | **Yes** (`view` + localStorage) |
| `/teacher/calendar` | Calendar views | Navigation hook |
| `/teacher/calendar/[lessonId]` | Lesson workbench | **Yes** (`tab`) |
| `/teacher/today` | Today/week quick view | **Yes** (`view`) |
| `/teacher/daily-plan` | Daily plan editor | Minimal |
| `/teacher/attendance-register` | Attendance marking | Same as admin hook |
| `/teacher/recordings` | Student recordings | No |
| `/teacher/salary` | Monthly salary view | No |
| `/teacher/analytics` | Teacher metrics | No |
| `/teacher/chat` | Chat | **Yes** (`conversationId`, `teacherId`, `type`) |
| `/teacher/settings`, `/teacher/profile` | Profile/settings | No |
| `/teacher/leads` | Redirect → `/teacher/students` | — |

### 5.5 Student Portal (`/student/*`)

| Route | Purpose |
|-------|---------|
| `/student/dashboard` | Upcoming lessons, activity |
| `/student/schedule` | Personal schedule |
| `/student/recordings` | Lesson recordings |
| `/student/my-feedbacks` | Feedback history |
| `/student/our-teachers` | Assigned teachers |
| `/student/payments` | Tuition status, self-report payment |
| `/student/analytics` | Personal progress |
| `/student/attendance` | History + planned absences |
| `/student/chat` | Chat with teachers/admin |
| `/student/settings`, `/student/profile` | Profile |
| `/student/absence` | Redirect → `/student/attendance` |

### 5.6 Global UI (all portals)

| Component | Location | Notes |
|-----------|----------|-------|
| `DashboardLayout` | All portal pages | Sidebar, header, floating chat widget |
| `FloatingChatWidget` | Admin/teacher layouts | Deep-links to chat with query params |
| Global search | Admin/teacher header | Navigates to entities |
| `AdminPortalBottomNav` | Mobile admin subpages | Uses URL for active state |

---

## 6. Backend API Modules

| Module | Path | Purpose |
|--------|------|---------|
| Auth | `/auth` | Login, refresh, password |
| Users | `/users` | Users, managers |
| Centers | `/centers` | Branches |
| Groups | `/groups` | Classes, student assignment |
| Teachers | `/teachers` | CRUD, obligations, dashboard |
| Students | `/students` | CRUD, dashboard, teachers list |
| Lessons | `/lessons` | Scheduling, start/complete, obligations |
| Attendance | `/attendance` | Marking, reports, planned absences |
| Feedback | `/feedback` | CEFR feedback forms |
| Daily Plans | `/daily-plans` | Lesson planning |
| Finance | `/finance` | Payments, salaries, deductions |
| CRM | `/crm/leads` | Lead pipeline |
| Teacher Leads | `/teacher/leads` | Approve/transfer |
| Chat | `/chat` + WS `/chat` | Messages, groups |
| Analytics | `/analytics` | Admin dashboards |
| Settings | `/settings` | Logo, banner, penalties |
| Storage | `/storage` | R2 uploads |
| Admin | `/admin` | Recordings |
| Search | `/search` | Global search |
| Notifications | (internal) | Email |

---

## 7. URL State Architecture (How It Works Today)

### 7.1 Core utilities

**File:** `apps/web/src/shared/lib/url-search-params.ts`

| Function | Purpose |
|----------|---------|
| `getLiveSearchParams()` | Reads `window.location.search` (source of truth in browser) |
| `readUrlSearchParam(key, searchParams, urlRevision?)` | Live URL first, fallback to Next `searchParams` |
| `replaceAppSearchUrl({ router, pathname, updates })` | Updates `history.replaceState` **then** `router.replace()` |
| `replaceAppSearchParams()` | Full query string replace variant |

**Why this exists:** Next.js App Router's `useSearchParams()` often **does not update immediately** after `router.replace()`. Client-side tab/modal changes write to the URL, but components reading `searchParams.get()` still see the old value until a full navigation/refresh.

**Workaround pattern used in fixed pages:**

```typescript
const [urlRevision, setUrlRevision] = useState(0);

const replaceParams = (updates) => {
  replaceAppSearchUrl({
    router, pathname, updates,
    onReplaced: () => setUrlRevision(r => r + 1),
  });
};

// Read with live URL + revision bump
const tab = readUrlSearchParam('tab', searchParams, urlRevision);

// Optimistic UI while URL catches up
const [pendingTab, setPendingTab] = useState(null);
const activeTab = pendingTab ?? readTabFromUrl();
```

**Shared hook:** `useAppSearchUrl()` wraps this pattern but is **not used everywhere**.

### 7.2 Modal close race guard

Many pages use a `isClosingRef` + 100ms timeout to prevent `useEffect` URL sync from **re-opening** a modal immediately after close:

```typescript
isClosingRef.current = true;
setModalOpen(false);
replaceParams({ modal: null });
setTimeout(() => { isClosingRef.current = false; }, 100);
```

### 7.3 Two sources of truth problem

Several pages maintain **both** React state and URL:

| Pattern | Risk |
|---------|------|
| State initialized from URL once | Back/forward breaks |
| URL updated but state not synced via `useEffect` | Refresh works, client nav fails |
| State updated but URL not updated | Refresh loses modal/tab |
| `pendingViewMode` without clearing | Stuck wrong view |

---

## 8. Root Causes of Tab / Modal / URL Bugs

### 8.1 Primary: Stale `useSearchParams` (Next.js App Router)

**Symptom:** Change tab → URL bar updates → UI shows old tab. Refresh → correct tab.

**Affected files still using `searchParams.get()` directly:**

| File | Params read stale |
|------|-------------------|
| `admin/finance/hooks/useFinancePage.ts` | `tab`, `paymentsPage`, `salariesPage`, `q`, `paymentStatus`, `salaryStatus` |
| `admin/finance/utils/tableColumns.tsx` | Back-link query reconstruction |
| `admin/finance/components/SalariesTable.tsx` | Detail navigation params |
| `admin/calendar/page.tsx` | `sortBy`, `sortOrder`, `q`, `teacherId` (initializers only) |
| `admin/settings/hooks/useSettingsPage.ts` | Initial `tab` only (sync effect uses `readUrlSearchParam`) |
| `admin/groups/hooks/useGroupsPage.ts` | **Dead code** — unused legacy hook |
| `teacher/students/[id]/page.tsx` | `groupId`, `search` |

**Why refresh works:** Full document load re-initializes all `useState(() => searchParams.get(...))` from the correct URL.

### 8.2 Missing URL sync for modals/drawers

| Feature | State-only (lost on refresh / share link) |
|---------|---------------------------------------------|
| CRM `LeadDrawer` | `selectedLeadId` — **not in URL** |
| CRM `CreateLeadModal` | `createLeadModalOpen` |
| CRM `VoiceLeadModal` | `voiceModalOpen` |
| CRM `PaidRegistrationModal` | `paidRegLeadId` |
| Finance salary detail modal | `isDetailModalOpen`, `selectedSalaryId` |
| Students feedback modal | Opens from URL but `selectedStudentForFeedback` not restored from `?feedback=` |

### 8.3 Inconsistent `urlRevision` usage

`useFinancePage` calls `replaceAppSearchUrl` but **never increments `urlRevision`** and has **no `useEffect` to sync state from URL** on back/forward. Tab/filter state is write-only to URL.

### 8.4 Viewport detection race (`useIsLgViewport`)

```typescript
// Returns undefined on first render, true/false after useEffect
const isLg = useIsLgViewport(); // undefined → then false on mobile
```

**CRM page** forces `view=board` on mobile when `isLg === false`. On first paint `isLg` is `undefined`, so:
- Desktop may briefly show wrong view
- Then an effect fires and **replaces URL**, causing extra navigation churn

Same pattern in `useGroupsViewUrl` (normalizes missing `view=board`).

### 8.5 Auth hydration vs data fetching

CRM waits for `isAuthReady = isHydrated && isAuthenticated && hasAccessToken`. Before that:
- Page shell renders
- Queries disabled → empty board
- Can look "broken" until auth hydrates (similar symptom to URL bugs)

Chat store also depends on `user.id` for account key isolation.

### 8.6 Client navigation vs hard navigation

| Navigation type | URL state behavior |
|-----------------|-------------------|
| `<Link>` / `router.push` | RSC fetch; `useSearchParams` may lag |
| `router.replace` + manual `history.replaceState` | Fixed if using `readUrlSearchParam` |
| Browser back/forward | Needs `useEffect` on `searchParams` + `urlRevision` |
| Full refresh | Always works (re-init state from URL) |

### 8.7 Duplicate / legacy code

- `useGroupsPage.ts` — full page hook with old URL pattern; **not imported anywhere**
- `groups/page.tsx` — newer implementation with `useGroupsViewUrl` + inline tab logic
- `useGroupsPage.updateViewModeInUrl` uses raw `router.replace` without `replaceAppSearchUrl`

### 8.8 Missing Suspense boundaries

~40 client components call `useSearchParams()` without a parent `<Suspense>`. Next.js 14+ docs recommend wrapping these to avoid CSR bailout and hydration mismatch. Not the main bug, but contributes to unstable first paint.

---

## 9. Page-by-Page URL State Audit

### Legend

- ✅ Correct pattern (`readUrlSearchParam` + `urlRevision` + sync effects)
- ⚠️ Partial / has known bugs
- ❌ Broken or missing URL sync
- — Not applicable

### Admin / Manager pages

| Page | Query params | Status | Known issues |
|------|-------------|--------|--------------|
| **CRM** | `view`, `archive`, `editLead` | ⚠️ | `LeadDrawer` not in URL; create/voice modals state-only; mobile view forced async |
| **Groups** | `tab`, `view`, `branch`, `createGroup`, `editGroup`, `studentsGroup`, `studentId` | ✅/⚠️ | Main page good; branch auto-select effect may fight URL; legacy hook dead |
| **Teachers** | `view`, `teacherId`, `addTeacher`, `editTeacherId`, `status` | ✅ | Center strip tabs not in URL (by design) |
| **Students** | `view`, `studentId`, `addStudent`, `feedback` | ⚠️ | `?feedback=id` opens modal but doesn't load student object from URL |
| **Calendar** | `view`, `modal`, `sortBy`, `sortOrder`, `q`, `teacherId` | ⚠️ | View/modal ✅; filters use stale initializer only |
| **Calendar [lessonId]** | `tab` | ✅ | `pendingTab` pattern |
| **Attendance register** | `viewMode`, `groupId`, `groupIds` | ✅ | Unsaved changes confirm on nav |
| **Finance** | `tab`, `paymentsPage`, `salariesPage`, `q`, `paymentStatus`, `salaryStatus` | ❌ | No read sync after init; no `urlRevision` |
| **Analytics** | `tab`, `pm`, `pd`, `pw`, `cfrom`, `cto` | ✅ | Best reference implementation |
| **Settings** | `tab` | ⚠️ | Initial read uses `.get()`; effect uses live read |
| **Chat** | `tab`, `conversationId`, `chatId`, `returnTo` | ⚠️ | Complex mount logic; tab required before chat shows |
| **Schedule** | `view` | ✅ | + localStorage fallback for month view |

### Teacher pages

| Page | Query params | Status | Known issues |
|------|-------------|--------|--------------|
| **Calendar [lessonId]** | `tab` | ✅ | Same as admin |
| **Today** | `view` | ✅ | |
| **Schedule** | `view` | ✅ | localStorage hydration |
| **Students** | filters in hook | ⚠️ | Mixed patterns |
| **Students [id]** | `groupId`, `search` | ❌ | Stale `searchParams.get` |
| **Chat** | `conversationId`, `teacherId`, `type` | ⚠️ | Initial mount guards |

### Student pages

Most student pages have **minimal URL state** (simple pages). Chat uses same container as teacher.

---

## 10. Other Known Issues

### 10.1 Production / cold start (documented separately)

See [`docs/PRODUCTION-STABILITY.md`](./PRODUCTION-STABILITY.md):
- Render free tier cold starts (30–60s)
- Neon DB suspend latency
- Vercel cron warmup mitigates backend sleep

**Symptom overlap:** Empty pages on first load can look like URL bugs but are API timeout/empty data.

### 10.2 Manager/admin path redirects

`(admin)/layout.tsx` redirects `/admin/*` ↔ `/manager/*` based on role. Query strings should be preserved by Next.js, but any manual path rewriting must keep search params (most flows do via `replaceAppSearchUrl` on current `pathname`).

### 10.3 Locale prefix hidden

`localePrefix: 'never'` — URLs are `/admin/crm?view=board`, not `/en/admin/crm`. Internal file structure uses `[locale]` but users don't see it. Deep links must not include locale segment.

### 10.4 React Query cache + auth scope

CRM clears `['crm-leads']` on auth scope change. Switching users without refresh can show stale leads briefly.

### 10.5 Chat Zustand store persistence

Chat `activeChat` in Zustand can conflict with URL `conversationId` on mount. `AdminChatContainer` has explicit `isInitialMount` logic to reconcile — fragile.

### 10.6 Groups board branch auto-selection

When no `?branch=` in URL, `GroupsTab` auto-selects first center and writes URL. Can cause unexpected URL changes on first visit.

---

## 11. Recommended Fix Strategy

### Phase 1 — Standardize URL utilities (high impact)

1. **Migrate all pages** from `searchParams.get()` to `readUrlSearchParam()` + `urlRevision`.
2. **Extend `useAppSearchUrl`** or create `useUrlQueryState(key, default)` hook:
   - Single source: read from live URL
   - Write via `replaceParams`
   - Auto sync on back/forward
3. **Priority files:**
   - `useFinancePage.ts` ← highest user-visible bug
   - `admin/calendar/page.tsx` filter state
   - `finance/utils/tableColumns.tsx`, `SalariesTable.tsx`
   - `teacher/students/[id]/page.tsx`

### Phase 2 — Modal URL contract (medium impact)

Define consistent query param names:

| Param | Usage |
|-------|--------|
| `?leadId=` | CRM lead drawer |
| `?editLead=` | Already exists for edit modal |
| `?createLead=1` | Create lead modal |
| `?salaryId=` | Finance detail modal |
| `?modal=add-lesson` | Already used in calendar |

Pattern to copy: **Students/Teachers** (`addStudent=1`, `teacherId`, closing ref).

### Phase 3 — Reduce dual state (medium impact)

Prefer **URL as single source of truth** where possible:

```typescript
// Instead of: useState + useEffect sync
const tab = readUrlSearchParam('tab', searchParams, urlRevision) ?? 'payments';
const setTab = (t) => replaceParams({ tab: t });
```

Keep `pendingTab`/`pendingViewMode` only for optimistic UI during replace lag.

### Phase 4 — Infrastructure (lower impact)

1. Wrap URL-driven page sections in `<Suspense fallback={...}>`.
2. Delete unused `useGroupsPage.ts`.
3. Fix `useIsLgViewport` to avoid `undefined` flash (default from `matchMedia` in initializer or CSS-first responsive design).
4. CRM: restore `selectedStudentForFeedback` from students list when `?feedback=id`.

### Phase 5 — Verification

Use the testing checklist in §12 for every migrated page.

---

## 12. Testing Checklist

For each page with tabs, modals, or filters:

- [ ] **Direct URL load** — paste URL with query params → correct tab/modal/filter visible
- [ ] **Client tab switch** — click tab → UI updates immediately, URL updates, no double-click needed
- [ ] **Browser back** — after tab change, back button restores previous tab
- [ ] **Browser forward** — forward restores next tab
- [ ] **Modal open** — open modal → URL param set
- [ ] **Modal close** — close modal → param removed, modal stays closed (no flash reopen)
- [ ] **Refresh with modal open** — modal still open with correct data
- [ ] **Share link** — copy URL while modal open → new tab shows same state
- [ ] **Sidebar navigation away and back** — state resets or restores per design
- [ ] **Mobile viewport** — CRM/Groups view mode behaves correctly on first paint
- [ ] **Manager vs Admin** — same page under `/manager/*` works identically

---

## Appendix A — URL Query Parameter Reference

| Page | Parameters |
|------|------------|
| CRM | `view`, `archive`, `editLead` |
| Groups | `tab`, `view`, `branch`, `createGroup`, `editGroup`, `studentsGroup`, `studentId` |
| Teachers | `view`, `teacherId`, `addTeacher`, `editTeacherId`, `status` |
| Students | `view`, `studentId`, `addStudent`, `feedback` |
| Calendar | `view`, `modal`, `sortBy`, `sortOrder`, `q`, `teacherId` |
| Calendar lesson | `tab` (absence, feedback, voice, text, dailyPlan) |
| Attendance | `viewMode`, `groupId`, `groupIds` |
| Finance | `tab`, `paymentsPage`, `salariesPage`, `q`, `paymentStatus`, `salaryStatus` |
| Analytics | `tab`, `pm`, `pd`, `pw`, `cfrom`, `cto` |
| Settings | `tab` |
| Chat (admin) | `tab`, `conversationId`, `chatId`, `returnTo` |
| Chat (student/teacher) | `conversationId`, `teacherId`, `type` |
| Schedule | `view` |

---

## Appendix B — Key Source Files

| File | Role |
|------|------|
| `apps/web/src/shared/lib/url-search-params.ts` | Core URL utilities |
| `apps/web/src/shared/hooks/useAppSearchUrl.ts` | Reusable hook |
| `apps/web/src/app/[locale]/(admin)/admin/analytics/use-admin-analytics-url.ts` | Reference implementation |
| `apps/web/src/app/[locale]/(admin)/admin/students/hooks/useStudentsPage.ts` | Modal URL pattern reference |
| `apps/web/src/app/[locale]/(admin)/admin/teachers/hooks/useTeachersPage.ts` | Drawer + edit modal pattern |
| `apps/web/src/app/[locale]/(admin)/admin/groups/components/GroupsTab.tsx` | Create/edit modal URL sync |
| `apps/web/src/features/chat/components/AdminChatContainer.tsx` | Complex URL + Zustand reconciliation |

---

## Appendix C — Related Documentation

- [`docs/SITE_FUNCTIONALITY.md`](./SITE_FUNCTIONALITY.md) — Full feature reference
- [`docs/PRODUCTION-STABILITY.md`](./PRODUCTION-STABILITY.md) — Cold start & 404 fixes
- [`docs/01-ARCHITECTURE.md`](./01-ARCHITECTURE.md) — Architecture decisions
- [`docs/AUTH_REFRESH_FIX.md`](./AUTH_REFRESH_FIX.md) — Token refresh behavior

---

*This document was generated from static codebase analysis. For implementation of fixes, start with Phase 1 (`useFinancePage.ts`) as it matches the reported tab/URL refresh symptom most closely.*
