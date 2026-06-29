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
| 2026-06-29 | `apps/web/src/features/calendar/PortalCalendarPage.tsx` | 828 | 108 (orchestrator) | Split into filters, stats, controls, week/month/list views, overlays + 2 hooks + utils |
| 2026-06-29 | `apps/web/src/shared/components/calendar/LessonListTable.tsx` | 792 | 125 (orchestrator) | Split into bulk bar, mobile cards, desktop table + hook + utils |
| 2026-06-29 | `apps/api/src/modules/finance/payments.service.ts` | 776 | 83 (facade) | Split into query, write, summary, lifecycle + util/types/include |
| 2026-06-29 | `apps/api/src/modules/settings/settings.service.ts` | 738 | 74 (facade) | Split into core, branding, footer, percents, penalties + util/types |
| 2026-06-29 | `apps/api/src/modules/users/users.service.ts` | 729 | 77 (facade) | Split into read, manager, write + util |
| 2026-06-29 | `apps/api/src/modules/teachers/teacher-crud.service.ts` | 715 | 45 (facade) | Split into list, read, write, access + util/constants |
| 2026-06-29 | `apps/api/src/modules/search/search.service.ts` | 623 | 60 (facade) | Split into staff query, role query + filter util |
| 2026-06-29 | `apps/web/src/features/groups/components/EditGroupForm.tsx` | 709 | 175 (orchestrator) | Split into fields, regenerate dialog, hook + types/constants |
| 2026-06-29 | `apps/web/src/features/students/components/EditStudentForm.tsx` | 701 | 88 (orchestrator) | Split into fields, hook + types/constants |
| 2026-06-29 | `apps/web/src/features/students/components/StudentDetailsModal.tsx` | 695 | 236 (orchestrator) | Split into body, stat card, hook + types/util |
| 2026-06-29 | `apps/web/src/features/chat/hooks/useChat.ts` | 632 | 53 (facade) | Split into query keys, cache util, queries/mutations/cache/admin/teacher/student hooks + unread counts |
| 2026-06-29 | `apps/web/src/features/chat/components/TeacherChatList.tsx` | 630 | 79 (orchestrator) | Split into tab bar, search, list items (admin/groups/students), loading/empty + hook + types |
| 2026-06-29 | `apps/web/src/shared/components/ui/date-picker-input.tsx` | 695 | 83 (orchestrator) | Split into constants, types, utils, popover position, hook, calendar popover, trigger |
| 2026-06-29 | `apps/web/src/features/groups/components/CreateGroupForm.tsx` | 656 | 82 (orchestrator) | Split into fields, hook + types; reused edit-group-form constants |
| 2026-06-29 | `apps/web/src/features/crm/components/EditLeadModal.tsx` | 637 | 95 (orchestrator) | Split into form body, hook + types/constants |
| 2026-06-29 | `apps/api/src/modules/settings/settings.controller.ts` | 659 | removed | Split into logo, dashboard-banner, footer, penalties controllers + image util/constants |
| 2026-06-29 | `apps/api/src/modules/finance/salary-record.service.ts` | 664 | 47 (facade) | Split into list, read, write services + types/db util/enrichment helpers |
| 2026-06-29 | `apps/web/src/features/settings/components/EditManagerForm.tsx` | 636 | 175 (orchestrator) | Split into profile/center/status fields, hook + types |
| 2026-06-29 | `apps/web/src/shared/components/calendar/FeedbacksTab.tsx` | 626 | 55 (orchestrator) | Split into student card, states, tick box, hook + types |
| 2026-06-29 | `apps/api/src/modules/prisma/prisma.service.ts` | 646 | 232 (core) | Split into connection util, retry middleware, planned-absences bootstrap + types |
| 2026-06-29 | `apps/api/src/modules/analytics/analytics.service.ts` | 552 | 41 (facade) | Split into teacher, student-risk, revenue, attendance, lessons, dashboard services + util/types |
| 2026-06-29 | `apps/api/src/modules/finance/finance.controller.ts` | 551 | removed | Split into teacher/student/dashboard/payments/salaries/deductions controllers + scope service |
| 2026-06-29 | `apps/web/src/features/centers/components/EditCenterForm.tsx` | 541 | 151 (orchestrator) | Split into fields, hook + types/constants |
| 2026-06-29 | `apps/web/src/features/centers/components/CenterDetailsModal.tsx` | 537 | 82 (orchestrator) | Split into header, tab bar, tab content, hook + util/types/constants |
| 2026-06-29 | `apps/web/src/features/crm/components/VoiceLeadDetailModal.tsx` | 534 | 79 (orchestrator) | Split into voice section, form body, status panels, header + hook + util/types |
| 2026-06-29 | `apps/web/src/features/lessons/components/AddLessonForm.tsx` | 521 | 74 (orchestrator) | Split into fields, teacher row, hook + util/types |
| 2026-06-29 | `apps/web/src/features/teachers/components/AddTeacherForm.tsx` | 515 | 74 (orchestrator) | Split into fields, hook + types/constants |
| 2026-06-29 | `apps/web/src/shared/lib/api-client.ts` | 511 | 4 (re-export) | Split into core client, refresh coordinator, token/error utils + types |
| 2026-06-29 | `apps/web/src/features/students/components/StudentAccountFormFieldsCrmLeadLayout.tsx` | 506 | 65 (orchestrator) | Split into identity/profile/enrollment/billing sections + hook + types/constants |
| 2026-06-29 | `apps/web/src/features/chat/components/AdminChatList.tsx` | 494 | 101 (orchestrator) | Split into tab bar, search, student/teacher/group items, empty state + hook + types; reused loading skeleton |
| 2026-06-29 | `apps/web/src/shared/components/ui/single-select-dropdown.tsx` | 492 | 84 (orchestrator) | Split into trigger, menu, hook + position util/types/constants |
| 2026-06-29 | `apps/web/src/features/daily-plan/DailyPlanEditor.tsx` | 487 | 74 (orchestrator) | Split into form body, topic section, auto-resize textarea + hook + util/types/constants |
| 2026-06-29 | `apps/web/src/features/chat/components/ChatContainer.tsx` | 520 | 77 (orchestrator) | Split into header, list pane, desktop pane, loading shell + hook + util/types |
| 2026-06-29 | `apps/web/src/features/schedule/ScheduleLessonViews.tsx` | 505 | 7 (re-export) | Split into week/month grids, mobile day view, desktop table, lesson card + hook + util/types/constants |
| 2026-06-29 | `apps/web/src/features/chat/components/VoiceMessagePlayer.tsx` | 508 | 20 (orchestrator) | Split into controls, error state + hook + util/types/constants |
| 2026-06-29 | `apps/api/src/modules/feedback/feedback.service.ts` | 465 | 37 (facade) | Split into query, write, completion side-effects + util |
| 2026-06-29 | `apps/web/src/features/chat/components/VoiceRecorder.tsx` | 464 | 9 (orchestrator) | Split into controls + hook + util/types/constants |
| 2026-06-29 | `apps/web/src/features/crm/components/LeadDrawer.tsx` | 462 | 64 (orchestrator) | Split into header, voice section, form body + hook; reused status panels |
| 2026-06-29 | `apps/web/src/features/chat/components/AdminChatContainer.tsx` | 449 | 68 (orchestrator) | Split into header, list pane, desktop pane, loading shell + hook + util/types |
| 2026-06-29 | `apps/web/src/features/finance/components/SalaryBreakdownModal.tsx` | 447 | 2 (re-export) | Split into view, columns, totals, checkbox + hook + util/types |
| 2026-06-29 | `apps/web/src/features/students/components/StudentAccountFormFields.tsx` | 443 | 70 (orchestrator) | Split into identity/enrollment/parent/billing sections + hook + types/constants |
| 2026-06-29 | `apps/web/src/features/groups/components/GroupCard.tsx` | 433 | 17 (orchestrator) | Split into mobile/desktop layouts, student list, schedule, overflow menu + hook + util |
| 2026-06-29 | `apps/web/src/features/teachers/components/EditTeacherForm.tsx` | 428 | 95 (orchestrator) | Split into fields, hook + types/constants |
| 2026-06-29 | `apps/web/src/features/students/components/AddStudentForm.tsx` | 412 | 74 (orchestrator) | Split into fields wrapper, hook + types/constants; reused CRM layout fields |
| 2026-06-29 | `apps/api/src/modules/storage/storage.service.ts` | 412 | 55 (facade) | Split into upload, read, delete services + client/local util + types |
| 2026-06-29 | `apps/web/src/features/chat/api/chat.api.ts` | 404 | 47 (re-export) | Split into core/admin/teacher/student API modules + types/constants |
| 2026-06-29 | `apps/web/src/features/centers/components/CreateCenterForm.tsx` | 401 | 76 (orchestrator) | Split into fields, hook + types; reused edit-center-form constants |
| 2026-06-29 | `apps/web/src/shared/components/attendance/lesson-attendance/useAttendanceGrid.ts` | 466 | 330 (core hook) | Split save + keyboard sub-hooks + shared util/types (follow-up from AttendanceGrid) |
| 2026-06-29 | `apps/web/src/features/chat/components/CreateGroupChatModal.tsx` | 396 | 79 (orchestrator) | Split into form section, member list, footer + hook + types/constants |
| 2026-06-29 | `apps/web/src/shared/components/attendance/week-attendance/useWeekAttendanceGrid.ts` | 394 | 275 (core hook) | Split save sub-hook + shared util/types (follow-up from WeekAttendanceGrid) |

