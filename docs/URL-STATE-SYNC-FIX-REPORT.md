# URL State Synchronization Fix — Technical Report

> Date: June 2026  
> Scope: Frontend only (`apps/web`)  
> Related analysis: [`PROJECT-ANALYSIS-URL-STATE-ISSUES.md`](./PROJECT-ANALYSIS-URL-STATE-ISSUES.md)

---

## 1. Root cause

### Why did the URL change but the UI sometimes not update?

The failure mode was a **desync between three sources of truth**:

1. **`window.location.search`** — updated immediately by `replaceAppSearchUrl()` via `window.history.replaceState()`
2. **Next.js `useSearchParams()`** — often **did not re-render** with the new values after `router.replace()` on client-side navigation (especially in production builds)
3. **Local React state** — initialized once from stale `searchParams.get(...)` and **never synced back** from URL changes

Concrete example in `useFinancePage.ts` (before fix):

```typescript
const [activeTab, setActiveTab] = useState(() => {
  const tabFromUrl = searchParams.get('tab'); // stale after replaceAppSearchUrl
  return tabFromUrl === 'salaries' ? 'salaries' : 'payments';
});

const updateUrlParams = useCallback((updates) => {
  replaceAppSearchUrl({ router, pathname, updates, scroll: false });
  // NO urlRevision bump, NO sync effect
}, [router, pathname]);

const handleTabChange = useCallback((tab) => {
  setActiveTab(tab);           // optimistic local update
  updateUrlParams({ tab });    // URL updates
}, [updateUrlParams]);
```

After client navigation to `/admin/finance?tab=salaries`:

- Address bar showed `?tab=salaries`
- `useSearchParams()` could still return the old snapshot
- Components reading `searchParams.get('tab')` for links (e.g. `SalariesTable.tsx`, `tableColumns.tsx`) built **wrong back URLs**
- On pages that only updated URL without reliable local state sync, **UI stayed on the old tab**

Additionally, **no `popstate` listener** existed on most pages, so browser **back/forward** changed the URL but did not force a re-read of live params.

### Why did it work after refresh?

Full page load re-initializes all React state from the **actual browser URL**. `useSearchParams()` and `useState` initializers both read the correct query string on mount. The stale snapshot problem only appears on **client-side** URL updates without a matching state sync.

### Why was production more unstable than localhost?

Production is stricter about:

- **No HMR** — dev hot reload masks stale-state bugs by remounting components
- **Optimized App Router bundles** — `router.replace()` + `useSearchParams()` timing differs from dev
- **Static/SSG shell + client hydration** — client components mount once; one-time `useState(() => searchParams.get(...))` init is more visible

This was **not primarily** a Suspense or hydration mismatch bug. Hydration could contribute to first-paint flicker, but the reported “URL changed, UI didn’t” on **click navigation** is explained by stale reads + missing sync.

### Root cause classification

| Factor | Role |
|--------|------|
| **Stale `useSearchParams()`** | **Primary** — reads after `replaceAppSearchUrl` were unreliable |
| **Local React state as sole source** | **Primary** — finance, calendar filters, settings tab kept state that diverged from URL |
| **Missing `urlRevision` / popstate** | **Primary** — no forced re-render after URL replace or back/forward |
| **Admin↔manager redirect dropping query** | **Secondary** — `(admin)/layout.tsx` called `router.replace(path)` without `location.search` |
| **CRM modals local-only** | **Secondary** — drawer/create/voice/paid-reg not in URL before fix |
| **Hydration / Suspense** | **Not fixed in this pass** — no Suspense boundaries added |
| **React Query cache** | **Not changed** — query keys unchanged |
| **Auth hydration** | **Not changed** — Zustand gate unchanged; only redirect query preservation |
| **`useIsLgViewport` race** | **Not changed** — CRM/Groups mobile board forcing still present |

**Conclusion:** Combination of **stale `useSearchParams` + local React state + missing URL sync/popstate**, with **redirect query loss** as an additional production-only pain point.

---

## 2. Files changed

