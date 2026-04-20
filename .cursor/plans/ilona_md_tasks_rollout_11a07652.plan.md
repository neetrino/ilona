---
name: ilona md tasks rollout
overview: "Phase-based rollout of all `ilona.md` tasks across Admin / Teacher / Student panels. Foundation-first: one DB schema phase (data-preserving migrations), then domain phases that ship DB+API+UI together. Each phase ends with a commit + push to `dev`."
todos:
  - id: phase-0-db
    content: Phase 0 — DB schema + data-preserving migrations (Group sub teacher, Teacher↔Center, Student DOB/status, DailyPlan, TeacherNote, StudentStreak, Recording, Settings)
    status: completed
  - id: phase-1-manager
    content: Phase 1 — Manager role + branch-scoped guards across modules
    status: completed
  - id: phase-2-crm
    content: Phase 2 — CRM voice icon, branch dropdown, conditional age fields, Comment, First Lesson Date, auto-fills
    status: completed
  - id: phase-3-centers
    content: Phase 3 — Centers interactive popup with tabs
    status: completed
  - id: phase-4-groups
    content: Phase 4 — Group main + substitute teacher display, schedule field, manager filter
    status: completed
  - id: phase-5-teachers
    content: Phase 5 — Teachers multi-center, group counts, video link, Per Lesson Rate rename
    status: completed
  - id: phase-6-students
    content: Phase 6 — Students statuses, filters, profile tabs page, DOB, auto-teacher, NEW label, risk logic
    status: completed
  - id: phase-7-recordings
    content: Phase 7 — Recordings table redesign + filters
    status: completed
  - id: phase-8-schedule
    content: Phase 8 — Schedule module (grid Mon-Sun × time slots)
    status: completed
  - id: phase-9-calendar-feedback-dp
    content: Phase 9 — Calendar locks + new Feedback form + Daily Plan (calendar action + standalone page + search)
    status: in_progress
  - id: phase-10-attendance
    content: Phase 10 — Rename Absence→Attendance, table layout, calendar sync
    status: pending
  - id: phase-11-finance
    content: Phase 11 — Finance manager access, Deductions column, totals on top
    status: pending
  - id: phase-12-analytics
    content: Phase 12 — Admin Analytics redesign
    status: pending
  - id: phase-13-settings
    content: "Phase 13 — Settings: Daily Plan penalties, remove timezone"
    status: pending
  - id: phase-14-admin-dashboard
    content: Phase 14 — Admin Dashboard data blocks
    status: pending
  - id: phase-15-teacher
    content: "Phase 15 — Teacher Panel: Notes, My Students tabs, Calendar restrictions, Analytics, Salary filters, Settings, Profile video"
    status: pending
  - id: phase-16-student
    content: "Phase 16 — Student Panel: Chat history, multi-factor progress, Payments table, Calendar visuals, Streak"
    status: pending
isProject: false
---

## Approach

- Single Prisma schema phase first (data-preserving migrations) so subsequent feature phases don't break each other.
- After Phase 0, every phase = vertical slice (DB-if-needed + API + UI) → `pnpm typecheck && pnpm lint` → commit → push `dev`.
- All breaking renames keep the old DB column readable until data is backfilled (e.g. add new column → backfill → drop in a later phase).
- Group has a single `substituteTeacherId` (per your answer). Manager role uses existing `MANAGER` enum + `ManagerProfile` for branch scoping.

## Conventions per phase

- Branch: stay on `dev` (matches current workflow seen in `git log`).
- Commit message format (matches recent style): short Armenian/English summary.
- After commit: `git push origin dev`.
- TypeScript strict; functions ≤ 50 lines; named exports only.

## Phase list (each = 1 commit + push)

### Phase 0 — DB Foundation (schema + data-preserving migrations)
Touches `[packages/database/prisma/schema.prisma](packages/database/prisma/schema.prisma)` and adds migrations under `[packages/database/prisma/migrations/](packages/database/prisma/migrations/)`.
- `Group`: `substituteTeacherId String?`, `schedule Json?` (working hours).
- `Teacher`: many-to-many `centers` via new `TeacherCenter` join table; `videoUrl String?`. Backfill `centers` from existing `groups[].centerId`.
- `Student`: `dateOfBirth DateTime?` (backfill from `age` where present), `firstLessonDate DateTime?`, `status StudentStatus` enum, `riskLevel` (computed value cached).
- `CrmLead`: `comment String?`, `firstLessonDate DateTime?`, `parentName/parentPhone/parentPassportInfo` (re-add conditional fields - already partially removed in latest migration).
- New models: `TeacherNote`, `DailyPlan`, `DailyPlanTopic`, `DailyPlanResource` (kind: READING|LISTENING|WRITING|SPEAKING), `StudentStreak`, `RecordingItem` (lesson-scoped, replacing CRM-only recordings for the new module).
- Enums: `StudentStatus { ACTIVE INACTIVE UNGROUPED NEW RISK HIGH_RISK }`, `DailyPlanResourceKind`.
- `SystemSettings`: `dailyPlanPenaltyAmd Decimal`. Drop timezone field if present.

### Phase 1 — Manager role + branch-scoped access
- API guards: `apps/api/src/modules/auth` + per-module services apply `ManagerProfile.centerId` filter for groups/students/leads/finance.
- `apps/web` role nav for `/manager/*` mirrors admin pages with branch filter prefilled.

