# Ilona English Center — Full Site Functionality Reference

> Comprehensive documentation of the platform: pages, roles, features, workflows, and technical architecture.  
> Last updated: June 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Technology Stack](#2-technology-stack)
3. [User Roles & Access Control](#3-user-roles--access-control)
4. [Public Pages](#4-public-pages)
5. [Admin Portal](#5-admin-portal)
6. [Manager Portal](#6-manager-portal)
7. [Teacher Portal](#7-teacher-portal)
8. [Student Portal](#8-student-portal)
9. [Core Business Workflows](#9-core-business-workflows)
10. [Real-Time Chat](#10-real-time-chat)
11. [Finance & Payments](#11-finance--payments)
12. [CRM & Lead Management](#12-crm--lead-management)
13. [Lessons, Attendance & Feedback](#13-lessons-attendance--feedback)
14. [Analytics & Reporting](#14-analytics--reporting)
15. [Settings & System Configuration](#15-settings--system-configuration)
16. [Search & Navigation](#16-search--navigation)
17. [Internationalization](#17-internationalization)
18. [Backend API Overview](#18-backend-api-overview)
19. [Database Entities](#19-database-entities)
20. [External Integrations](#20-external-integrations)
21. [Project Structure](#21-project-structure)

---

## 1. Overview

**Ilona English Center** is a full-cycle English learning center management platform. It supports multiple physical branches (centers), group-based classes, teacher obligations per lesson, student tuition tracking, automated teacher salary calculations with penalty deductions, CRM lead intake, real-time chat, and role-based portals for administrators, managers, teachers, and students.

### What the platform covers end-to-end

```
Lead intake → Trial lesson → Enrollment → Group assignment → Scheduling
    → Lesson delivery (obligations) → Attendance → Feedback → Recordings
    → Student payments → Teacher salary → Analytics → Communication
```

### Key statistics

| Metric | Count |
|--------|-------|
| Frontend page routes | ~68 |
| User roles | 4 (Admin, Manager, Teacher, Student) |
| Supported languages | 2 (English, Armenian) |
| Prisma database models | 28 |
| Backend API modules | 20+ |
| API endpoint groups | 150+ |

---

## 2. Technology Stack

| Layer | Technology |
|-------|------------|
| **Monorepo** | pnpm workspaces + Turborepo |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript 5 |
| **Backend** | NestJS 10 — REST API + WebSocket (Socket.IO) |
| **Database** | PostgreSQL via Prisma ORM |
| **Authentication** | JWT (access + refresh tokens), bcrypt, Passport JWT |
| **Frontend state** | Zustand (auth), TanStack Query (server state) |
| **UI** | Tailwind CSS, Radix UI, shadcn-style components, Framer Motion (landing) |
| **Forms / validation** | React Hook Form + Zod (FE), class-validator (API) |
| **API documentation** | Swagger at `/api/docs` (non-production) |
| **Testing** | Vitest (unit), Supertest (E2E) |

### Development URLs

| Service | URL |
|---------|-----|
| Frontend | `http://localhost:3000` |
| Backend API | `http://localhost:4000/api` |
| Swagger docs | `http://localhost:4000/api/docs` |
| Prisma Studio | `http://localhost:5555` |

### Deployment targets (documented)

- **Frontend:** Vercel
- **Backend:** Railway / Render
- **Database:** Neon (serverless PostgreSQL)
- **File storage:** Cloudflare R2
- **Email:** Resend

---

## 3. User Roles & Access Control

### Roles

| Role | Portal path | Scope |
|------|-------------|-------|
| **Admin** | `/admin/*` | Full system access across all centers |
| **Manager** | `/manager/*` | Single assigned center (operational admin) |
| **Teacher** | `/teacher/*` | Own groups, lessons, students, salary view |
| **Student** | `/student/*` | Own lessons, payments, attendance, feedback |

### Manager vs Admin

Managers reuse the same page components as admins but operate under `/manager/*`. They are scoped to one center via `ManagerProfile` and JWT `managerCenterId`.

**Manager-blocked routes** (redirect to dashboard):

- `/finance`
- `/analytics`
- `/recording`

Managers also cannot create new centers or access system-wide finance/analytics.

### User statuses

- `ACTIVE` — can log in and use the platform
- `INACTIVE` — blocked from login
- `SUSPENDED` — blocked from login

### Permission enforcement

- **Backend:** Global JWT guard + `@Roles()` decorator on every endpoint; manager center scoping in services
- **Frontend:** Route-group layouts for `(admin)`, `(teacher)`, `(student)`; manager path restrictions via `role-routes.ts`

After login, users are redirected to their role-specific dashboard.

---

## 4. Public Pages

### Landing page — `/`

Marketing website for Ilona English Center. Available in English and Armenian (inline content + i18n).

**Sections:**

- Hero with call-to-action and login link
- About the center
- Why choose Ilona (methods, results, teachers, schedule)
- Branch/location information with map links
- Student success stories
- News section
- FAQ (10 questions, EN/HY)
- Team / careers (send CV)
- Contact form and social links (Instagram, Facebook, Telegram, WhatsApp, Viber)
- Footer with flags (US/UK), social links, and navigation

**Features:**

- Language switcher (EN / HY)
- Dynamic logo from system settings
- Animated sections (Framer Motion)
- Login CTA for existing users

### Login — `/login`

- Email + password authentication
- JWT access/refresh token flow
- Redirects authenticated users to role dashboard
- Password change available in settings (authenticated)

### Register — `/register`

- **Placeholder page** — no self-registration
- Directs users to contact the center or sign in with existing credentials
- Enrollment happens through CRM lead flow (admin/manager creates lead → paid registration)

---

## 5. Admin Portal

Base path: `/admin/*`

### Dashboard — `/admin/dashboard`

Operational overview for the entire organization:

- Revenue summary
- Unpaid students count
- At-risk students
- Group capacity utilization
- Branch schedule snapshot
- Planned absences

### CRM — `/admin/crm`

Sales pipeline kanban and list view for prospective students.

**Lead statuses:** `NEW` → `FIRST_LESSON` → `PAID` → `WAITLIST` → `ARCHIVE`

- Create/edit/delete leads
- Voice recording attachments
- Activity log and comments
- Register paid lead as student account
- Assign branch/center and teacher

### Groups — `/admin/groups` and `/admin/groups/[centerId]`

- List all centers (branches) with color coding
- Manage groups within each center
- Group properties: name, icon, level, max students (default 8), schedule JSON, primary teacher, substitute teacher
- Assign/remove students from groups
- Toggle group active status

### Teachers — `/admin/teachers` and `/admin/teachers/[id]`

- Teacher list with search and filters
- Create, edit, bulk delete teachers
- Teacher profile: bio, specialization, rates, working days/hours, video
- Assigned groups and salary statistics
- Internal teacher notes
- Obligation tracking per lesson

### Students — `/admin/students` and `/admin/students/[id]`

- Student list with filters (status, risk label, center, group)
- Create, edit, bulk delete students
- Student detail: profile, parent info, monthly fee, group assignment
- Payment history
- Internal student notes
- Risk labels: `NONE`, `RISK`, `HIGH_RISK`
- Student statuses: `ACTIVE`, `INACTIVE`, `UNGROUPED`, `NEW`, `RISK`, `HIGH_RISK`

### Schedule — `/admin/schedule`

Organization-wide lesson schedule view across all centers and groups.

### Daily Plan — `/admin/daily-plan`

View and manage teacher daily lesson plans (topics and resources per group/date).

### Calendar — `/admin/calendar` and `/admin/calendar/[lessonId]`

- Calendar view of all lessons
- **Lesson workbench** (detail page) with tabs:
  - Attendance
  - Feedback
  - Vocabulary
  - Voice message
  - Text message
- Start/complete/cancel lessons
- Substitute teacher support

### Attendance Register — `/admin/attendance-register`

Grid-based attendance register with month/week views for all groups.

### Recording — `/admin/recording`

Admin-only table of student voice recordings across the organization. Assign recordings to centers.

### Finance — `/admin/finance`

Full financial management (admin only):

- Finance dashboard (revenue, outstanding payments, salary overview)
- Student payment CRUD — create, process, cancel monthly tuition
- Teacher salary records — generate monthly, view breakdown
- Deductions management (manual + automated)
- Monthly finance reports
- Per-teacher salary detail: `/admin/finance/teacher-salaries/[teacherId]/[month]`
- Finance automation runner (mark overdue, create obligation deductions)

### Analytics — `/admin/analytics`

Admin-only analytics dashboards:

- Summary metrics
- Teacher performance
- Students at risk
- Revenue trends
- Attendance statistics
- Lesson completion statistics

### Chat — `/admin/chat`

Communication hub:

- Chat with students, teachers, and groups
- Create custom group chats
- Send vocabulary messages to group chats
- View student voice recordings in chat context

### Settings — `/admin/settings`

System configuration:

- **Security** — password change
- **Notifications** — email preferences
- **Penalties** — AMD amounts and percentages for missed lesson obligations
- **Managers** — CRUD for center managers, assign manager to center
- **Logo** — upload organization logo
- **Dashboard banner** — upload admin dashboard banner
- **Action percents** — obligation completion percentages

### Profile — `/admin/profile`

Admin user profile: name, avatar, phone, password.

---

## 6. Manager Portal

Base path: `/manager/*`

Managers access the **same UI components** as admins, re-exported under manager routes. The layout automatically redirects managers from `/admin/*` to `/manager/*`.

### Available manager pages

| Route | Same as admin |
|-------|---------------|
| `/manager/dashboard` | Dashboard (center-scoped data) |
| `/manager/crm` | CRM leads for assigned center |
| `/manager/groups` | Centers and groups |
| `/manager/groups/[centerId]` | Groups in center |
| `/manager/teachers` | Teachers |
| `/manager/teachers/[id]` | Teacher detail |
| `/manager/students` | Students |
| `/manager/students/[id]` | Student detail |
| `/manager/schedule` | Schedule |
| `/manager/daily-plan` | Daily plans |
| `/manager/calendar` | Calendar |
| `/manager/calendar/[lessonId]` | Lesson workbench |
| `/manager/attendance-register` | Attendance register |
| `/manager/chat` | Chat |
| `/manager/settings` | Settings (limited) |
| `/manager/profile` | Profile |

### Restrictions

- No access to Finance, Analytics, or Recording
- Cannot create new centers
- All data queries scoped to assigned center

---

## 7. Teacher Portal

Base path: `/teacher/*`

### Dashboard — `/teacher/dashboard`

- Upcoming lessons
- Lesson obligation status (vocabulary, attendance, feedback, voice, text)
- Quick stats and alerts

### Students — `/teacher/students` and `/teacher/students/[id]`

- List of assigned students (includes CRM leads in `FIRST_LESSON` status)
- Individual student profile and history
- Approve leads (move to `PAID`)
- Transfer leads to another teacher

### Schedule — `/teacher/schedule`

Personal lesson schedule across assigned groups.

### Calendar — `/teacher/calendar` and `/teacher/calendar/[lessonId]`

- Month and list calendar views
- Lesson workbench: start/complete lesson, fulfill obligations

### Today — `/teacher/today`

Quick view of today's and this week's lessons.

### Daily Plan — `/teacher/daily-plan`

Create and edit daily lesson plans:

- Topics per group/date
- Resources by kind: READING, LISTENING, WRITING, SPEAKING

### Attendance Register — `/teacher/attendance-register`

Mark attendance for lessons in assigned groups.

### Recordings — `/teacher/recordings`

View student voice recordings for teacher's groups.

### Salary — `/teacher/salary`

- Monthly salary records
- Gross, deductions, net breakdown
- View individual deduction reasons (missing vocabulary, feedback, voice, text, daily plan)

### Analytics — `/teacher/analytics`

Teacher performance analytics (completion rates, obligations, etc.).

### Chat — `/teacher/chat`

- Chat with students, admin, and group chats
- Send vocabulary and voice messages

### Settings & Profile — `/teacher/settings`, `/teacher/profile`

Profile management, avatar, password.

### Redirects

- `/teacher/leads` → `/teacher/students`

---

## 8. Student Portal

Base path: `/student/*`

### Dashboard — `/student/dashboard`

- Upcoming lessons
- Learning activity summary
- Quick links to schedule, payments, feedback

### Schedule — `/student/schedule`

Personal lesson schedule with week count badge.

### Recordings — `/student/recordings`

View lesson voice recordings shared by teachers.

### My Feedbacks — `/student/my-feedbacks`

History of structured teacher feedback (CEFR-based form).

### Our Teachers — `/student/our-teachers`

Information about assigned teachers.

### Payments — `/student/payments`

Monthly tuition payments:

- View payment status per month
- Self-report payment method: Cash, Card, Idram, Terminal
- Payment summary (paid/unpaid/overdue)

### Analytics — `/student/analytics`

Personal learning analytics and progress.

### Attendance — `/student/attendance`

- Attendance history
- Report planned future absences with comment
- View absence types (justified/unjustified)

### Chat — `/student/chat`

Chat with teachers and admin; view voice messages from teachers.

### Settings & Profile — `/student/settings`, `/student/profile`

Profile management, avatar, password.

### Redirects

- `/student/absence` → `/student/attendance`

---

## 9. Core Business Workflows

### Student lifecycle

```
1. CRM lead created (admin/manager)
       ↓
2. Status: NEW → FIRST_LESSON (trial scheduled)
       ↓
3. Teacher conducts trial → approves lead
       ↓
4. Status: PAID → register-paid creates student account
       ↓
5. Student assigned to group, center, teacher; monthly fee set
       ↓
6. Monthly payments auto-generated
       ↓
7. Student attends lessons; attendance tracked
       ↓
8. Teacher provides feedback; recordings shared
       ↓
9. Risk labels updated based on attendance/payment behavior
```

### Lesson obligation workflow

Each lesson tracks five completion flags:

| Flag | Description |
|------|-------------|
| `vocabularySent` | Vocabulary message sent to group chat |
| `absenceMarked` | Attendance completed for all students |
| `feedbacksCompleted` | Feedback submitted for all present students |
| `voiceSent` | Voice message sent to group |
| `textSent` | Text message sent to group |

Missing obligations trigger **automatic salary deductions** (configurable AMD amounts in system settings, typically after 24h threshold via finance automation).

### Lesson statuses

`SCHEDULED` → `IN_PROGRESS` → `COMPLETED`

Also: `CANCELLED`, `MISSED`, `REPLACED` (substitute teacher)

### Substitute teachers

- Per-lesson substitute assignment
- Per-group-day substitute via bulk endpoint
- Group-level default substitute teacher

### Teacher salary workflow

```
1. Teacher completes lessons → salary calculated from lessonRateAMD
2. Penalty deductions for missing obligations (vocabulary, feedback, voice, text, daily plan)
3. Additional manual deductions in Deduction table
4. Monthly SalaryRecord generated (gross − deductions = net)
5. Admin processes and marks salary as paid
```

### Planned absences

Students report future absences with a comment. Admins/teachers see planned absences on dashboard and in attendance views.

### At-risk students

System identifies students at risk based on attendance patterns and payment status. Visible in admin dashboard and analytics.

---

## 10. Real-Time Chat

### Chat types

- **GROUP** — auto-created per group; all group members participate
- **DIRECT** — one-to-one between two users
- **Custom groups** — admin/manager-created multi-user chats

### Message types

`TEXT`, `VOICE`, `IMAGE`, `VIDEO`, `FILE`, `SYSTEM`, `VOCABULARY`

### Features

- Real-time delivery via Socket.IO (`/chat` namespace)
- JWT authentication on WebSocket connection
- Read receipts
- Online presence
- Vocabulary message template (special message type for lesson obligations)
- File uploads via Cloudflare R2 (avatars, chat media, documents)
- Edit and delete messages

### Role-specific chat access

| Role | Can chat with |
|------|---------------|
| Admin/Manager | Students, teachers, groups, custom groups |
| Teacher | Students, admin, own groups |
| Student | Teachers, admin |

---

## 11. Finance & Payments

### Student payments

- Monthly tuition auto-generated per student
- Payment statuses: pending, paid, overdue, cancelled
- Payment methods: `CASH`, `CARD`, `IDRAM`, `TERMINAL`
- Students self-report payment; admins process/confirm
- **No online payment gateway** — manual recording only

### Teacher salaries

- Based on `lessonRateAMD` per completed lesson
- Monthly `SalaryRecord` with gross, deductions, net
- Salary statuses: pending, processed, paid
- Detailed breakdown per teacher per month

### Deductions

Automatic reasons (from missed obligations):

- Missing vocabulary
- Missing feedback
- Missing voice message
- Missing text message
- Missing daily plan

Manual deductions can also be added by admin.

### Finance automation

Admin-only endpoint runs:

- Mark overdue payments
- Create vocabulary-missing deductions (24h threshold)
- Create feedback-missing deductions (24h threshold)

---

## 12. CRM & Lead Management

### Pipeline stages

| Status | Meaning |
|--------|---------|
| `NEW` | Fresh lead, not yet contacted |
| `FIRST_LESSON` | Trial lesson scheduled/conducted |
| `PAID` | Approved by teacher; ready for registration |
| `WAITLIST` | Waiting for group availability |
| `ARCHIVE` | Closed/inactive lead |

### Lead data

- Contact info, age, level interest, source
- Assigned manager, teacher, center, group
- Voice recording attachments (stored in R2)
- Activity log (status changes, comments, recordings, approvals, transfers)

### Teacher actions on leads

- **Approve** — moves lead from `FIRST_LESSON` to `PAID`
- **Transfer** — reassign lead to another teacher

### Registration

`register-paid` endpoint creates a full student account from a paid lead, including user credentials and group assignment.

---

## 13. Lessons, Attendance & Feedback

### Lessons

- Single and recurring lesson creation
- Bulk delete
- Statistics endpoint (completion rates, counts)
- Today/upcoming/my-lessons views per role

### Attendance

- Per-lesson, per-student attendance records
- Absence types: justified / unjustified
- Bulk attendance marking
- Group attendance reports
- Student self-service: view own attendance, calendar view
- At-risk student identification

### Feedback

Structured CEFR-based feedback form per student per lesson:

- CEFR level assessment
- Grammar topics covered
- Skills practiced (reading, writing, listening, speaking)
- Participation and behavior
- Progress notes

Teachers submit feedback; students view history in "My Feedbacks".

### Daily plans

Teachers plan lessons with topics and linked resources (reading, listening, writing, speaking materials).

### Recordings

Student voice recordings linked to student, group, and optionally lesson. Retention policies documented separately.

---

## 14. Analytics & Reporting

### Admin analytics (`/admin/analytics`)

- Organization summary
- Teacher performance metrics
- Students at risk
- Revenue trends over time
- Attendance rates
- Lesson completion statistics

### Teacher analytics (`/teacher/analytics`)

Personal performance metrics and obligation completion rates.

### Student analytics (`/student/analytics`)

Personal learning progress and attendance overview.

### Attendance reports

Group-level attendance reports exportable from attendance module.

### Finance reports

Monthly finance reports with revenue, payments, and salary summaries.

---

## 15. Settings & System Configuration

| Setting | Description |
|---------|-------------|
| Organization logo | Uploaded to R2; shown on landing and portals |
| Dashboard banner | Admin dashboard header image |
| Penalty amounts | Fixed AMD deductions per missed obligation type |
| Action percents | Percentage-based penalty configuration |
| Manager management | Create/edit managers, assign to centers |
| Security | Password change for current user |
| Notifications | Email notification preferences |

System settings cached in-memory (2-minute TTL) on backend.

---

## 16. Search & Navigation

### Global search

Available in admin/teacher portals. Searches across:

- Students
- Teachers
- Groups
- CRM leads
- Lessons
- Payments
- Recordings
- Quick navigation to portal pages

### Sidebar navigation

Each portal has role-specific sidebar with icons, badges (e.g., schedule week count for students), and active route highlighting.

### Breadcrumbs and back navigation

Detail pages (student, teacher, lesson, group) include navigation back to list views.

---

## 17. Internationalization

| Aspect | Detail |
|--------|--------|
| Library | `next-intl` v4 |
| Locales | `en` (default), `hy` (Armenian) |
| Translation files | `apps/web/languages/en.json`, `hy.json` (~1800+ keys each) |
| URL behavior | Locale in file structure but **hidden from URL** (`localePrefix: 'never'`) |
| Detection | Cookie-based, 1-year persistence |
| Switcher | `LanguageSwitcher` component in navbar/settings |

Translation namespaces include: `common`, `auth`, `nav`, `dashboard`, `students`, `teachers`, `finance`, `crm`, `chat`, `settings`, `landing`, and more.

---

## 18. Backend API Overview

Global prefix: `/api`. Global guards: JWT auth, Roles guard, Throttler (100 req/min).

### Modules

| Module | Base path | Purpose |
|--------|-----------|---------|
| App | `/` | Health, warmup, API info |
| Auth | `/auth` | Login, refresh, change password |
| Users | `/users` | User CRUD, managers list |
| Centers | `/centers` | Branch CRUD and statistics |
| Groups | `/groups` | Group CRUD, student assignment |
| Teachers | `/teachers` | Teacher CRUD, dashboard, obligations |
| Students | `/students` | Student CRUD, dashboard, teachers |
| Lessons | `/lessons` | Lesson CRUD, start/complete, obligations |
| Attendance | `/attendance` | Marking, reports, planned absences |
| Feedback | `/feedback` | Lesson feedback CRUD |
| Daily Plans | `/daily-plans` | Plan CRUD |
| Finance | `/finance` | Payments, salaries, deductions, automation |
| CRM | `/crm/leads` | Lead pipeline CRUD |
| Teacher Leads | `/teacher/leads` | Approve/transfer leads |
| Chat | `/chat` | Messages, groups, custom groups |
| Analytics | `/analytics` | Admin analytics (admin only) |
| Settings | `/settings` | Logo, banner, penalties, percents |
| Storage | `/storage` | File upload, presigned URLs, proxy |
| Admin | `/admin` | Recordings, voice recordings |
| Search | `/search` | Global search |
| Teacher Notes | `/teacher-notes` | Internal teacher notes |
| Student Notes | `/student-notes` | Internal student notes |
| Notifications | (internal) | Email service, no public controller |

### WebSocket

- Namespace: `/chat`
- Events: join room, send message, read receipt, online presence
- Auth: JWT token on connection

---

## 19. Database Entities

28 Prisma models:

| Model | Description |
|-------|-------------|
| **User** | Auth identity, role, status |
| **ManagerProfile** | Manager ↔ center assignment |
| **Center** | Branch/location |
| **Group** | Class within center |
| **Teacher** | Teacher profile, rates, schedule |
| **TeacherCenter** | Teacher-center many-to-many |
| **TeacherNote** | Internal notes on teachers |
| **Student** | Student profile, fees, risk |
| **StudentNote** | Notes on students |
| **StudentGroupHistory** | Group membership history |
| **PlannedAbsence** | Student-reported future absences |
| **Lesson** | Scheduled class with obligation flags |
| **Attendance** | Per lesson/student presence |
| **Feedback** | Structured teacher feedback |
| **Payment** | Monthly student tuition |
| **SalaryRecord** | Monthly teacher salary |
| **Deduction** | Teacher salary deductions |
| **Chat** | Conversation (group or direct) |
| **ChatParticipant** | Chat membership |
| **Message** | Chat messages with file metadata |
| **Notification** | In-app notifications |
| **SystemSettings** | Global config |
| **DailyPlan** | Lesson planning container |
| **DailyPlanTopic** | Topics within a plan |
| **DailyPlanResource** | Resources linked to topics |
| **RecordingItem** | Student voice recordings |
| **CrmLead** | Sales pipeline lead |
| **CrmLeadActivity** | Lead activity log |
| **CrmLeadAttachment** | Lead file attachments |
| **AuditLog** | Change audit trail |

### Key enums

`UserRole`, `UserStatus`, `LessonStatus`, `AbsenceType`, `PaymentStatus`, `SalaryStatus`, `DeductionReason`, `CrmLeadStatus`, `ChatType`, `MessageType`, `StudentStatus`, `RiskLabel`, `CefrLevel`, `DailyPlanResourceKind`

---

## 20. External Integrations

| Service | Purpose |
|---------|---------|
| **PostgreSQL (Neon)** | Primary database |
| **Cloudflare R2** | File storage (avatars, chat media, documents, CRM recordings) via S3-compatible SDK |
| **Resend** | Transactional email (absence alerts, payment reminders, welcome emails) |
| **Socket.IO** | Real-time chat |
| **Vercel Cron** | API warmup to prevent cold starts on Render |

### Email notifications (via Resend)

- Absence alerts
- Payment reminders
- Welcome emails
- Mock-logged in development when `RESEND_API_KEY` is missing

### File storage

- Presigned URLs for direct upload
- Local fallback in development
- Proxy endpoint for serving files

---

## 21. Project Structure

```
ilona-english-center-gugo/
├── apps/
│   ├── web/                          # Next.js 16 frontend
│   │   ├── languages/                # en.json, hy.json
│   │   ├── public/                   # Static assets
│   │   └── src/
│   │       ├── app/                  # App Router pages
│   │       │   ├── [locale]/
│   │       │   │   ├── (admin)/      # Admin + manager portals
│   │       │   │   ├── (auth)/       # Login, register
│   │       │   │   ├── (student)/    # Student portal
│   │       │   │   ├── (teacher)/    # Teacher portal
│   │       │   │   └── page.tsx      # Landing page
│   │       │   └── api/cron/         # Vercel cron warmup
│   │       ├── config/               # i18n, routing, navigation
│   │       ├── features/             # Domain feature modules
│   │       └── shared/               # UI components, layout, lib, hooks
│   │
│   └── api/                          # NestJS backend
│       └── src/
│           ├── common/               # Guards, decorators, filters
│           ├── config/               # App and JWT config
│           └── modules/              # Feature modules (20+)
│
├── packages/
│   ├── database/                     # Prisma schema, migrations, seed
│   └── types/                        # Shared TypeScript types
│
├── docs/                             # Documentation
├── Rules/                            # Cursor rules, platform guides
└── Security/                         # Security checklists
```

### Frontend architecture

- **Pages** in `app/` are thin; logic in co-located hooks and components
- **Features** folder = domain-driven API clients, hooks, components, types
- **Shared** = reusable UI (shadcn), layout (Sidebar, Header, DashboardLayout), API client

### Backend architecture

- Modular NestJS with global JWT + Roles guards
- Prisma via dedicated module
- Manager center scoping utility used across services
- DTOs with class-validator per module

---

## Appendix: Complete Route Index

### Public

| Route | Page |
|-------|------|
| `/` | Landing page |
| `/login` | Login |
| `/register` | Register placeholder |

### Admin (18 unique routes + detail pages)

| Route | Page |
|-------|------|
| `/admin/dashboard` | Dashboard |
| `/admin/crm` | CRM |
| `/admin/groups` | Centers list |
| `/admin/groups/[centerId]` | Groups in center |
| `/admin/teachers` | Teachers list |
| `/admin/teachers/[id]` | Teacher detail |
| `/admin/students` | Students list |
| `/admin/students/[id]` | Student detail |
| `/admin/schedule` | Schedule |
| `/admin/daily-plan` | Daily plans |
| `/admin/calendar` | Calendar |
| `/admin/calendar/[lessonId]` | Lesson workbench |
| `/admin/attendance-register` | Attendance register |
| `/admin/recording` | Recordings |
| `/admin/finance` | Finance |
| `/admin/finance/teacher-salaries/[teacherId]/[month]` | Salary detail |
| `/admin/analytics` | Analytics |
| `/admin/chat` | Chat |
| `/admin/settings` | Settings |
| `/admin/profile` | Profile |

### Manager (16 routes — same pages, center-scoped)

Mirrors admin routes under `/manager/*` except finance, analytics, and recording.

### Teacher (15 routes)

| Route | Page |
|-------|------|
| `/teacher/dashboard` | Dashboard |
| `/teacher/students` | Students + leads |
| `/teacher/students/[id]` | Student detail |
| `/teacher/schedule` | Schedule |
| `/teacher/calendar` | Calendar |
| `/teacher/calendar/[lessonId]` | Lesson workbench |
| `/teacher/today` | Today's lessons |
| `/teacher/daily-plan` | Daily plans |
| `/teacher/attendance-register` | Attendance |
| `/teacher/recordings` | Recordings |
| `/teacher/salary` | Salary |
| `/teacher/analytics` | Analytics |
| `/teacher/chat` | Chat |
| `/teacher/settings` | Settings |
| `/teacher/profile` | Profile |

### Student (12 routes)

| Route | Page |
|-------|------|
| `/student/dashboard` | Dashboard |
| `/student/schedule` | Schedule |
| `/student/recordings` | Recordings |
| `/student/my-feedbacks` | Feedbacks |
| `/student/our-teachers` | Teachers |
| `/student/payments` | Payments |
| `/student/analytics` | Analytics |
| `/student/attendance` | Attendance |
| `/student/chat` | Chat |
| `/student/settings` | Settings |
| `/student/profile` | Profile |

---

*This document describes the Ilona English Center platform as implemented in the codebase. For architecture decisions and deployment guides, see also `docs/01-ARCHITECTURE.md` and `docs/02-TECH_STACK.md`.*