## Split details (completed refactors)

Յուրաքանչյուր մեծ ֆайլը կրճատվել է vertical split-ով։ Ստորև՝ **նախնական ֆайլ**, **որքան ֆайլ դարձավ** (facade/orchestrator + նոր ֆайլեր), և **նոր ֆайլերի ցանկը**։

| # | Նախնական ֆайլ | Նախկին | Հիմա | Ընդամենը ֆайլ |
| ---: | --- | ---: | ---: | ---: |
| 1 | `chat-management.service.ts` | 1,195 | 61 | **7** |
| 2 | `student-crud.service.ts` | 1,092 | 68 | **6** |
| 3 | `attendance.service.ts` | 1,046 | 68 | **9** |
| 4 | `ChatWindow.tsx` | 978 | 341 | **12** |
| 5 | `WeekAttendanceGrid.tsx` | 931 | 130 | **8** |
| 6 | `AttendanceGrid.tsx` | 886 | 134 | **4** |
| 7 | `groups.service.ts` | 886 | 72 | **8** |
| 8 | `message.service.ts` | 886 | 78 | **8** |
| 9 | `chat-lists.service.ts` | 882 | 37 | **6** |
| 10 | `lesson-crud.service.ts` | 860 | 68 | **7** |
| 11 | `leads.service.ts` | 851 | 135 | **13** |
| 12 | `PortalCalendarPage.tsx` | 828 | 108 | **13** |
| 13 | `LessonListTable.tsx` | 792 | 125 | **9** |
| 14 | `payments.service.ts` | 776 | 83 | **9** |
| 15 | `settings.service.ts` | 738 | 74 | **8** |

| 16 | `users.service.ts` | 729 | 77 | **5** |
| 17 | `teacher-crud.service.ts` | 715 | 45 | **7** |
| 18 | `search.service.ts` | 623 | 60 | **4** |
| 19 | `EditGroupForm.tsx` | 709 | 175 | **6** |
| 20 | `EditStudentForm.tsx` | 701 | 88 | **5** |
| 21 | `StudentDetailsModal.tsx` | 695 | 236 | **6** |
| 22 | `useChat.ts` | 632 | 53 | **10** |
| 23 | `TeacherChatList.tsx` | 630 | 79 | **10** |
| 24 | `date-picker-input.tsx` | 695 | 83 | **8** |
| 25 | `CreateGroupForm.tsx` | 656 | 82 | **4** |

| 26 | `EditLeadModal.tsx` | 637 | 95 | **5** |
| 27 | `settings.controller.ts` | 659 | — | **6** |
| 28 | `salary-record.service.ts` | 664 | 47 | **7** |
| 29 | `EditManagerForm.tsx` | 636 | 175 | **4** |
| 30 | `FeedbacksTab.tsx` | 626 | 55 | **7** |
| 31 | `prisma.service.ts` | 646 | 232 | **5** |
| 32 | `analytics.service.ts` | 552 | 41 | **10** |
| 33 | `finance.controller.ts` | 551 | — | **8** |
| 34 | `EditCenterForm.tsx` | 541 | 151 | **5** |
| 35 | `CenterDetailsModal.tsx` | 537 | 82 | **8** |
| 36 | `VoiceLeadDetailModal.tsx` | 534 | 79 | **8** |
| 37 | `AddLessonForm.tsx` | 521 | 74 | **6** |
| 38 | `AddTeacherForm.tsx` | 515 | 74 | **5** |
| 39 | `api-client.ts` | 511 | 4 | **6** |
| 40 | `StudentAccountFormFieldsCrmLeadLayout.tsx` | 506 | 65 | **8** |
| 41 | `AdminChatList.tsx` | 494 | 101 | **9** |
| 42 | `single-select-dropdown.tsx` | 492 | 84 | **7** |
| 43 | `DailyPlanEditor.tsx` | 487 | 74 | **9** |
| 44 | `ChatContainer.tsx` | 520 | 77 | **8** |
| 45 | `ScheduleLessonViews.tsx` | 505 | 7 | **10** |
| 46 | `VoiceMessagePlayer.tsx` | 508 | 20 | **7** |
| 47 | `feedback.service.ts` | 465 | 37 | **5** |
| 48 | `VoiceRecorder.tsx` | 464 | 9 | **5** |
| 49 | `LeadDrawer.tsx` | 462 | 64 | **8** |
| 50 | `AdminChatContainer.tsx` | 449 | 68 | **8** |
| 51 | `SalaryBreakdownModal.tsx` | 447 | 2 | **9** |
| 52 | `StudentAccountFormFields.tsx` | 443 | 70 | **8** |
| 53 | `GroupCard.tsx` | 433 | 17 | **10** |
| 54 | `EditTeacherForm.tsx` | 428 | 95 | **5** |
| 55 | `AddStudentForm.tsx` | 412 | 74 | **5** |
| 56 | `storage.service.ts` | 412 | 55 | **8** |
| 57 | `chat.api.ts` | 404 | 47 | **7** |
| 58 | `CreateCenterForm.tsx` | 401 | 76 | **4** |
| 59 | `useAttendanceGrid.ts` | 466 | 330 | **4** |
| 60 | `CreateGroupChatModal.tsx` | 396 | 79 | **7** |
| 61 | `useWeekAttendanceGrid.ts` | 394 | 275 | **3** |

**61** մեծ ֆայլ → **406** ֆայլ (60 facade/orchestrator/re-export + 346 նոր split ֆայլ)։

### 1. `apps/api/src/modules/chat/chat-management.service.ts` (1,195 → 61)

**7 ֆайլ** (1 facade + 6 նոր)

| Ֆайл | Դեր |
| --- | --- |
| `chat-management.service.ts` | Facade |
| `chat-user-chats.service.ts` | User chat list |
| `chat-detail.service.ts` | Chat by id |
| `chat-direct.service.ts` | Direct chat create |
| `chat-group-conversation.service.ts` | Group conversation |
| `chat-custom-group.service.ts` | Custom group chats |
| `chat-management.util.ts` | Shared helpers |

### 2. `apps/api/src/modules/students/student-crud.service.ts` (1,092 → 68)

**6 ֆайլ** (1 facade + 5 նոր)

| Ֆайл | Դեր |
| --- | --- |
| `student-crud.service.ts` | Facade |
| `student-list.service.ts` | List / search |
| `student-read.service.ts` | Read by id / userId |
| `student-create.service.ts` | Create + CRM paid link |
| `student-update.service.ts` | Update |
| `student-delete.service.ts` | Delete / deleteMany |

### 3. `apps/api/src/modules/attendance/attendance.service.ts` (1,046 → 68)

**9 ֆайլ** (1 facade + 8 նոր)

| Ֆайл | Դեր |
| --- | --- |
| `attendance.service.ts` | Facade |
| `attendance-lesson-query.service.ts` | Lesson attendance queries |
| `attendance-student-query.service.ts` | Student attendance queries |
| `attendance-report.service.ts` | Reports |
| `attendance-write.service.ts` | Mark / bulk write |
| `attendance-planned-absence.service.ts` | Planned absences |
| `attendance-scope.service.ts` | Role / scope checks |
| `attendance-side-effects.service.ts` | Side effects (finance etc.) |
| `attendance.util.ts` | Shared helpers |

### 4. `apps/web/src/features/chat/components/ChatWindow.tsx` (978 → 341)

**12 ֆайլ** (1 orchestrator + 11 նոր, `chat-window/`)

| Ֆайл | Դեր |
| --- | --- |
| `ChatWindow.tsx` | Orchestrator |
| `chat-window/ChatWindowHeader.tsx` | Header |
| `chat-window/ChatMessageList.tsx` | Message list |
| `chat-window/ChatMessageItem.tsx` | Single message row |
| `chat-window/ChatComposer.tsx` | Input / send |
| `chat-window/useChatWindowScroll.ts` | Scroll / pagination hook |
| `chat-window/useChatWindowComposer.ts` | Composer state hook |
| `chat-window/useChatVoiceHandlers.ts` | Voice recording hook |
| `chat-window/useChatMessageDelete.ts` | Delete message hook |
| `chat-window/chat-window-display.ts` | Title / avatar helpers |
| `chat-window/chat-message-meta.ts` | Message meta helpers |
| `chat-window/chat-voice-upload.ts` | Voice upload util |

### 5. `apps/web/src/shared/components/attendance/WeekAttendanceGrid.tsx` (931 → 130)

**8 ֆайլ** (1 orchestrator + 7 նոր, `week-attendance/`)