| File path | What changed | Why | Risk |
|-----------|--------------|-----|------|
| `apps/web/src/shared/hooks/useAppSearchUrl.ts` | Added `usePopstateUrlSync()`; wired into `useAppSearchUrl`; `readParam()` now passes `urlRevision` | Central back/forward + post-replace re-render trigger | **Low** — shared hook only |
| `apps/web/src/app/[locale]/(admin)/admin/finance/hooks/useFinancePage.ts` | Rewrote: tab/page/filters/salaryId derived via `useMemo` + `readUrlSearchParam(..., urlRevision)`; migrated to `useAppSearchUrl`; removed all `searchParams.get`; added `openSalaryDetail`/`closeSalaryDetail` | Finance was the worst stale-state offender | **Low** — UI/query-param routing only |
| `apps/web/src/app/[locale]/(admin)/admin/finance/page.tsx` | Replaced manual modal close (`setIsDetailModalOpen` + `setSelectedSalaryId`) with `closeSalaryDetail` | Align modal close with URL param removal | **Low** |
| `apps/web/src/app/[locale]/(admin)/admin/finance/utils/tableColumns.tsx` | `SalaryActionCell` uses `useAppSearchUrl().readParam()` instead of `searchParams.get()` | Back links to salary breakdown were built from stale params | **Low** |
| `apps/web/src/app/[locale]/(admin)/admin/finance/components/SalariesTable.tsx` | Mobile card links use `readParam()` instead of `searchParams.get()` | Same stale link issue on mobile | **Low** |
| `apps/web/src/app/[locale]/(admin)/admin/finance/teacher-salaries/[teacherId]/[month]/page.tsx` | `getBackUrl()` and `teacherName` read via `useAppSearchUrl().readParam()` | Back button lost tab/page/filter state | **Low** |
| `apps/web/src/app/[locale]/(admin)/admin/calendar/page.tsx` | Removed `useState(() => searchParams.get(...))` for filters; empty init + sync `useEffect` with `urlRevision`; added `usePopstateUrlSync` | Filters/sort/modal stuck after client nav | **Low** |
| `apps/web/src/app/[locale]/(admin)/admin/settings/hooks/useSettingsPage.ts` | Removed dual init (`searchParams.get` + effect); `activeTab` now pure `useMemo` from `readUrlSearchParam`; uses `useAppSearchUrl` | Settings tab desync on back/forward | **Low** |
| `apps/web/src/app/[locale]/(admin)/admin/crm/page.tsx` | Added URL params: `leadId`, `createLead`, `voiceLead`, `paidRegLeadId`; sync effects + close refs; open/close handlers call `replaceParams` | CRM drawer/modals not shareable/restorable | **Low** — UI only; CRM API mutations unchanged |
| `apps/web/src/app/[locale]/(admin)/admin/students/hooks/useStudentsPage.ts` | Added `isFeedbackClosingRef`; feedback sync closes on param removal; `usePopstateUrlSync` | Feedback modal could reopen after close (race) | **Low** |
| `apps/web/src/app/[locale]/(admin)/admin/teachers/hooks/useTeachersPage.ts` | Added `usePopstateUrlSync(setUrlRevision)` only | Back/forward for existing URL modal pattern | **Low** |
| `apps/web/src/app/[locale]/(admin)/admin/groups/hooks/useGroupsViewUrl.ts` | Added `usePopstateUrlSync(setUrlRevision)` only | Back/forward for groups view mode | **Low** |
| `apps/web/src/app/[locale]/(admin)/admin/groups/hooks/useGroupsPage.ts` | **Deleted** (495 lines) | Unused legacy duplicate | **Low** — no imports |
| `apps/web/src/app/[locale]/(admin)/layout.tsx` | Admin↔manager redirects append `window.location.search` | Query string lost on role path rewrite | **Low** — navigation only |
| `apps/web/src/app/[locale]/(teacher)/teacher/students/[id]/page.tsx` | `getBackUrl()` uses `useAppSearchUrl().readParam('groupId'|'search')` | Back link lost teacher list filters | **Low** |
| `apps/web/next-env.d.ts` | Auto-updated by Next.js build (reference path) | Build artifact | **None** |

### Per-file detail (broken → fixed)

#### `useFinancePage.ts`