### Phase 2 — CRM updates
- `[apps/web/src/features/crm](apps/web/src/features/crm)` "New" column: replace `+` with voice-icon trigger; add branch dropdown; manager sees only own branch.
- Conditional age fields (under-18 → parent fields, 18+ → student passport).
- Add `Comment` and `First Lesson Date` fields.
- Auto-prefill branch from "New" column; on group selection auto-fill main + substitute teacher.

### Phase 3 — Centers (interactive view)
- `[apps/web/src/features/centers](apps/web/src/features/centers)`: click center → popup/page with tabs (Teachers / Students / Groups / Schedule / Other).

### Phase 4 — Groups
- Group card + details show main + substitute teacher distinctly.
- Group create: define `schedule` (working hours); show in card + details.
- Manager branch filter.

### Phase 5 — Teachers
- Center column = multi-select via `TeacherCenter`.
- Replace student count with groups-as-main + groups-as-substitute counts; click → popup listing groups.
- Profile: `videoUrl` field; learners see all teacher info except finance.
- Rename label "Hourly Rate" → "Per Lesson Rate" everywhere (UI + i18n keys); backend already has `lessonRateAMD`.

### Phase 6 — Students
- Statuses + filter by group; "View" eye-icon → `[apps/web/src/app/[locale]/(admin)/admin/students/[id]](apps/web/src/app/[locale]/(admin)/admin/students/[id])` profile with tabs (General / Feedback / Payments / Recordings / Attendance / Other).
- `dateOfBirth` field with auto-computed age.
- Auto-assign teachers on group change.
- "new" label for CRM-transferred (pinned to top).
- Absence column: monthly total; risk labels (>1 excused → RISK, >1 unexcused → HIGH_RISK) under name + in status.
- Risk job factors: attendance + payment + recording.

### Phase 7 — Recordings (table redesign)
- New table: checkbox / group / student / date-time.
- Filters: group, student, keyword search, date.

### Phase 8 — Schedule module
- New grid (Mon-Sun × time slots) showing group + teacher.
- Available to Admin / Teacher / Manager.

### Phase 9 — Calendar + Feedback Form + Daily Plan
- Block teachers from creating/editing past lessons (no salary inflation).
- Post-midnight admin/system override; teacher edits don't recompute finance.
- Admin gets Week / Month / List views.
- Replace feedback shape with: Level (A1-C1), Grammar multi-select, Skills (speaking/writing + comment), Comment, Participation toggle (1-5), Progress, Encouragement.
- Daily Plan calendar action + standalone `[apps/web/src/app/[locale]/(teacher)/teacher/daily-plan](apps/web/src/app/[locale]/(teacher)/teacher/daily-plan)` page; multi-topic with Reading/Listening/Writing/Speaking blocks; dedicated search across topics/titles/skills.

### Phase 10 — Attendance (rename + table + sync)
- Rename "Absence" → "Attendance" (routes + i18n).
- Table: Students × Groups × 7-day grid; filter by group; bidirectional sync with Calendar lessons.
- Admin: branch-based; Teacher: own groups.

### Phase 11 — Finance
- Manager access (own branch only).
- Teacher tab: add Deductions column with totals; show total lesson count.
- Details: rename "Lesson Name" → "Group Name"; move totals to top with summary (Total lessons / earnings / deductions).

### Phase 12 — Analytics (admin redesign)
- Attendance, Payments, Recording completion, Feedback insights, Risk distribution.

### Phase 13 — Settings
- Add Daily Plan penalty config; remove timezone setting.

### Phase 14 — Admin Dashboard
- Blocks: Unpaid Students / Groups With Capacity / At-Risk Students / Revenue (super admin) / Branch Schedule Overview.

### Phase 15 — Teacher Panel
- Dashboard `Notes` (yellow sticky-note UI; mark Done = delete).
- My Students: tabs across the top (groups), main vs substitute differentiation, feedback action icon, hide passport/sensitive data.
- Calendar: remove "Add Course" button, disable teacher edits; week/month cards become clickable like list view.
- Analytics restructure (student perf, attendance, feedback trends, optional revenue).
- Salary: date filter (day/week/month/custom); totals reflect period; clarify lessons/deductions/payments.
- Settings: remove "Teaching" section.
- Profile: add `videoUrl`.

### Phase 16 — Student Panel
- Chat: new joiners see full history (`Message` already permanent; remove join-time filter on `[apps/api/src/modules/chat](apps/api/src/modules/chat)`).
- Progress: multi-factor (attendance + recording + payment) calculation in `[apps/api/src/modules/students](apps/api/src/modules/students)`.
- Payments: table/column layout with sort.
- Calendar visuals: green border for scheduled, faded for non-class, attended vs absent colors after the fact.
- Streak: `StudentStreak` updates on attendance changes; recompute job on edits; visible to student/teacher/admin.

## Notes / Risks

- Phases 9 and 16 are the largest (Daily Plan + Calendar locks; Streak + visual calendar). I'll surface concrete sub-task lists when those phases start.
- I will pause and confirm before any drop-column migrations (e.g. dropping `Student.age`, `Teacher.hourlyRate`, old `riskLevel` shapes) until backfill is verified in Phase 6 / Phase 5 respectively.
- For each phase, before commit: `pnpm typecheck`, `pnpm lint`, and `pnpm db:generate` if schema changed.