| Ֆайл | Դեր |
| --- | --- |
| `WeekAttendanceGrid.tsx` | Orchestrator |
| `week-attendance/WeekAttendanceToolbar.tsx` | Toolbar |
| `week-attendance/WeekAttendanceGridTable.tsx` | Grid table |
| `week-attendance/WeekAttendanceDialogs.tsx` | Dialogs |
| `week-attendance/WeekAttendanceLegend.tsx` | Legend |
| `week-attendance/useWeekAttendanceGrid.ts` | State hook |
| `week-attendance/attendance-status.ts` | Status utils |
| `week-attendance/types.ts` | Shared types |

### 6. `apps/web/src/shared/components/attendance/AttendanceGrid.tsx` (886 → 134)

**4 ֆайլ** (1 orchestrator + 3 նոր, `lesson-attendance/`; toolbar/legend reused from `week-attendance/`)

| Ֆайл | Դեր |
| --- | --- |
| `AttendanceGrid.tsx` | Orchestrator |
| `lesson-attendance/AttendanceGridTable.tsx` | Lesson grid table |
| `lesson-attendance/AttendanceGridDialogs.tsx` | Dialogs |
| `lesson-attendance/useAttendanceGrid.ts` | State hook |

### 7. `apps/api/src/modules/groups/groups.service.ts` (886 → 72)

**8 ֆайլ** (1 facade + 7 նոր)

| Ֆайл | Դեր |
| --- | --- |
| `groups.service.ts` | Facade |
| `group-query.service.ts` | List / read queries |
| `group-write.service.ts` | Create / update |
| `group-membership.service.ts` | Student membership |
| `group-chat-sync.service.ts` | Chat sync |
| `group-teacher-validation.service.ts` | Teacher validation |
| `group-access.service.ts` | Access checks |
| `group-query-includes.ts` | Prisma includes |

### 8. `apps/api/src/modules/chat/message.service.ts` (886 → 78)

**8 ֆайլ** (1 facade + 7 նոր)

| Ֆайл | Դեր |
| --- | --- |
| `message.service.ts` | Facade |
| `message-query.service.ts` | Get messages |
| `message-send.service.ts` | Send message |
| `message-mutation.service.ts` | Edit / delete / read / vocabulary |
| `message-recording.service.ts` | Voice recordings |
| `message.types.ts` | Shared types |
| `message-storage.util.ts` | Storage helpers |
| `message-recording.util.ts` | Recording helpers |

### 9. `apps/api/src/modules/chat/chat-lists.service.ts` (882 → 37)

**6 ֆайլ** (1 facade + 5 նոր)

| Ֆайл | Դեր |
| --- | --- |
| `chat-lists.service.ts` | Facade |
| `chat-admin-lists.service.ts` | Admin list queries |
| `chat-teacher-lists.service.ts` | Teacher groups / students |
| `chat-admin-contact.service.ts` | Admin contact for portal user |
| `chat-unread-count.service.ts` | Unread count batch helpers |
| `chat-list.util.ts` | Shared filters / name format |

### 10. `apps/api/src/modules/lessons/lesson-crud.service.ts` (860 → 68)

**7 ֆайլ** (1 facade + 6 նոր)

| Ֆайл | Դեր |
| --- | --- |
| `lesson-crud.service.ts` | Facade |
| `lesson-list.service.ts` | findAll / findByTeacher / upcoming |
| `lesson-read.service.ts` | findById + access |
| `lesson-create.service.ts` | create / createBulk |
| `lesson-update.service.ts` | update / substitute for day |
| `lesson-delete.service.ts` | delete / deleteBulk |
| `lesson-manager-access.service.ts` | Manager center scope |

### 11. `apps/api/src/modules/crm/leads.service.ts` (851 → 135)

**13 ֆайլ** (1 facade + 12 նոր)

| Ֆайл | Դեր |
| --- | --- |
| `leads.service.ts` | Facade |
| `lead-list.service.ts` | findAll / findForTeacher |
| `lead-read.service.ts` | findById |
| `lead-create.service.ts` | create |
| `lead-update.service.ts` | update / changeBranch |
| `lead-delete.service.ts` | delete + R2 cleanup |
| `lead-status.service.ts` | changeStatus / registerPaid / transitions |
| `lead-voice.service.ts` | Voice lead / recordings |
| `lead-teacher.service.ts` | teacherApprove / teacherTransfer |
| `lead-activity.service.ts` | Activity log / comments |
| `lead-access.service.ts` | Manager / admin scope |
| `lead-include.util.ts` | Prisma include |
| `lead.types.ts` | Shared types |

### 12. `apps/web/src/features/calendar/PortalCalendarPage.tsx` (828 → 108)

**13 ֆайլ** (1 orchestrator + 12 նոր, `portal-calendar/`)

| Ֆайл | Դեր |
| --- | --- |
| `PortalCalendarPage.tsx` | Orchestrator |
| `portal-calendar/usePortalCalendarPage.ts` | Main state / data hook |
| `portal-calendar/usePortalCalendarDeleteActions.ts` | Delete actions hook |
| `portal-calendar/PortalCalendarFiltersSection.tsx` | Filters wrapper |
| `portal-calendar/PortalCalendarStatsGrid.tsx` | Stat cards |
| `portal-calendar/PortalCalendarControls.tsx` | Navigation + view toggle |
| `portal-calendar/PortalCalendarWeekView.tsx` | Week grid |
| `portal-calendar/PortalCalendarMonthView.tsx` | Month grid |
| `portal-calendar/PortalCalendarListView.tsx` | List view |
| `portal-calendar/PortalCalendarOverlays.tsx` | Modals / sheets / toasts |
| `portal-calendar/portal-calendar-display.util.ts` | Time / color helpers |
| `portal-calendar/portal-calendar-url.util.ts` | URL / modal helpers |
| `portal-calendar/portal-calendar.types.ts` | Shared types |

### 13. `apps/web/src/shared/components/calendar/LessonListTable.tsx` (792 → 125)

**9 ֆайլ** (1 orchestrator + 8 նոր, `lesson-list-table/`)

| Ֆайл | Դեր |
| --- | --- |
| `LessonListTable.tsx` | Orchestrator |
| `lesson-list-table/useLessonListTable.ts` | Selection, sort, pagination hook |
| `lesson-list-table/LessonListTableBulkBar.tsx` | Bulk delete bar |
| `lesson-list-table/LessonListTableMobileCards.tsx` | Mobile / iPad card list |
| `lesson-list-table/LessonListTableDesktopTable.tsx` | Desktop table |
| `lesson-list-table/lesson-list-table.types.ts` | Props / row types |
| `lesson-list-table/lesson-list-table.constants.ts` | Constants |
| `lesson-list-table/lesson-list-table-sort.util.ts` | Sort helpers |
| `lesson-list-table/lesson-list-table-navigation.util.ts` | Row navigation |

### 14. `apps/api/src/modules/finance/payments.service.ts` (776 → 83)

**9 ֆайլ** (1 facade + 8 նոր)

| Ֆайл | Դեր |
| --- | --- |
| `payments.service.ts` | Facade |
| `payment-query.service.ts` | findAll, monthly grouped, findById |
| `payment-write.service.ts` | create, update, process, cancel, delete |
| `payment-summary.service.ts` | Student summary, revenue stats |
| `payment-lifecycle.service.ts` | ensure monthly, overdue sync |
| `payment.util.ts` | Month window / date helpers |
| `payment.types.ts` | Shared Prisma payload types |
| `payment-db.util.ts` | Prisma delegate accessor |
| `payment-include.util.ts` | Student include fragments |

### 15. `apps/api/src/modules/settings/settings.service.ts` (738 → 74)

**8 ֆайլ** (1 facade + 7 նոր)

| Ֆайл | Դեր |
| --- | --- |
| `settings.service.ts` | Facade |
| `settings-core.service.ts` | getSystemSettings + cache |
| `settings-branding.service.ts` | Logo + dashboard banner |
| `settings-footer.service.ts` | Footer icon links |
| `settings-percents.service.ts` | Action percents |
| `settings-penalties.service.ts` | Penalty amounts |
| `settings.util.ts` | URL key extract, text normalize |
| `settings.types.ts` | Shared types + cache key |

### 16. `apps/api/src/modules/users/users.service.ts` (729 → 77)

**5 ֆайլ** (1 facade + 4 նոր)

| Ֆайл | Դեր |
| --- | --- |
| `users.service.ts` | Facade |
| `user-read.service.ts` | findById, findAll, findManagers, auth lookups |
| `user-manager.service.ts` | createManager, updateManager |
| `user-write.service.ts` | update, updatePassword, updateLastLogin |
| `user.util.ts` | Cache keys, DB error check, invalidate |

### 17. `apps/api/src/modules/teachers/teacher-crud.service.ts` (715 → 45)

**7 ֆайլ** (1 facade + 6 նոր)

| Ֆайл | Դեր |
| --- | --- |
| `teacher-crud.service.ts` | Facade |
| `teacher-list.service.ts` | findAll with obligations/stats |
| `teacher-read.service.ts` | findById, findByUserId |
| `teacher-write.service.ts` | create, update, delete, deleteMany |
| `teacher-access.service.ts` | Manager scope checks |
| `teacher.util.ts` | Hire date from experience |
| `teacher-crud.constants.ts` | Deduction / experience constants |