- **Before:** `useState(() => searchParams.get('tab'|'paymentsPage'|...))`; handlers called `setActiveTab` + `replaceAppSearchUrl` without `onReplaced` / `urlRevision`; no URL sync effect.
- **After:** `activeTab`, `paymentsPage`, `salariesPage`, `paymentStatus`, `salaryStatus`, `selectedSalaryId` are **`useMemo` reads** from `readUrlSearchParam(key, searchParams, urlRevision)`. Search input remains local but syncs from URL in `useEffect`. Writes go only through `replaceParams`.
- **Business logic:** None. Same API query args; only when they fire changes (now correctly tied to URL).

#### `crm/page.tsx`

- **Before:** `selectedLeadId`, `voiceModalOpen`, `createLeadModalOpen`, `paidRegLeadId` were local-only (except `editLead`).
- **After:** Each has URL param, sync `useEffect`, and `isClosingRef` guard on close.
- **Business logic:** Status mutations, delete, branch change — **unchanged**. Only which modal is open is URL-driven.

#### `(admin)/layout.tsx`

- **Before:** `router.replace(managerPathFromAdmin)` — no query string.
- **After:** `router.replace(\`${managerPathFromAdmin}${search}\`)` where `search = window.location.search`.

---

## 3. Business logic safety check

| Area | Changed? |
|------|----------|
| API contracts | **No** |
| Backend logic | **No** |
| Database schema | **No** |
| Prisma models / migrations | **No** |
| Finance calculations | **No** |
| Salary/payment processing logic | **No** |
| Attendance logic | **No** |
| CRM pipeline logic (status rules, mutations) | **No** |
| Permissions / role restrictions | **No** |
| Auth behavior (login, tokens, gates) | **No** |

**All changes were limited to frontend URL state synchronization, modal/tab/filter restoration, navigation consistency, and redirect query preservation.**

No files under `apps/api`, `packages/database`, or Prisma were modified.

---

## 4. URL state pattern

### Helper functions (unchanged core, extended hook)

Located in `apps/web/src/shared/lib/url-search-params.ts` ( **not modified** in this pass):

| Function | Purpose |
|----------|---------|
| `getLiveSearchParams(searchParams)` | Returns `new URLSearchParams(window.location.search)` in browser |
| `readUrlSearchParam(key, searchParams, urlRevision?)` | Reads from live URL first; `urlRevision` is a **React dependency trick** to force re-read |
| `replaceAppSearchUrl({ router, pathname, updates, onReplaced })` | `history.replaceState` + `router.replace`; merges updates into current query |
| `replaceAppSearchParams({ router, pathname, params, onReplaced })` | Full query string replace (used by settings) |
| `applySearchParamUpdates(base, updates)` | `null`/`undefined`/`''` → **deletes** key; preserves other keys |

Extended in `apps/web/src/shared/hooks/useAppSearchUrl.ts`:

| Export | Purpose |
|--------|---------|
| `useAppSearchUrl()` | Returns `{ readParam, replaceParams, replaceAllParams, urlRevision, searchParams, pathname, router }` |
| `usePopstateUrlSync(setRevision)` | Listens to `popstate` → increments revision |

### How stale `useSearchParams()` is prevented

1. **Never use `searchParams.get()` directly** for UI-driving reads (all instances removed from `apps/web/src`).
2. **Always use `readUrlSearchParam()`** which reads `window.location.search` via `getLiveSearchParams()`.
3. **Pass `urlRevision`** into read deps so React re-computes after `replaceAppSearchUrl` calls `onReplaced: () => setUrlRevision(n => n+1)`.
4. **`usePopstateUrlSync`** bumps revision on browser back/forward.

### Browser back/forward

```typescript
useEffect(() => {
  const bumpRevision = () => setRevision((r) => r + 1);
  window.addEventListener('popstate', bumpRevision);
  return () => window.removeEventListener('popstate', bumpRevision);
}, [setRevision]);
```

Used in: `useAppSearchUrl`, `useFinancePage` (via hook), `calendar/page.tsx`, `crm/page.tsx`, `useGroupsViewUrl`, `useStudentsPage`, `useTeachersPage`.

### Preserving unrelated query params

`replaceAppSearchUrl` reads **current** `window.location.search`, applies partial updates via `applySearchParamUpdates`, leaves other keys intact:

```typescript
replaceParams({ tab: 'salaries' }); // does not remove q, paymentsPage, etc.
```

### Removing params on modal close

Pass `null` (or `''`) in updates:

