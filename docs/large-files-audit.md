# Large Files Audit (>400 lines)

Audit date: 2026-06-29

Goal: gradually split source files so each stays at or below **400 lines**.

## Refactor progress

| Date | File | Before | After | Notes |
| --- | --- | ---: | ---: | --- |
| 2026-06-29 | `apps/api/src/modules/chat/chat-management.service.ts` | 1,195 | 61 (facade) | Split into 6 domain services + util |
| 2026-06-29 | `apps/api/src/modules/students/student-crud.service.ts` | 1,092 | 68 (facade) | Split into list/read/create/update/delete + access util |
| 2026-06-29 | `apps/api/src/modules/attendance/attendance.service.ts` | 1,046 | 68 (facade) | Split into lesson/student query, report, write, planned absence |
| 2026-06-29 | `apps/web/src/features/chat/components/ChatWindow.tsx` | 978 | 341 (orchestrator) | Split into header, message list/item, composer + 4 hooks + utils |
| 2026-06-29 | `apps/web/src/shared/components/attendance/WeekAttendanceGrid.tsx` | 931 | 130 (orchestrator) | Split into toolbar, table, dialogs, legend + state hook + status utils |
| 2026-06-29 | `apps/web/src/shared/components/attendance/AttendanceGrid.tsx` | 886 | 134 (orchestrator) | Reused week-attendance toolbar/legend/utils; split table, dialogs + lesson hook |
| 2026-06-29 | `apps/api/src/modules/groups/groups.service.ts` | 886 | 72 (facade) | Split into query, write, membership, chat sync, teacher validation + includes |
| 2026-06-29 | `apps/api/src/modules/chat/message.service.ts` | 886 | 78 (facade) | Split into query, send, mutation, recording + storage/recording utils |
| 2026-06-29 | `apps/api/src/modules/chat/chat-lists.service.ts` | 882 | 37 (facade) | Split into admin/teacher lists, admin contact, unread count + list util |
| 2026-06-29 | `apps/api/src/modules/lessons/lesson-crud.service.ts` | 860 | 68 (facade) | Split into list, read, create, update, delete + manager access |
| 2026-06-29 | `apps/api/src/modules/crm/leads.service.ts` | 851 | 135 (facade) | Split into list, read, create, update, delete, status, voice, teacher + access/activity |

## Summary

| Metric | Value |
| --- | --- |
| Total source files scanned | 836 |
| Files over 400 lines | **48** (was 58) |
| Biggest file | `apps/web/src/features/calendar/PortalCalendarPage.tsx` (828 lines) |
| Frontend (`apps/web`) | 35 |
| Backend (`apps/api`) | 14 |
| Shared / packages | 0 |

**Extensions scanned:** `.ts`, `.tsx`, `.js`, `.jsx`, `.css`, `.scss`, `.module.css`, `.module.scss`

**Excluded from scan:** `node_modules`, `.next`, `dist`, `build`, `coverage`, generated files, Prisma generated client, lock files, migration SQL, minified files, translation JSON, `public` / `assets`

---

## Refactor backlog (sorted by line count)