### 18. `apps/api/src/modules/search/search.service.ts` (623 → 60)

**4 ֆайլ** (1 facade + 3 նոր)

| Ֆайл | Դեր |
| --- | --- |
| `search.service.ts` | Facade + globalSearch orchestration |
| `search-staff.service.ts` | Admin/manager entity search |
| `search-role-query.service.ts` | Teacher/student portal search |
| `search-filter.util.ts` | Prisma where builders + limits |

### 19. `apps/web/src/features/groups/components/EditGroupForm.tsx` (709 → 175)

**6 ֆայլ** (1 orchestrator + 5 նոր, `edit-group-form/`)

| Ֆայլ | Դեր |
| --- | --- |
| `EditGroupForm.tsx` | Sheet shell + loading state orchestrator |
| `edit-group-form/useEditGroupForm.ts` | Form state, validation, submit, drag-to-close |
| `edit-group-form/EditGroupFormFields.tsx` | Form fields JSX |
| `edit-group-form/EditGroupFormRegenerateDialog.tsx` | Replace-lessons confirm dialog |
| `edit-group-form/edit-group-form.types.ts` | Props + form data types |
| `edit-group-form/edit-group-form.constants.ts` | Schedule error translation, shared classes |

### 20. `apps/web/src/features/students/components/EditStudentForm.tsx` (701 → 88)

**5 ֆայլ** (1 orchestrator + 4 նոր, `edit-student-form/`)

| Ֆայլ | Դեր |
| --- | --- |
| `EditStudentForm.tsx` | Sheet shell orchestrator |
| `edit-student-form/useEditStudentForm.ts` | Form state, validation, submit, drag-to-close |
| `edit-student-form/EditStudentFormFields.tsx` | Form fields JSX |
| `edit-student-form/edit-student-form.types.ts` | Props + form data types |
| `edit-student-form/edit-student-form.constants.ts` | Shared textarea class |

### 21. `apps/web/src/features/students/components/StudentDetailsModal.tsx` (695 → 236)

**6 ֆայլ** (1 orchestrator + 5 նոր, `student-details-modal/`)

| Ֆայլ | Դեր |
| --- | --- |
| `StudentDetailsModal.tsx` | Lightbox + sheet shell + header actions |
| `student-details-modal/useStudentDetailsModal.ts` | Data fetch, drag-to-close, actions menu state |
| `student-details-modal/StudentDetailsModalBody.tsx` | Scrollable profile / enrollment / stats content |
| `student-details-modal/StudentDetailsModalStatCard.tsx` | Attendance / payments stat card |
| `student-details-modal/student-details-modal.types.ts` | Modal props |
| `student-details-modal/student-details-modal.util.ts` | Date + lifecycle formatters |

### 22. `apps/web/src/features/chat/hooks/useChat.ts` (632 → 53)

**10 ֆայլ** (1 facade + 9 նոր, `chat/`)

| Ֆայլ | Դեր |
| --- | --- |
| `useChat.ts` | Facade re-exports |
| `chat/chat-query-keys.ts` | React Query key factory |
| `chat/chat-cache.util.ts` | Optimistic messages + cache read/write helpers |
| `chat/useChatQueries.ts` | useChats, useChatDetail, useMessages, useCustomGroupChats |
| `chat/useChatMutations.ts` | Direct/group chat create + member mutations |
| `chat/useChatCacheHooks.ts` | Cache update hooks (add/update/remove/unread) |
| `chat/useAdminChatQueries.ts` | Admin list queries |
| `chat/useTeacherChatQueries.ts` | Teacher list queries |
| `chat/useStudentChatQueries.ts` | Student admin query |
| `chat/useChatUnreadCounts.ts` | Admin/teacher/student sidebar badge counts |

### 23. `apps/web/src/features/chat/components/TeacherChatList.tsx` (630 → 79)

**10 ֆայլ** (1 orchestrator + 9 նոր, `teacher-chat-list/`)

| Ֆայլ | Դեր |
| --- | --- |
| `TeacherChatList.tsx` | Sticky header + tab content orchestrator |
| `teacher-chat-list/useTeacherChatList.ts` | Data fetch, sort, click handlers |
| `teacher-chat-list/TeacherChatListTabBar.tsx` | Groups/students/admin tabs + badges |
| `teacher-chat-list/TeacherChatListSearch.tsx` | Tab-aware search input |
| `teacher-chat-list/TeacherChatListAdminItem.tsx` | Admin direct chat row |
| `teacher-chat-list/TeacherChatListGroupItems.tsx` | Custom + class group rows |
| `teacher-chat-list/TeacherChatListStudentItems.tsx` | Student DM rows |
| `teacher-chat-list/TeacherChatListLoadingSkeleton.tsx` | Loading placeholder |
| `teacher-chat-list/TeacherChatListEmptyState.tsx` | Empty / no-results state |
| `teacher-chat-list/teacher-chat-list.types.ts` | Props + view-model types |

### 24. `apps/web/src/shared/components/ui/date-picker-input.tsx` (695 → 83)

**8 ֆայլ** (1 orchestrator + 7 նոր, `date-picker-input/`)

| Ֆայլ | Դեր |
| --- | --- |
| `date-picker-input.tsx` | Portal shell + hidden ISO input orchestrator |
| `date-picker-input/date-picker-input.constants.ts` | Weekdays, layout/z-index constants |
| `date-picker-input/date-picker-input.types.ts` | Props + view-model types |
| `date-picker-input/date-picker-input.util.ts` | Parse, calendar grid, year bounds helpers |
| `date-picker-input/date-picker-popover-position.util.ts` | Popover placement (dialog portal + fixed) |
| `date-picker-input/useDatePickerInput.ts` | State, masking, open/close, cache of position |
| `date-picker-input/DatePickerCalendarPopover.tsx` | Month grid, year dropdown, clear/today |
| `date-picker-input/DatePickerInputTrigger.tsx` | Visible text input + calendar button |

### 25. `apps/web/src/features/groups/components/CreateGroupForm.tsx` (656 → 82)

**4 ֆայլ** (1 orchestrator + 3 նոր, `create-group-form/`)

| Ֆայլ | Դեր |
| --- | --- |
| `CreateGroupForm.tsx` | Sheet shell orchestrator |
| `create-group-form/useCreateGroupForm.ts` | Form state, validation, submit, drag-to-close |
| `create-group-form/CreateGroupFormFields.tsx` | Form fields JSX |
| `create-group-form/create-group-form.types.ts` | Props + form data types |

### 26. `apps/web/src/features/crm/components/EditLeadModal.tsx` (637 → 95)

**5 ֆայլ** (1 orchestrator + 4 նոր, `edit-lead-modal/`)

| Ֆայլ | Դեր |
| --- | --- |
| `EditLeadModal.tsx` | Sheet shell + header actions orchestrator |
| `edit-lead-modal/useEditLeadModal.ts` | Form state, fetch, submit, paid registration flow |
| `edit-lead-modal/EditLeadModalFormBody.tsx` | Voice, basic/academic/parent/status form sections |
| `edit-lead-modal/edit-lead-modal.types.ts` | Props + form state types |
| `edit-lead-modal/edit-lead-modal.constants.ts` | Level options + field class |

### 27. `apps/api/src/modules/settings/settings.controller.ts` (659 → split)

**6 ֆайլ** (monolith removed; 4 domain controllers + 2 shared utils)

| Ֆայլ | Դեր |
| --- | --- |
| `settings-logo.controller.ts` | Logo get/serve/upload/delete |
| `settings-dashboard-banner.controller.ts` | Banner get/serve/upload/delete/text |
| `settings-footer.controller.ts` | Footer icon links get/update |
| `settings-penalties.controller.ts` | Action percents + penalty amounts |
| `settings-controller.constants.ts` | Upload size/MIME limits |
| `settings-image.util.ts` | Cache buster, content-type, image response helpers |

### 28. `apps/api/src/modules/finance/salary-record.service.ts` (664 → 47)

**7 ֆайլ** (1 facade + 6 նոր)

| Ֆայլ | Դեր |
| --- | --- |
| `salary-record.service.ts` | Facade delegating to list/read/write |
| `salary-record-list.service.ts` | findAll, findAllRecordsByTeacher |
| `salary-record-read.service.ts` | findById + action breakdown |
| `salary-record-write.service.ts` | create, process, update, delete |
| `salary-record.types.ts` | Prisma delegate + query param types |
| `salary-record-db.util.ts` | DB accessor + include fragments |
| `salary-record.util.ts` | Enrichment, substitute count, action breakdown helpers |

### 29. `apps/web/src/features/settings/components/EditManagerForm.tsx` (636 → 175)

**4 ֆայլ** (1 orchestrator + 3 նոր, `edit-manager-form/`)

| Ֆայլ | Դեր |
| --- | --- |
| `EditManagerForm.tsx` | Sheet shell + active/inactive form orchestrator |
| `edit-manager-form/useEditManagerForm.ts` | Dual forms, center logic, submit, drag-to-close |
| `edit-manager-form/EditManagerFormFields.tsx` | Profile, center, status field components |
| `edit-manager-form/edit-manager-form.types.ts` | Schemas + props types |