```typescript
replaceParams({ feedback: null });
replaceParams({ modal: null });
replaceParams({ leadId: null });
```

`applySearchParamUpdates` calls `params.delete(key)` for null/undefined/empty string.

### Close race guard pattern

```typescript
const isClosingRef = useRef(false);

const close = () => {
  isClosingRef.current = true;
  setOpen(false);
  replaceParams({ modalParam: null });
  setTimeout(() => { isClosingRef.current = false; }, 100);
};

useEffect(() => {
  if (isClosingRef.current) return;
  setOpen(readUrlSearchParam('modalParam', searchParams, urlRevision) === '1');
}, [searchParams, urlRevision]);
```

Applied to: CRM modals/drawer, calendar add-lesson, students feedback, finance salary detail close.

---

## 5. Page-by-page result

| Page | Query params | Previous issue | Current behavior | Status |
|------|--------------|----------------|------------------|--------|
| `/admin/finance` | `tab`, `q`, `paymentsPage`, `salariesPage`, `paymentStatus`, `salaryStatus`, `salaryId` | Tab/filter/page from stale `searchParams.get`; no revision after replace | Tab/page/filters derived from live URL; links use `readParam` | **Fixed in code** — manual browser test NOT RUN |
| `/admin/calendar` | `view`, `sortBy`, `sortOrder`, `q`, `teacherId`, `modal=add-lesson` | Filters init once from `searchParams.get`; sync effect missing `urlRevision` on reads | Empty init + sync effect; popstate added | **Fixed in code** — NOT manually tested |
| `/admin/settings` | `tab` | Mixed `searchParams.get` init + `readUrlSearchParam` effect; local `activeTab` state | Tab fully URL-derived via `useMemo` | **Fixed in code** — NOT manually tested |
| `/admin/crm` | `view`, `archive`, `editLead`, `leadId`, `createLead`, `voiceLead`, `paidRegLeadId` | Drawer + 3 modals local-only | All wired to URL with close guards | **Fixed in code** — NOT manually tested |
| `/admin/students` | `view`, `studentId`, `addStudent`, `feedback`, filters | Feedback modal close race | Close guard + popstate | **Partially improved** — details/edit modals were already URL-synced |
| `/admin/groups` | `tab`, `view`, `createGroup`, `editGroup`, `studentsGroup`, `studentId`, … | Groups page OK; legacy hook dead | Popstate on `useGroupsViewUrl`; modals unchanged in `GroupsTab.tsx` | **Mostly unchanged** — popstate only |
| `/admin/teachers` | `view`, `teacherId`, `addTeacher`, `editTeacherId`, `status` | Already used `readUrlSearchParam` pattern | Popstate added only | **Minor improvement** |
| `/admin/chat` | `tab`, `conversationId`, `chatId`, `returnTo` | Already in `AdminChatContainer.tsx` | **No files changed in this pass** | **Unchanged** |
| `/teacher/students/[id]` | `groupId`, `search` (back link) | `getBackUrl()` used `searchParams.get` | Uses `readParam()` | **Fixed in code** — NOT manually tested |
| `/teacher/chat` | (via `ChatContainer`) | Existing URL pattern | **No files changed** | **Unchanged** |
| `/student/chat` | (via `ChatContainer`) | Existing URL pattern | **No files changed** | **Unchanged** |

Manager routes (`/manager/*`) reuse the same components — fixes apply equally where shared code is used.

---

## 6. Modal / drawer URL contract