| # | File path | Lines | Area/module | Suggested refactor approach | Priority |
| --- | --- | ---: | --- | --- | --- |
| ~~1~~ | ~~`apps/api/src/modules/chat/chat-management.service.ts`~~ | ~~1,195~~ | Backend / Chat | **Done** | — |
| ~~2~~ | ~~`apps/api/src/modules/students/student-crud.service.ts`~~ | ~~1,092~~ | Backend / Students | **Done** | — |
| ~~3~~ | ~~`apps/api/src/modules/attendance/attendance.service.ts`~~ | ~~1,046~~ | Backend / Attendance | **Done** | — |
| ~~4~~ | ~~`apps/web/src/features/chat/components/ChatWindow.tsx`~~ | ~~978~~ | Frontend / Chat | **Done** | — |
| ~~5~~ | ~~`apps/web/src/shared/components/attendance/WeekAttendanceGrid.tsx`~~ | ~~931~~ | Frontend / Attendance (shared) | **Done** | — |
| ~~6~~ | ~~`apps/web/src/shared/components/attendance/AttendanceGrid.tsx`~~ | ~~886~~ | Frontend / Attendance (shared) | **Done** | — |
| ~~7~~ | ~~`apps/api/src/modules/groups/groups.service.ts`~~ | ~~886~~ | Backend / Groups | **Done** | — |
| ~~8~~ | ~~`apps/api/src/modules/chat/message.service.ts`~~ | ~~886~~ | Backend / Chat | **Done** | — |
| ~~9~~ | ~~`apps/api/src/modules/chat/chat-lists.service.ts`~~ | ~~882~~ | Backend / Chat | **Done** | — |
| ~~10~~ | ~~`apps/api/src/modules/lessons/lesson-crud.service.ts`~~ | ~~860~~ | Backend / Lessons | **Done** | — |
| ~~11~~ | ~~`apps/api/src/modules/crm/leads.service.ts`~~ | ~~851~~ | Backend / CRM | **Done** | — |
| 12 | `apps/web/src/features/calendar/PortalCalendarPage.tsx` | 828 | Frontend / Calendar | Extract toolbar/filters, view switcher, lesson panels, and data-fetch hooks; split page layout from calendar state orchestration | High |
| 13 | `apps/web/src/shared/components/calendar/LessonListTable.tsx` | 792 | Frontend / Calendar (shared) | Extract table columns, row actions, status badges, and sort/filter config; move row click/navigation handlers to hook | High |
| 14 | `apps/api/src/modules/finance/payments.service.ts` | 776 | Backend / Finance | Split payment recording, reconciliation, refunds/adjustments, and reporting queries; extract amount/date validation | High |
| 15 | `apps/api/src/modules/settings/settings.service.ts` | 738 | Backend / Settings | Split settings domains (penalties, managers, center config) into focused services; extract settings key mapping and defaults | Medium |
| 16 | `apps/api/src/modules/users/users.service.ts` | 729 | Backend / Users | Split user CRUD, role/profile provisioning, and status management; extract password hashing and duplicate-email checks | Medium |
| 17 | `apps/api/src/modules/teachers/teacher-crud.service.ts` | 715 | Backend / Teachers | Split create/update/delete, center assignment, and schedule linkage; extract manager-scope and profile sync helpers | Medium |
| 18 | `apps/web/src/features/groups/components/EditGroupForm.tsx` | 709 | Frontend / Groups | Extract form sections (basic info, teacher, schedule, capacity); split validation schema; extract submit/mutation hook | Medium |
| 19 | `apps/web/src/features/students/components/EditStudentForm.tsx` | 701 | Frontend / Students | Extract account, group, parent/CRM, and payment sections into subcomponents; move Zod/schema and defaults to separate files | Medium |
| 20 | `apps/web/src/features/students/components/StudentDetailsModal.tsx` | 695 | Frontend / Students | Split tabs/sections (profile, attendance, payments, notes); extract read-only field groups and action buttons | Medium |
| 21 | `apps/web/src/features/chat/hooks/useChat.ts` | 632 | Frontend / Chat | Split into focused hooks (messages, socket events, cache updates, navigation); extract shared chat query keys and reducers | Medium |
| 22 | `apps/web/src/features/chat/components/TeacherChatList.tsx` | 630 | Frontend / Chat | Extract list item, filters, empty/loading states; move list query and selection logic into hook | Medium |
| 23 | `apps/web/src/shared/components/ui/date-picker-input.tsx` | 627 | Frontend / Shared UI | Split calendar popover, input masking, range/single modes, and locale formatting into subcomponents/utils | Medium |
| 24 | `apps/api/src/modules/search/search.service.ts` | 623 | Backend / Search | Split entity-specific search handlers (students, teachers, groups, lessons); extract shared full-text/filter builders | Medium |
| 25 | `apps/web/src/features/crm/components/EditLeadModal.tsx` | 616 | Frontend / CRM | Extract form sections, status/activity UI, and voice/recording blocks; split validation schema and mutation hook | Medium |
| 26 | `apps/web/src/features/groups/components/CreateGroupForm.tsx` | 611 | Frontend / Groups | Same as EditGroupForm: section components, shared group form schema, and create-specific defaults | Medium |
| 27 | `apps/api/src/modules/settings/settings.controller.ts` | 607 | Backend / Settings | Thin controller: move business logic to settings sub-services; group endpoints by domain; extract response DTO mapping | Medium |
| 28 | `apps/api/src/modules/finance/salary-record.service.ts` | 601 | Backend / Finance | Split salary calculation, record CRUD, and period aggregation; extract penalty/bonus adjustment helpers | Medium |
| 29 | `apps/web/src/features/settings/components/EditManagerForm.tsx` | 589 | Frontend / Settings | Extract manager profile, center assignment, and permissions sections; split validation and API mutation hook | Medium |
| 30 | `apps/web/src/shared/components/calendar/FeedbacksTab.tsx` | 584 | Frontend / Calendar (shared) | Extract feedback list, form, and rating UI; move fetch/submit hooks and empty states out of main tab | Medium |
| 31 | `apps/api/src/modules/prisma/prisma.service.ts` | 576 | Backend / Infrastructure | Split connection lifecycle, middleware/extensions, and raw-query helpers; keep core client bootstrap minimal | Medium |
| 32 | `apps/api/src/modules/analytics/analytics.service.ts` | 552 | Backend / Analytics | Split dashboard metrics by domain (attendance, finance, CRM); extract SQL/Prisma aggregation queries per report | Medium |
| 33 | `apps/api/src/modules/finance/finance.controller.ts` | 551 | Backend / Finance | Thin controller: delegate to payment/salary services; group routes by resource; extract query DTO parsing | Medium |
| 34 | `apps/web/src/features/centers/components/EditCenterForm.tsx` | 541 | Frontend / Centers | Extract address, contact, manager, and settings sections; split schema and form state hook | Medium |
| 35 | `apps/web/src/features/centers/components/CenterDetailsModal.tsx` | 537 | Frontend / Centers | Split detail sections and action footer; extract stat cards and linked entities lists | Medium |
| 36 | `apps/web/src/features/crm/components/VoiceLeadDetailModal.tsx` | 534 | Frontend / CRM | Extract audio player, transcript/metadata panel, and action bar; move recording fetch logic to hook | Medium |
| 37 | `apps/web/src/features/lessons/components/AddLessonForm.tsx` | 521 | Frontend / Lessons | Extract recurrence, teacher/group pickers, and time fields; split validation schema and lesson defaults | Medium |
| 38 | `apps/web/src/features/teachers/components/AddTeacherForm.tsx` | 515 | Frontend / Teachers | Extract account, center, and schedule sections; share field components with EditTeacherForm | Medium |
| 39 | `apps/web/src/shared/lib/api-client.ts` | 511 | Frontend / Shared lib | Split by API domain (auth, chat, students, etc.); extract interceptors, error normalization, and token refresh | Medium |
| 40 | `apps/web/src/features/students/components/StudentAccountFormFieldsCrmLeadLayout.tsx` | 506 | Frontend / Students | Extract reusable field groups; share base account fields with `StudentAccountFormFields`; move CRM-specific layout wrappers | Medium |
| 41 | `apps/web/src/features/chat/components/AdminChatList.tsx` | 494 | Frontend / Chat | Extract list filters, conversation row, and bulk actions; share list item with TeacherChatList where possible | Low |
| 42 | `apps/web/src/shared/components/ui/single-select-dropdown.tsx` | 492 | Frontend / Shared UI | Split trigger, options list, search/filter, and keyboard navigation; extract positioning and selection utils | Low |
| 43 | `apps/web/src/features/daily-plan/DailyPlanEditor.tsx` | 487 | Frontend / Daily plan | Extract editor toolbar, block list, and individual block types; move document state/reducer to hook | Low |
| 44 | `apps/web/src/features/chat/components/ChatContainer.tsx` | 485 | Frontend / Chat | Extract sidebar/list pane vs window layout; move chat selection and responsive breakpoint logic to hook | Low |
| 45 | `apps/web/src/features/schedule/ScheduleLessonViews.tsx` | 478 | Frontend / Schedule | Split day/week/month views into separate components; extract shared lesson card and time-grid utils | Low |
| 46 | `apps/web/src/features/chat/components/VoiceMessagePlayer.tsx` | 465 | Frontend / Chat | Extract waveform/progress UI, playback controls, and download logic; move audio element lifecycle to hook | Low |
| 47 | `apps/api/src/modules/feedback/feedback.service.ts` | 465 | Backend / Feedback | Split create/update/query paths; extract lesson/student validation and notification side-effects | Low |
| 48 | `apps/web/src/features/chat/components/VoiceRecorder.tsx` | 464 | Frontend / Chat | Extract recording UI, permission handling, and upload flow; move MediaRecorder lifecycle to hook | Low |
| 49 | `apps/web/src/features/crm/components/LeadDrawer.tsx` | 462 | Frontend / CRM | Split drawer header, activity timeline, and quick actions; extract lead fetch/update hooks | Low |
| 50 | `apps/web/src/features/chat/components/AdminChatContainer.tsx` | 449 | Frontend / Chat | Extract admin-specific filters and layout; share base container logic with `ChatContainer` | Low |
| 51 | `apps/web/src/features/finance/components/SalaryBreakdownModal.tsx` | 447 | Frontend / Finance | Extract breakdown table, summary cards, and adjustment rows; move salary fetch/formatting to hook | Low |
| 52 | `apps/web/src/features/students/components/StudentAccountFormFields.tsx` | 443 | Frontend / Students | Extract field groups (credentials, contact, status); share constants and validation with CRM layout variant | Low |
| 53 | `apps/web/src/features/groups/components/GroupCard.tsx` | 433 | Frontend / Groups | Extract card header, stats row, and action menu; move derived display values to small utils | Low |
| 54 | `apps/web/src/features/teachers/components/EditTeacherForm.tsx` | 428 | Frontend / Teachers | Reuse AddTeacherForm section components; extract edit-only fields and update mutation hook | Low |
| 55 | `apps/web/src/features/students/components/AddStudentForm.tsx` | 412 | Frontend / Students | Share sections with EditStudentForm; extract create defaults and enrollment-specific validation | Low |
| 56 | `apps/api/src/modules/storage/storage.service.ts` | 412 | Backend / Storage | Split upload, delete, signed URL, and retention logic; extract provider-specific adapters | Low |
| 57 | `apps/web/src/features/chat/api/chat.api.ts` | 404 | Frontend / Chat API | Split endpoints by resource (chats, messages, voice); extract shared request/response types | Low |
| 58 | `apps/web/src/features/centers/components/CreateCenterForm.tsx` | 401 | Frontend / Centers | Share sections with EditCenterForm; extract create defaults and validation schema | Low |

---

## Recommended first 3 refactors

1. **`apps/web/src/features/calendar/PortalCalendarPage.tsx`** (828 lines) — Extract toolbar/filters, view switcher, lesson panels.
2. **`apps/web/src/shared/components/calendar/LessonListTable.tsx`** (792 lines) — Extract table columns, row actions, status badges.
3. **`apps/api/src/modules/finance/payments.service.ts`** (776 lines) — Split payment recording, reconciliation, refunds.

---

## Notes for incremental refactors

- Prefer **vertical splits** (by feature/domain) over arbitrary line-count chunks.
- After each split, run `pnpm typecheck` and targeted tests for the touched module.
- Frontend forms (`Edit*Form`, `Create*Form`, `*Modal`) often share sections — extract shared pieces once, then refactor siblings together.
- Backend controllers over 400 lines should become thin; move logic into existing or new services rather than growing controllers further.
- Re-run this audit after refactors to track progress toward the 400-line target.