### 30. `apps/web/src/shared/components/calendar/FeedbacksTab.tsx` (626 → 55)

**7 ֆայլ** (1 orchestrator + 6 նոր, `feedbacks-tab/`)

| Ֆайл | Դեր |
| --- | --- |
| `FeedbacksTab.tsx` | Orchestrator + loading/not-found routing |
| `feedbacks-tab/useFeedbacksTab.ts` | Data fetch, structured state, save/submit |
| `feedbacks-tab/FeedbacksTabStudentCard.tsx` | Per-student feedback form UI |
| `feedbacks-tab/FeedbacksTabStates.tsx` | Loading, lesson not found, empty students |
| `feedbacks-tab/FeedbacksTabParticipationTickBox.tsx` | Participation/skills tick checkbox |
| `feedbacks-tab/feedbacks-tab.types.ts` | Props, student item, save status, field shell class |

### 31. `apps/api/src/modules/prisma/prisma.service.ts` (646 → 232)

**5 ֆայլ** (1 core service + 4 նոր)

| Ֆайл | Դեր |
| --- | --- |
| `prisma.service.ts` | Lifecycle, health check, reconnect, prismaWithRetry |
| `prisma-connection.util.ts` | Transient error detection, withRetry, error code extraction |
| `prisma-retry.middleware.ts` | Prisma $use retry middleware registration |
| `prisma-planned-absences.util.ts` | Idempotent planned_absences table bootstrap |
| `prisma.types.ts` | ConnectionError, ErrLike, RetryContext |

### 32. `apps/api/src/modules/analytics/analytics.service.ts` (552 → 41)

**10 ֆայլ** (1 facade + 9 նոր)

| Ֆայլ | Դեր |
| --- | --- |
| `analytics.service.ts` | Facade |
| `analytics-teacher.service.ts` | Teacher performance metrics |
| `analytics-student-risk.service.ts` | Student risk analytics |
| `analytics-revenue.service.ts` | Revenue by range / month series |
| `analytics-attendance.service.ts` | Attendance overview |
| `analytics-lessons.service.ts` | Lessons overview |
| `analytics-dashboard.service.ts` | Admin dashboard summary |
| `analytics.util.ts` | Date window helpers |
| `analytics.types.ts` | Revenue series + row types |

### 33. `apps/api/src/modules/finance/finance.controller.ts` (551 → split)

**8 ֆայլ** (monolith removed; 6 domain controllers + scope service)

| Ֆայլ | Դեր |
| --- | --- |
| `finance-teacher.controller.ts` | Teacher my-salary / my-deductions |
| `finance-student.controller.ts` | Student my-payments |
| `finance-dashboard.controller.ts` | Dashboard, report, automation |
| `finance-payments.controller.ts` | Payments CRUD + stats |
| `finance-salaries.controller.ts` | Salaries CRUD + breakdown |
| `finance-deductions.controller.ts` | Deductions CRUD + stats |
| `finance-controller-scope.service.ts` | Student lookup, manager scope, salary record bootstrap |

### 34. `apps/web/src/features/centers/components/EditCenterForm.tsx` (541 → 151)

**5 ֆայլ** (1 orchestrator + 4 նոր, `edit-center-form/`)

| Ֆայլ | Դեր |
| --- | --- |
| `EditCenterForm.tsx` | Sheet shell + header actions orchestrator |
| `edit-center-form/useEditCenterForm.ts` | Form state, validation, submit, drag-to-close |
| `edit-center-form/EditCenterFormFields.tsx` | Address, contact, color, description fields |
| `edit-center-form/edit-center-form.types.ts` | Props + form data types |
| `edit-center-form/edit-center-form.constants.ts` | Textarea class + sheet grid rows |

### 35. `apps/web/src/features/centers/components/CenterDetailsModal.tsx` (537 → 82)

**8 ֆայլ** (1 orchestrator + 7 նոր, `center-details-modal/`)

| Ֆայլ | Դեր |
| --- | --- |
| `CenterDetailsModal.tsx` | Sheet shell + tab routing orchestrator |
| `center-details-modal/useCenterDetailsModal.ts` | Data fetch, drag-to-close, active tab state |
| `center-details-modal/CenterDetailsModalHeader.tsx` | Center name, color, address header |
| `center-details-modal/CenterDetailsModalTabBar.tsx` | Teachers/students/groups/schedule/info tabs |
| `center-details-modal/CenterDetailsModalTabContent.tsx` | Tab panel lists + info + schedule grid |
| `center-details-modal/center-details-modal.util.ts` | Schedule normalize + group mapping helpers |
| `center-details-modal/center-details-modal.types.ts` | Props + tab id types |
| `center-details-modal/center-details-modal.constants.ts` | Tab config with icons |

### 36. `apps/web/src/features/crm/components/VoiceLeadDetailModal.tsx` (534 → 79)

**8 ֆայլ** (1 orchestrator + 7 նոր, `voice-lead-detail-modal/`)

| Ֆայլ | Դեր |
| --- | --- |
| `VoiceLeadDetailModal.tsx` | Modal shell + loading/error routing orchestrator |
| `voice-lead-detail-modal/useVoiceLeadDetailModal.ts` | Lead fetch, form state, save/delete handlers |
| `voice-lead-detail-modal/VoiceLeadDetailModalHeader.tsx` | Title + delete/close actions |
| `voice-lead-detail-modal/VoiceLeadDetailModalVoiceSection.tsx` | Playback + admin recorder |
| `voice-lead-detail-modal/VoiceLeadDetailModalFormBody.tsx` | NEW-status lead form fields |
| `voice-lead-detail-modal/VoiceLeadDetailModalStatusPanels.tsx` | Approved, transfer, activity panels |
| `voice-lead-detail-modal/voice-lead-detail-modal.util.ts` | Phone validation + form mapping |
| `voice-lead-detail-modal/voice-lead-detail-modal.types.ts` | Props + option types |

### 37. `apps/web/src/features/lessons/components/AddLessonForm.tsx` (521 → 74)

**6 ֆայլ** (1 orchestrator + 5 նոր, `add-lesson-form/`)

| Ֆայլ | Դեր |
| --- | --- |
| `AddLessonForm.tsx` | Sheet shell orchestrator |
| `add-lesson-form/useAddLessonForm.ts` | Form state, schedule, recurring submit, drag-to-close |
| `add-lesson-form/AddLessonFormFields.tsx` | Group/teacher pickers, calendar section, actions |
| `add-lesson-form/GroupTeacherReadonlyRow.tsx` | Read-only teacher display row |
| `add-lesson-form/add-lesson-form.util.ts` | Schema, slot grouping, schedule validation |
| `add-lesson-form/add-lesson-form.types.ts` | Props + form data types |

### 38. `apps/web/src/features/teachers/components/AddTeacherForm.tsx` (515 → 74)

**5 ֆայլ** (1 orchestrator + 4 նոր, `add-teacher-form/`)

| Ֆայլ | Դեր |
| --- | --- |
| `AddTeacherForm.tsx` | Sheet shell orchestrator |
| `add-teacher-form/useAddTeacherForm.ts` | Form state, validation, submit, drag-to-close |
| `add-teacher-form/AddTeacherFormFields.tsx` | Basic, account, professional, centers sections |
| `add-teacher-form/add-teacher-form.types.ts` | Props + form data types |
| `add-teacher-form/add-teacher-form.constants.ts` | Section heading + center chip classes |

### 39. `apps/web/src/shared/lib/api-client.ts` (511 → 4 re-export)

**6 ֆայլ** (1 re-export + 5 նոր, `api-client/`)

| Ֆայլ | Դեր |
| --- | --- |
| `api-client.ts` | Re-exports `ApiClient` |
| `api-client/api-client.ts` | Core HTTP client + request pipeline |
| `api-client/api-client-refresh.ts` | Token refresh coordinator + request queue |
| `api-client/api-client-token.util.ts` | Token resolution + error message normalization |
| `api-client/api-client.util.ts` | Request id, callsite hint, backoff |
| `api-client/api-client.types.ts` | Fetch options + callback types |

### 40. `apps/web/src/features/students/components/StudentAccountFormFieldsCrmLeadLayout.tsx` (506 → 65)

**8 ֆայլ** (1 orchestrator + 7 նոր, `student-account-crm-layout/`)

| Ֆայլ | Դեր |
| --- | --- |
| `StudentAccountFormFieldsCrmLeadLayout.tsx` | Section composition orchestrator |
| `student-account-crm-layout/useStudentAccountCrmLayoutFields.ts` | Derived options, age, center/group state |
| `student-account-crm-layout/StudentAccountCrmIdentitySections.tsx` | Basic info + account fields |
| `student-account-crm-layout/StudentAccountCrmProfileSections.tsx` | DOB/age, parent section |
| `student-account-crm-layout/StudentAccountCrmEnrollmentSection.tsx` | Level, center, group pickers |
| `student-account-crm-layout/StudentAccountCrmBillingSection.tsx` | Fee, notes, reports checkbox |
| `student-account-crm-layout/student-account-crm-layout.types.ts` | Props types |
| `student-account-crm-layout/student-account-crm-layout.constants.ts` | Section classes + field id helper |