| Modal / Drawer | Query param | Opens from URL? | Refresh restores? | Back/forward? | Close removes param? |
|----------------|-------------|-----------------|-------------------|---------------|----------------------|
| CRM lead drawer | `leadId` | **Yes** (this pass) | **Yes** | **Yes** (popstate) | **Yes** + close ref |
| CRM create lead | `createLead=1` | **Yes** (this pass) | **Yes** | **Yes** | **Yes** + close ref |
| CRM voice lead | `voiceLead=1` | **Yes** (this pass) | **Yes** | **Yes** | **Yes** + close ref |
| CRM paid registration | `paidRegLeadId` | **Yes** (this pass) | **Yes** | **Yes** | **Yes** + close ref |
| CRM edit lead | `editLead` | Already yes | Yes | Yes | Yes + close ref |
| Finance salary detail | `salaryId` | **Partial** — URL read wired; **`openSalaryDetail` not called from table UI** | Yes if URL has param | Yes | **Yes** via `closeSalaryDetail` |
| Students feedback | `feedback` | Already yes | Yes (`StudentFeedbackModal` fetches by id) | Yes (popstate added) | **Yes** + close ref |
| Calendar add lesson | `modal=add-lesson` | Already yes | Yes | Yes (popstate added) | Yes + close ref |
| Groups create group | `createGroup=1` | Already in `GroupsTab.tsx` | Yes | Yes (popstate on view hook) | Already yes — **not changed** |
| Groups edit group | `editGroup` | Already in `GroupsTab.tsx` | Yes | Yes | Already yes — **not changed** |
| Groups student detail | `studentId` | Already in `GroupsTab.tsx` | Yes | Yes | Already yes — **not changed** |
| Teachers add | `addTeacher=1` | Already in `useTeachersPage.ts` | Yes | Yes (popstate added) | Already yes — **not changed** |
| Teachers edit | `editTeacherId` | Already yes | Yes | Yes | Already yes — **not changed** |
| Teachers details | `teacherId` | Already yes | Yes | Yes | Already yes — **not changed** |
| Chat conversation | `conversationId` / `chatId` | Already in `AdminChatContainer` / `ChatContainer` | Yes | Partial (has `urlRevision`) | Yes — **not changed this pass** |

---

## 7. Dead code cleanup

### Deleted: `apps/web/src/app/[locale]/(admin)/admin/groups/hooks/useGroupsPage.ts`