### 41. `apps/web/src/features/chat/components/AdminChatList.tsx` (494 → 101)

**9 ֆայլ** (1 orchestrator + 7 նոր, `admin-chat-list/`; loading skeleton reused from `teacher-chat-list/`)

| Ֆայլ | Դեր |
| --- | --- |
| `AdminChatList.tsx` | Tab routing + category empty state orchestrator |
| `admin-chat-list/useAdminChatList.ts` | Data fetch, sort, unread/online helpers, select handlers |
| `admin-chat-list/AdminChatListTabBar.tsx` | Groups/teachers/students tabs + badges |
| `admin-chat-list/AdminChatListSearch.tsx` | Tab-aware search input |
| `admin-chat-list/AdminChatListStudentItems.tsx` | Student DM rows |
| `admin-chat-list/AdminChatListTeacherItems.tsx` | Teacher DM rows |
| `admin-chat-list/AdminChatListGroupItems.tsx` | Custom + class group rows |
| `admin-chat-list/AdminChatListEmptyState.tsx` | Tab-specific empty state |
| `admin-chat-list/admin-chat-list.types.ts` | Props + view-model types |

### 42. `apps/web/src/shared/components/ui/single-select-dropdown.tsx` (492 → 84)

**7 ֆայլ** (1 orchestrator + 5 նոր, `single-select-dropdown/`)

| Ֆայլ | Դեր |
| --- | --- |
| `single-select-dropdown.tsx` | Shell + re-exports orchestrator |
| `single-select-dropdown/useSingleSelectDropdown.ts` | Open state, keyboard nav, filtering, positioning |
| `single-select-dropdown/SingleSelectDropdownTrigger.tsx` | Label + trigger button |
| `single-select-dropdown/SingleSelectDropdownMenu.tsx` | Portaled listbox, search, options |
| `single-select-dropdown/single-select-dropdown-position.util.ts` | Portal target + menu placement |
| `single-select-dropdown/single-select-dropdown.types.ts` | Props + menu position types |
| `single-select-dropdown/single-select-dropdown.constants.ts` | Data attributes + mobile portal breakpoint |

### 43. `apps/web/src/features/daily-plan/DailyPlanEditor.tsx` (487 → 74)

**9 ֆայլ** (1 orchestrator + 7 նոր, `daily-plan-editor/`)

| Ֆայլ | Դեր |
| --- | --- |
| `DailyPlanEditor.tsx` | Sheet shell + header orchestrator |
| `daily-plan-editor/useDailyPlanEditor.ts` | Form state, mutations, topic/resource handlers |
| `daily-plan-editor/DailyPlanEditorFormBody.tsx` | Date/group pickers, topics list, actions |
| `daily-plan-editor/DailyPlanEditorTopicSection.tsx` | Single topic + resource grid |
| `daily-plan-editor/DailyPlanAutoResizeTextarea.tsx` | Session-persisted description textarea |
| `daily-plan-editor/daily-plan-editor.util.ts` | emptyTopic + toDrafts mappers |
| `daily-plan-editor/daily-plan-editor.types.ts` | Props + draft types |
| `daily-plan-editor/daily-plan-editor.constants.ts` | Resource kind list |
| `daily-plan-editor/daily-plan-editor.styles.ts` | Shared textarea class |

### 44. `apps/web/src/features/chat/components/ChatContainer.tsx` (520 → 77)

**8 ֆայլ** (1 orchestrator + 7 նոր, `chat-container/`)

| Ֆայլ | Դեր |
| --- | --- |
| `ChatContainer.tsx` | Hydration shell + layout orchestrator |
| `chat-container/useChatContainer.ts` | URL sync, selection, mobile panel, account key |
| `chat-container/ChatContainerHeader.tsx` | Back navigation + title bar |
| `chat-container/ChatContainerListPane.tsx` | Role-aware chat list sidebar |
| `chat-container/ChatContainerDesktopPane.tsx` | Desktop window or empty state |
| `chat-container/ChatContainerLoadingShell.tsx` | Pre-hydration loading spinner |
| `chat-container/chat-container.util.ts` | Layout calc + safe returnTo path |
| `chat-container/chat-container.types.ts` | Props + view-model types |

### 45. `apps/web/src/features/schedule/ScheduleLessonViews.tsx` (505 → 7 re-export)

**10 ֆայլ** (1 re-export + 9 նոր, `schedule-lesson-views/`)

| Ֆայլ | Դեր |
| --- | --- |
| `ScheduleLessonViews.tsx` | Re-exports week/month grids |
| `schedule-lesson-views/WeekLessonGrid.tsx` | Week view orchestrator |
| `schedule-lesson-views/MonthLessonGrid.tsx` | Month calendar wrapper |
| `schedule-lesson-views/WeekLessonGridMobileDayView.tsx` | Mobile day picker + timeline |
| `schedule-lesson-views/WeekLessonGridDesktopTable.tsx` | Desktop time-grid table |
| `schedule-lesson-views/ScheduleLessonCard.tsx` | Shared lesson card |
| `schedule-lesson-views/useWeekLessonGrid.ts` | Slot grouping + day selection hook |
| `schedule-lesson-views/schedule-lesson-views.util.ts` | Time format, bounds, card tone |
| `schedule-lesson-views/schedule-lesson-views.constants.ts` | Schedule hours + card classes |
| `schedule-lesson-views/schedule-lesson-views.types.ts` | Props + variant types |

### 46. `apps/web/src/features/chat/components/VoiceMessagePlayer.tsx` (508 → 20)

**7 ֆայլ** (1 orchestrator + 6 նոր, `voice-message-player/`)

| Ֆայլ | Դեր |
| --- | --- |
| `VoiceMessagePlayer.tsx` | Error vs controls routing orchestrator |
| `voice-message-player/useVoiceMessagePlayer.ts` | Audio lifecycle, scrubbing, speed hook |
| `voice-message-player/VoiceMessagePlayerControls.tsx` | Play/pause, progress bar, speed, duration |
| `voice-message-player/VoiceMessagePlayerErrorState.tsx` | Error UI + retry |
| `voice-message-player/voice-message-player.util.ts` | Storage, active audio singleton, duration helpers |
| `voice-message-player/voice-message-player.constants.ts` | Speed options + storage keys |
| `voice-message-player/voice-message-player.types.ts` | Props + playback speed type |

### 47. `apps/api/src/modules/feedback/feedback.service.ts` (465 → 37)

**5 ֆայլ** (1 facade + 4 նոր)

| Ֆайл | Դեր |
| --- | --- |
| `feedback.service.ts` | Facade |
| `feedback-query.service.ts` | getByLesson, getByStudent |
| `feedback-write.service.ts` | createOrUpdate, update, delete |
| `feedback-completion.service.ts` | feedbacksCompleted sync + salary recalc |
| `feedback.util.ts` | buildStructuredFields |

### 48. `apps/web/src/features/chat/components/VoiceRecorder.tsx` (464 → 9)

**5 ֆайլ** (1 orchestrator + 4 նոր, `voice-recorder/`)

| Ֆайл | Դեր |
| --- | --- |
| `VoiceRecorder.tsx` | Orchestrator |
| `voice-recorder/useVoiceRecorder.ts` | MediaRecorder lifecycle hook |
| `voice-recorder/VoiceRecorderControls.tsx` | Recording UI |
| `voice-recorder/voice-recorder.util.ts` | Mime, duration, silence helpers |
| `voice-recorder/voice-recorder.types.ts` + `.constants.ts` | Props + limits |

### 49. `apps/web/src/features/crm/components/LeadDrawer.tsx` (462 → 64)

**8 ֆայլ** (1 orchestrator + 7 նոր, `lead-drawer/`; status panels reused from `voice-lead-detail-modal/`)

| Ֆайл | Դեր |
| --- | --- |
| `LeadDrawer.tsx` | Sheet orchestrator |
| `lead-drawer/useLeadDrawer.ts` | Fetch, form state, save/comment handlers |
| `lead-drawer/LeadDrawerHeader.tsx` | Title + close |
| `lead-drawer/LeadDrawerVoiceSection.tsx` | Playback + admin recorder |
| `lead-drawer/LeadDrawerFormBody.tsx` | Non-voice lead fields |
| `lead-drawer/lead-drawer.types.ts` | Props + view-model |
| `lead-drawer/lead-drawer.util.ts` | Payload builder + voice check |
| `lead-drawer/lead-drawer.constants.ts` | Level options |

### 50. `apps/web/src/features/chat/components/AdminChatContainer.tsx` (449 → 68)

**8 ֆայլ** (1 orchestrator + 7 նոր, `admin-chat-container/`)

| Ֆайл | Դեր |
| --- | --- |
| `AdminChatContainer.tsx` | Hydration shell + layout orchestrator |
| `admin-chat-container/useAdminChatContainer.ts` | URL sync, tabs, selection, mobile panel |
| `admin-chat-container/AdminChatContainerHeader.tsx` | Back + create group chat |
| `admin-chat-container/AdminChatContainerListPane.tsx` | AdminChatList sidebar |
| `admin-chat-container/AdminChatContainerDesktopPane.tsx` | ChatWindow / empty state |
| `admin-chat-container/AdminChatContainerLoadingShell.tsx` | Pre-hydration spinner |
| `admin-chat-container/admin-chat-container.util.ts` | Layout + returnTo helpers |
| `admin-chat-container/admin-chat-container.types.ts` | Props + view-model |

### 51. `apps/web/src/features/finance/components/SalaryBreakdownModal.tsx` (447 → 2 re-export)

**9 ֆայլ** (1 re-export + 8 նոր, `salary-breakdown-modal/`)

| Ֆайл | Դեր |
| --- | --- |
| `SalaryBreakdownModal.tsx` | Re-export |
| `salary-breakdown-modal/SalaryBreakdownModal.tsx` | Orchestrator |
| `salary-breakdown-modal/SalaryBreakdownModalView.tsx` | Dialog + modals shell |
| `salary-breakdown-modal/useSalaryBreakdownModal.ts` | State, handlers, columns |
| `salary-breakdown-modal/SalaryBreakdownTableColumns.tsx` | DataTable column defs |
| `salary-breakdown-modal/SalaryBreakdownTotalsRow.tsx` | Footer totals |
| `salary-breakdown-modal/SelectAllCheckbox.tsx` | Header checkbox |
| `salary-breakdown-modal/salary-breakdown-modal.util.ts` | Format/sort helpers |
| `salary-breakdown-modal/salary-breakdown-modal.types.ts` | Props + column types |

### 52. `apps/web/src/features/students/components/StudentAccountFormFields.tsx` (443 → 70)

**8 ֆայլ** (1 orchestrator + 7 նոր, `student-account-form-fields/`)

| Ֆайл | Դեր |
| --- | --- |
| `StudentAccountFormFields.tsx` | Section composition orchestrator |
| `student-account-form-fields/useStudentAccountFormFields.ts` | Derived options + age state |
| `student-account-form-fields/StudentAccountFormFieldsIdentitySection.tsx` | Name, email, password, phone |
| `student-account-form-fields/StudentAccountFormFieldsEnrollmentSection.tsx` | DOB, level, teacher, group, center |
| `student-account-form-fields/StudentAccountFormFieldsParentSection.tsx` | Parent fields |
| `student-account-form-fields/StudentAccountFormFieldsBillingSection.tsx` | Fee, notes, reports |
| `student-account-form-fields/student-account-form-fields.types.ts` | Props + option types |
| `student-account-form-fields/student-account-form-fields.constants.ts` | Level options + classes |

### 53. `apps/web/src/features/groups/components/GroupCard.tsx` (433 → 17)

**10 ֆայլ** (1 orchestrator + 9 նոր, `group-card/`)

| Ֆайл | Դեր |
| --- | --- |
| `GroupCard.tsx` | Mobile/desktop routing orchestrator |
| `group-card/useGroupCard.ts` | Derived display values |
| `group-card/GroupCardMobile.tsx` | Mobile card layout |
| `group-card/GroupCardDesktop.tsx` | Desktop card layout |
| `group-card/GroupCardStudentList.tsx` | Student rows |
| `group-card/GroupCardScheduleSlots.tsx` | Schedule pills |
| `group-card/GroupCardOverflowMenu.tsx` | Action menu (re-exported) |
| `group-card/group-card.util.ts` | Schedule summary + occupancy dot |
| `group-card/group-card.types.ts` | Props types |
| `group-card/group-card.constants.ts` | Day labels + layout limits |

### 54. `apps/web/src/features/teachers/components/EditTeacherForm.tsx` (428 → 95)

**5 ֆայլ** (1 orchestrator + 4 նոր, `edit-teacher-form/`)

| Ֆайл | Դեր |
| --- | --- |
| `EditTeacherForm.tsx` | Sheet shell + header actions |
| `edit-teacher-form/useEditTeacherForm.ts` | Form state, validation, submit |
| `edit-teacher-form/EditTeacherFormFields.tsx` | Form sections JSX |
| `edit-teacher-form/edit-teacher-form.types.ts` | Props + form data |
| `edit-teacher-form/edit-teacher-form.constants.ts` | Shared classes |

### 55. `apps/web/src/features/students/components/AddStudentForm.tsx` (412 → 74)

**5 ֆայլ** (1 orchestrator + 4 նոր, `add-student-form/`)

| Ֆайл | Դեր |
| --- | --- |
| `AddStudentForm.tsx` | Sheet shell orchestrator |
| `add-student-form/useAddStudentForm.ts` | Form state, defaults, submit, drag-to-close |
| `add-student-form/AddStudentFormFields.tsx` | Wraps CRM layout fields |
| `add-student-form/add-student-form.types.ts` | Props |
| `add-student-form/add-student-form.constants.ts` | Default values helper |

### 56. `apps/api/src/modules/storage/storage.service.ts` (412 → 55)

**8 ֆայլ** (1 facade + 7 նոր)

| Ֆайл | Դեր |
| --- | --- |
| `storage.service.ts` | Facade |
| `storage-upload.service.ts` | upload, presigned upload, avatar/chat/document |
| `storage-read.service.ts` | getFile, exists, presigned download |
| `storage-delete.service.ts` | delete |
| `storage-client.util.ts` | S3 config + public URL |
| `storage-local.util.ts` | Local path bootstrap |
| `storage.types.ts` | UploadResult, PresignedUrlResult |

### 57. `apps/web/src/features/chat/api/chat.api.ts` (404 → 47 re-export)

**7 ֆայլ** (1 re-export + 6 նոր, `chat-api/`)

| Ֆайл | Դեր |
| --- | --- |
| `chat.api.ts` | Re-exports all endpoints |
| `chat-api/chat-core.api.ts` | Chats, messages, group chat |
| `chat-api/chat-admin.api.ts` | Admin lists, members, recordings |
| `chat-api/chat-teacher.api.ts` | Teacher lists + recordings |
| `chat-api/chat-student.api.ts` | Student admin + voice recordings |
| `chat-api/chat-api.types.ts` | Shared API types |
| `chat-api/chat-api.constants.ts` | CHAT_ENDPOINT |

### 58. `apps/web/src/features/centers/components/CreateCenterForm.tsx` (401 → 76)

**4 ֆայլ** (1 orchestrator + 3 նոր, `create-center-form/`)

| Ֆайլ | Դեր |
| --- | --- |
| `CreateCenterForm.tsx` | Sheet shell orchestrator |
| `create-center-form/useCreateCenterForm.ts` | Form state, validation, submit |
| `create-center-form/CreateCenterFormFields.tsx` | Address, contact, color fields |
| `create-center-form/create-center-form.types.ts` | Props + form data |

### 59. `apps/web/src/shared/components/attendance/lesson-attendance/useAttendanceGrid.ts` (466 → 330)

**4 ֆайլ** (follow-up from `AttendanceGrid` split)

| Ֆайл | Դեր |
| --- | --- |
| `useAttendanceGrid.ts` | Core state + cell toggling hook |
| `useAttendanceGridSave.ts` | Manual/save-all handlers |
| `useAttendanceGridKeyboard.ts` | Grid keyboard navigation |
| `use-attendance-grid.util.ts` | Types + pending-change merge helpers |

### 60. `apps/web/src/features/chat/components/CreateGroupChatModal.tsx` (396 → 79)

**7 ֆայլ** (1 orchestrator + 6 նոր, `create-group-chat-modal/`)

| Ֆайл | Դեր |
| --- | --- |
| `CreateGroupChatModal.tsx` | Sheet dialog orchestrator |
| `create-group-chat-modal/useCreateGroupChatModal.ts` | State, drag-to-close, submit, selection |
| `create-group-chat-modal/CreateGroupChatModalFormSection.tsx` | Name + member search |
| `create-group-chat-modal/CreateGroupChatModalMemberList.tsx` | Selectable user rows |
| `create-group-chat-modal/CreateGroupChatModalFooter.tsx` | Cancel/create actions |
| `create-group-chat-modal/create-group-chat-modal.types.ts` | Props + view-model |
| `create-group-chat-modal/create-group-chat-modal.constants.ts` | Sheet class + drag thresholds |

### 61. `apps/web/src/shared/components/attendance/week-attendance/useWeekAttendanceGrid.ts` (394 → 275)

**3 ֆայլ** (follow-up from `WeekAttendanceGrid` split)

| Ֆайл | Դեր |
| --- | --- |
| `useWeekAttendanceGrid.ts` | Core state + cell toggling hook |
| `useWeekAttendanceGridSave.ts` | Day save + save-all handlers |
| `use-week-attendance-grid.util.ts` | Types + pending-change merge helpers |

---

## Summary