**Proof unused:** `grep useGroupsPage apps/web/src` → **0 imports** (only the file's own export). Active groups URL logic lives in:

- `admin/groups/page.tsx`
- `hooks/useGroupsViewUrl.ts`
- `components/GroupsTab.tsx` (modal URL sync)

### Other dead code

No other files deleted. No additional unused URL hooks found beyond `useGroupsPage.ts`.

---

## 8. Hydration / Suspense / production stability

| Item | Action taken? | Details |
|------|---------------|---------|
| **Suspense boundaries** | **No** | No `<Suspense>` wrappers added around `useSearchParams()` consumers |
| **Hydration mismatch fixes** | **No** | No SSR/client URL init changes beyond avoiding one-time stale reads |
| **`useIsLgViewport` race** | **No** | CRM still forces `view=board` when `isLg === false`; Groups `useGroupsViewUrl` still normalizes missing `view` on desktop |
| **Auth hydration timing** | **No** | `(admin)/layout.tsx` still waits for `isHydrated`; no query/API scope changes |
| **React Query keys** | **No** | No query key changes |
| **Admin/manager query preservation** | **Yes** | `(admin)/layout.tsx` appends `window.location.search` to role redirects |
| **Hidden locale prefix (`localePrefix: 'never'`)** | **Not explicitly changed** | Redirects use path without adding `/en`/`/hy`; existing behavior preserved |

Production build was compiled successfully; **no production/preview deployment or browser test against production build was performed.**

---

## 9. Tests and commands run

| Command | Result |
|---------|--------|
| `pnpm --filter web typecheck` | **PASS** (`tsc --noEmit`) |
| `pnpm --filter web lint` | **PASS** (`eslint .`) |
| `pnpm --filter web build` | **PASS** (Next.js 16.2.6, Turbopack) |
| `pnpm --filter web test` | **N/A** — no `test` script in `@ilona/web/package.json` |
| Manual browser testing | **NOT RUN** |
| Production preview (`next start`) | **NOT RUN** |

Build emitted one non-fatal `ENVIRONMENT_FALLBACK` from `next-intl` during static generation of `/register` — pre-existing, unrelated to URL state changes.

---

## 10. Manual testing checklist

| Test | Result |
|------|--------|
| Direct URL load restores tab | **NOT TESTED** |
| Direct URL load restores modal | **NOT TESTED** |
| Click tab updates UI immediately | **NOT TESTED** |
| Click tab updates URL immediately | **NOT TESTED** |
| Refresh keeps same state | **NOT TESTED** |
| Browser back restores previous state | **NOT TESTED** |
| Browser forward restores next state | **NOT TESTED** |
| Modal open sets URL param | **NOT TESTED** |
| Modal close removes URL param | **NOT TESTED** |
| Modal does not reopen after close | **NOT TESTED** |
| Share link opens same state | **NOT TESTED** |
| Mobile first paint works correctly | **NOT TESTED** |
| Admin route works | **NOT TESTED** |
| Manager route works | **NOT TESTED** |
| Production build behavior tested in browser | **NOT TESTED** (build only) |

**Honest status:** Automated static checks pass; **no interactive verification was performed.**

---

## 11. Remaining risks

### High priority — verify manually

1. **Finance salary detail modal (`salaryId`)**  
   - **File:** `useFinancePage.ts`, `finance/page.tsx`  
   - **Issue:** `openSalaryDetail()` is exported but **no table row/button calls it**. Modal only opens via direct URL `?salaryId=...`.  
   - **Next step:** Wire row click to `openSalaryDetail(salary.id)` if product expects in-app modal.

2. **No browser/manual QA**  
   - All “fixed” statuses are code-review/build confidence only.

### Medium priority — not addressed

3. **Suspense around `useSearchParams()`**  
   - Next.js docs recommend Suspense for static→client bailout. Not added.  
   - **Files:** Any `'use client'` page using `useSearchParams()` (~30 files).

4. **`useIsLgViewport` URL churn**  
   - **Files:** `crm/page.tsx`, `groups/hooks/useGroupsViewUrl.ts`  
   - Mobile/desktop transition may still rewrite `view=board` after hydration.

5. **Chat URL sync**  
   - **Files:** `AdminChatContainer.tsx`, `ChatContainer.tsx`  
   - Not modified; may still have edge cases without `usePopstateUrlSync`.

6. **Teacher students list page**  
   - **File:** `teacher/students/page.tsx`  
   - Has its own `urlRevision` but **no `usePopstateUrlSync` added** in this pass.

7. **Analytics, attendance, schedule**  
   - Already used good patterns; popstate not added to all of them.

8. **`next-env.d.ts` in diff**  
   - Build artifact; safe to ignore or revert if undesired in commits.

---

## 12. Final changed files summary

```
apps/web/src/shared/hooks/useAppSearchUrl.ts
apps/web/src/app/[locale]/(admin)/admin/finance/hooks/useFinancePage.ts
apps/web/src/app/[locale]/(admin)/admin/finance/page.tsx
apps/web/src/app/[locale]/(admin)/admin/finance/utils/tableColumns.tsx
apps/web/src/app/[locale]/(admin)/admin/finance/components/SalariesTable.tsx
apps/web/src/app/[locale]/(admin)/admin/finance/teacher-salaries/[teacherId]/[month]/page.tsx
apps/web/src/app/[locale]/(admin)/admin/calendar/page.tsx
apps/web/src/app/[locale]/(admin)/admin/settings/hooks/useSettingsPage.ts
apps/web/src/app/[locale]/(admin)/admin/crm/page.tsx
apps/web/src/app/[locale]/(admin)/admin/students/hooks/useStudentsPage.ts
apps/web/src/app/[locale]/(admin)/admin/teachers/hooks/useTeachersPage.ts
apps/web/src/app/[locale]/(admin)/admin/groups/hooks/useGroupsViewUrl.ts
apps/web/src/app/[locale]/(admin)/layout.tsx
apps/web/src/app/[locale]/(teacher)/teacher/students/[id]/page.tsx
apps/web/next-env.d.ts (build artifact)

DELETED:
apps/web/src/app/[locale]/(admin)/admin/groups/hooks/useGroupsPage.ts
```

**Git diff summary:** 16 files changed, 362 insertions, 723 deletions.

---

## Appendix: Recommended manual test URLs

```
/admin/finance?tab=payments
/admin/finance?tab=salaries&q=test&salaryStatus=PAID
/admin/calendar?view=week&modal=add-lesson
/admin/calendar?sortBy=date&sortOrder=desc&q=test&teacherId=<id>
/admin/settings?tab=security
/admin/crm?view=board&leadId=<id>
/admin/crm?createLead=1
/admin/crm?voiceLead=1
/admin/students?feedback=<studentId>
/teacher/students/<id>?groupId=<id>&search=test
/admin/chat?tab=students&conversationId=<id>
```

Test each: direct load → click navigation → refresh → back → forward → close modal → share in new tab.