| Metric | Value |
| --- | --- |
| Total source files scanned | 836 |
| Files over 400 lines | **0** (was 58) |
| Biggest file (non-generated) | under 400 lines |
| Frontend (`apps/web`) | 0 |
| Backend (`apps/api`) | 0 |

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
| ~~12~~ | ~~`apps/web/src/features/calendar/PortalCalendarPage.tsx`~~ | ~~828~~ | Frontend / Calendar | **Done** | — |
| ~~13~~ | ~~`apps/web/src/shared/components/calendar/LessonListTable.tsx`~~ | ~~792~~ | Frontend / Calendar (shared) | **Done** | — |
| ~~14~~ | ~~`apps/api/src/modules/finance/payments.service.ts`~~ | ~~776~~ | Backend / Finance | **Done** | — |
| ~~15~~ | ~~`apps/api/src/modules/settings/settings.service.ts`~~ | ~~738~~ | Backend / Settings | **Done** | — |
| ~~16~~ | ~~`apps/api/src/modules/users/users.service.ts`~~ | ~~729~~ | Backend / Users | **Done** | — |
| ~~17~~ | ~~`apps/api/src/modules/teachers/teacher-crud.service.ts`~~ | ~~715~~ | Backend / Teachers | **Done** | — |
| ~~18~~ | ~~`apps/web/src/features/groups/components/EditGroupForm.tsx`~~ | ~~709~~ | Frontend / Groups | **Done** | — |
| ~~19~~ | ~~`apps/web/src/features/students/components/EditStudentForm.tsx`~~ | ~~701~~ | Frontend / Students | **Done** | — |
| ~~20~~ | ~~`apps/web/src/features/students/components/StudentDetailsModal.tsx`~~ | ~~695~~ | Frontend / Students | **Done** | — |
| ~~21~~ | ~~`apps/web/src/features/chat/hooks/useChat.ts`~~ | ~~632~~ | Frontend / Chat | **Done** | — |
| ~~22~~ | ~~`apps/web/src/features/chat/components/TeacherChatList.tsx`~~ | ~~630~~ | Frontend / Chat | **Done** | — |
| ~~23~~ | ~~`apps/web/src/shared/components/ui/date-picker-input.tsx`~~ | ~~627~~ | Frontend / Shared UI | **Done** | — |
| ~~24~~ | ~~`apps/api/src/modules/search/search.service.ts`~~ | ~~623~~ | Backend / Search | **Done** | — |
| ~~25~~ | ~~`apps/web/src/features/crm/components/EditLeadModal.tsx`~~ | ~~616~~ | Frontend / CRM | **Done** | — |
| ~~26~~ | ~~`apps/web/src/features/groups/components/CreateGroupForm.tsx`~~ | ~~611~~ | Frontend / Groups | **Done** | — |
| ~~27~~ | ~~`apps/api/src/modules/settings/settings.controller.ts`~~ | ~~607~~ | Backend / Settings | **Done** | — |
| ~~28~~ | ~~`apps/api/src/modules/finance/salary-record.service.ts`~~ | ~~601~~ | Backend / Finance | **Done** | — |
| ~~29~~ | ~~`apps/web/src/features/settings/components/EditManagerForm.tsx`~~ | ~~589~~ | Frontend / Settings | **Done** | — |
| ~~30~~ | ~~`apps/web/src/shared/components/calendar/FeedbacksTab.tsx`~~ | ~~584~~ | Frontend / Calendar (shared) | **Done** | — |
| ~~31~~ | ~~`apps/api/src/modules/prisma/prisma.service.ts`~~ | ~~576~~ | Backend / Infrastructure | **Done** | — |
| ~~32~~ | ~~`apps/api/src/modules/analytics/analytics.service.ts`~~ | ~~552~~ | Backend / Analytics | **Done** | — |
| ~~33~~ | ~~`apps/api/src/modules/finance/finance.controller.ts`~~ | ~~551~~ | Backend / Finance | **Done** | — |
| ~~34~~ | ~~`apps/web/src/features/centers/components/EditCenterForm.tsx`~~ | ~~541~~ | Frontend / Centers | **Done** | — |
| ~~35~~ | ~~`apps/web/src/features/centers/components/CenterDetailsModal.tsx`~~ | ~~537~~ | Frontend / Centers | **Done** | — |
| ~~36~~ | ~~`apps/web/src/features/crm/components/VoiceLeadDetailModal.tsx`~~ | ~~534~~ | Frontend / CRM | **Done** | — |
| ~~37~~ | ~~`apps/web/src/features/lessons/components/AddLessonForm.tsx`~~ | ~~521~~ | Frontend / Lessons | **Done** | — |
| ~~38~~ | ~~`apps/web/src/features/teachers/components/AddTeacherForm.tsx`~~ | ~~515~~ | Frontend / Teachers | **Done** | — |
| ~~39~~ | ~~`apps/web/src/shared/lib/api-client.ts`~~ | ~~511~~ | Frontend / Shared lib | **Done** | — |
| ~~40~~ | ~~`apps/web/src/features/students/components/StudentAccountFormFieldsCrmLeadLayout.tsx`~~ | ~~506~~ | Frontend / Students | **Done** | — |
| ~~41~~ | ~~`apps/web/src/features/chat/components/AdminChatList.tsx`~~ | ~~494~~ | Frontend / Chat | **Done** | — |
| ~~42~~ | ~~`apps/web/src/shared/components/ui/single-select-dropdown.tsx`~~ | ~~492~~ | Frontend / Shared UI | **Done** | — |
| ~~43~~ | ~~`apps/web/src/features/daily-plan/DailyPlanEditor.tsx`~~ | ~~487~~ | Frontend / Daily plan | **Done** | — |
| ~~44~~ | ~~`apps/web/src/features/chat/components/ChatContainer.tsx`~~ | ~~485~~ | Frontend / Chat | **Done** | — |
| ~~45~~ | ~~`apps/web/src/features/schedule/ScheduleLessonViews.tsx`~~ | ~~478~~ | Frontend / Schedule | **Done** | — |
| ~~46~~ | ~~`apps/web/src/features/chat/components/VoiceMessagePlayer.tsx`~~ | ~~465~~ | Frontend / Chat | **Done** | — |
| ~~47~~ | ~~`apps/api/src/modules/feedback/feedback.service.ts`~~ | ~~465~~ | Backend / Feedback | **Done** | — |
| ~~48~~ | ~~`apps/web/src/features/chat/components/VoiceRecorder.tsx`~~ | ~~464~~ | Frontend / Chat | **Done** | — |
| ~~49~~ | ~~`apps/web/src/features/crm/components/LeadDrawer.tsx`~~ | ~~462~~ | Frontend / CRM | **Done** | — |
| ~~50~~ | ~~`apps/web/src/features/chat/components/AdminChatContainer.tsx`~~ | ~~449~~ | Frontend / Chat | **Done** | — |
| ~~51~~ | ~~`apps/web/src/features/finance/components/SalaryBreakdownModal.tsx`~~ | ~~447~~ | Frontend / Finance | **Done** | — |
| ~~52~~ | ~~`apps/web/src/features/students/components/StudentAccountFormFields.tsx`~~ | ~~443~~ | Frontend / Students | **Done** | — |
| ~~53~~ | ~~`apps/web/src/features/groups/components/GroupCard.tsx`~~ | ~~433~~ | Frontend / Groups | **Done** | — |
| ~~54~~ | ~~`apps/web/src/features/teachers/components/EditTeacherForm.tsx`~~ | ~~428~~ | Frontend / Teachers | **Done** | — |
| ~~55~~ | ~~`apps/web/src/features/students/components/AddStudentForm.tsx`~~ | ~~412~~ | Frontend / Students | **Done** | — |
| ~~56~~ | ~~`apps/api/src/modules/storage/storage.service.ts`~~ | ~~412~~ | Backend / Storage | **Done** | — |
| ~~57~~ | ~~`apps/web/src/features/chat/api/chat.api.ts`~~ | ~~404~~ | Frontend / Chat API | **Done** | — |
| ~~58~~ | ~~`apps/web/src/features/centers/components/CreateCenterForm.tsx`~~ | ~~401~~ | Frontend / Centers | **Done** | — |

---

## Recommended first 3 refactors

Backlog complete — all originally flagged files are at or below 400 lines. Re-run this audit after future growth.

### Watch list (largest files, still under 400)

| File | Lines | Note |
| --- | ---: | --- |
| `apps/web/src/features/lessons/components/AddCourseForm.tsx` | ~382 | Next candidate if it grows |
| `apps/api/src/modules/storage/storage.controller.ts` | ~380 | Consider split if endpoints grow |
| `apps/web/src/features/groups/components/edit-group-form/useEditGroupForm.ts` | ~378 | Hook-only; monitor |
| `apps/api/src/modules/users/user-manager.service.ts` | ~379 | Backend service |
| `apps/web/src/features/chat/hooks/useSocket.ts` | ~367 | Chat realtime hook |

---

## Notes for incremental refactors

- Prefer **vertical splits** (by feature/domain) over arbitrary line-count chunks.
- After each split, run `pnpm typecheck` and targeted tests for the touched module.
- Frontend forms (`Edit*Form`, `Create*Form`, `*Modal`) often share sections — extract shared pieces once, then refactor siblings together.
- Backend controllers over 400 lines should become thin; move logic into existing or new services rather than growing controllers further.
- Re-run this audit after refactors to track progress toward the 400-line target.
