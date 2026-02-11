# Calendar Workbench Implementation Plan

This document tracks the implementation of the Calendar Workbench feature for Admin and Teacher panels.

## Overview

The Calendar Workbench is a multi-step feature that allows teachers to complete lesson obligations (absence tracking, feedbacks, voice messages, text messages) and enables admins to view and manage these completions. The feature integrates with existing Attendance Register, Group Chat, and Finance modules.

## R2 Object Storage Requirements

- All voice messages MUST be stored in Cloudflare R2 object storage
- R2 configuration is available in `.env.local` (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL)
- Do NOT print, log, or expose secrets from `.env.local` in code, UI, or console logs
- Upload flow: Teacher records/uploads audio → Backend uploads to R2 → Store metadata in DB → Create chat message referencing stored audio
- Prefer signed URLs if chat content should be private

---

## Task 0 — Audit & Mapping

**Status:** DONE

**Goal:** Document where Calendar/Attendance Register, Group Chat, Finance, and Roles/permissions live in the codebase.

**Scope:**
- Map existing Calendar implementations
- Map Attendance Register components and APIs
- Map Group Chat components and APIs
- Map Finance module structure
- Map Roles and permissions system
- Document file locations and key functions

**Implementation Checklist:**
- [x] Find Calendar pages (Admin and Teacher)
- [x] Find Attendance Register pages and components
- [x] Find Group Chat components and APIs
- [x] Find Finance module structure
- [x] Find Roles/permissions guards and decorators
- [x] Document R2 storage service
- [x] Document Lesson API structure
- [x] Document Feedback API structure

**Definition of Done:**
- All key locations documented in this section
- Clear understanding of reusable components
- API endpoints identified
- Permission patterns understood

**Files to Touch:**
- `docs/CALENDAR_WORKBENCH_PLAN.md` (this file)

**QA Notes:**
- Review this section to ensure all locations are documented
- Verify understanding of existing patterns

**Findings:**

### Calendar Pages
- **Admin Calendar:** `apps/web/src/app/[locale]/(admin)/admin/calendar/page.tsx`
  - Week/month view with lesson blocks
  - Uses `useLessons` hook with date filters
  - Shows lesson statistics
  - Supports lesson cancellation
  
- **Teacher Calendar:** `apps/web/src/app/[locale]/(teacher)/teacher/calendar/page.tsx`
  - Week/month view with lesson blocks
  - Uses `useMyLessons` hook (teacher-specific)
  - Shows only teacher's lessons

### Attendance Register
- **Admin Attendance:** `apps/web/src/app/[locale]/(admin)/admin/attendance-register/page.tsx`
  - Group selection, date range filtering
  - Uses `AttendanceGrid` component
  - Admin can view (read-only in current implementation)
  
- **Teacher Attendance:** `apps/web/src/app/[locale]/(teacher)/teacher/attendance-register/page.tsx`
  - Group selection, date range filtering
  - Uses `AttendanceGrid` component
  - Teacher can edit attendance
  
- **AttendanceGrid Component:** `apps/web/src/shared/components/attendance/AttendanceGrid.tsx`
  - Reusable grid component
  - Handles attendance marking (present/absent_justified/absent_unjustified/not_marked)
  - Supports per-lesson save
  - Keyboard navigation support
  
- **Attendance API:** `apps/api/src/modules/attendance/`
  - Controller: `attendance.controller.ts`
  - Service: `attendance.service.ts`
  - Uses `useMarkBulkAttendance` hook on frontend

### Group Chat
- **Chat Container:** `apps/web/src/features/chat/components/ChatContainer.tsx`
  - Main container for teacher chat
  - Handles chat list and chat window
  
- **Chat Window:** `apps/web/src/features/chat/components/ChatWindow.tsx`
  - Message display and input
  - Supports TEXT, VOICE, IMAGE, VIDEO, FILE, VOCABULARY message types
  - Uses `useSocket` for real-time updates
  - Uses `sendMessageHttp` for HTTP message sending
  
- **Chat API:** `apps/api/src/modules/chat/`
  - Controller: `chat.controller.ts`
  - Service: `chat.service.ts`
  - Message sending endpoint: `POST /api/chat/:chatId/messages`
  - Message types: TEXT, VOICE, IMAGE, VIDEO, FILE, SYSTEM, VOCABULARY
  
- **Chat Hooks:** `apps/web/src/features/chat/hooks/`
  - `useSocket` - WebSocket connection
  - `useChats` - Fetch chats
  - `useCreateDirectChat` - Create direct chat
  - `sendMessageHttp` - Send message via HTTP

### Finance Module
- **Finance API:** `apps/api/src/modules/finance/`
  - Controller: `finance.controller.ts`
  - Services: `finance.service.ts`, `payments.service.ts`, `salaries.service.ts`, `deductions.service.ts`
  - Endpoints for payments, salaries, deductions
  
- **Finance Frontend:** `apps/web/src/features/finance/`
  - Hooks: `useFinanceDashboard`, `usePayments`, `useSalaries`, `useDeductions`
  - Admin Finance Page: `apps/web/src/app/[locale]/(admin)/admin/finance/page.tsx`
  
- **Deduction Reasons:** `DeductionReason` enum in schema
  - MISSING_FEEDBACK
  - MISSING_VOCABULARY
  - LATE_SUBMISSION
  - OTHER

### Roles & Permissions
- **Roles Guard:** `apps/api/src/common/guards/roles.guard.ts`
  - Enforces role-based access control
  - Uses `@Roles()` decorator
  
- **Roles Decorator:** `apps/api/src/common/decorators/roles.decorator.ts`
  - `@Roles(UserRole.ADMIN, UserRole.TEACHER)` syntax
  
- **User Roles:** `UserRole` enum in Prisma schema
  - ADMIN
  - TEACHER
  - STUDENT
  
- **Current User Decorator:** `apps/api/src/common/decorators/current-user.decorator.ts`
  - `@CurrentUser()` to get authenticated user

### Storage (R2)
- **Storage Service:** `apps/api/src/modules/storage/storage.service.ts`
  - `upload()` - Upload file buffer to R2
  - `uploadChatFile()` - Upload chat attachment
  - `getPresignedUploadUrl()` - Generate presigned URL for client upload
  - `getPresignedDownloadUrl()` - Generate signed download URL
  - `delete()` - Delete file from R2
  - Falls back to local storage if R2 not configured
  - Uses folder structure: `chat/`, `avatars/`, `documents/`, `settings/`
  
- **R2 Configuration:** `.env.local`
  - `R2_ACCOUNT_ID`
  - `R2_ACCESS_KEY_ID`
  - `R2_SECRET_ACCESS_KEY`
  - `R2_BUCKET_NAME`
  - `R2_PUBLIC_URL`

### Lessons API
- **Lessons Controller:** `apps/api/src/modules/lessons/lessons.controller.ts`
  - `GET /api/lessons` - List lessons (with filters)
  - `GET /api/lessons/my-lessons` - Teacher's lessons
  - `GET /api/lessons/:id` - Get lesson by ID
  - `POST /api/lessons` - Create lesson (ADMIN only)
  - `PUT /api/lessons/:id` - Update lesson (ADMIN, TEACHER)
  - `DELETE /api/lessons/:id` - Delete lesson (ADMIN only)
  - `PATCH /api/lessons/:id/complete` - Complete lesson
  
- **Lessons Frontend:** `apps/web/src/features/lessons/`
  - Hooks: `useLessons`, `useMyLessons`, `useLessonStatistics`, `useCancelLesson`
  - Types: `Lesson`, `LessonStatus`

### Feedback API
- **Feedback Controller:** `apps/api/src/modules/feedback/feedback.controller.ts`
  - `GET /api/feedback/lesson/:lessonId` - Get feedbacks for lesson
  - `GET /api/feedback/student/:studentId` - Get feedbacks for student
  - `POST /api/feedback` - Create or update feedback (ADMIN, TEACHER)
  - `PUT /api/feedback/:id` - Update feedback (ADMIN, TEACHER)
  - `DELETE /api/feedback/:id` - Delete feedback (ADMIN, TEACHER)
  
- **Feedback Model:** Prisma schema
  - Fields: `lessonId`, `studentId`, `teacherId`, `content`, `rating`, `strengths`, `improvements`
  - Unique constraint: `[lessonId, studentId]` (one feedback per student per lesson)

### Database Schema (Key Models)
- **Lesson:** `id`, `groupId`, `teacherId`, `scheduledAt`, `duration`, `topic`, `status`, `vocabularySent`, `feedbacksCompleted`, `completedAt`
- **Attendance:** `id`, `lessonId`, `studentId`, `isPresent`, `absenceType`, `markedAt`
- **Feedback:** `id`, `lessonId`, `studentId`, `teacherId`, `content`, `rating`, `strengths`, `improvements`
- **Message:** `id`, `chatId`, `senderId`, `content`, `type` (TEXT, VOICE, IMAGE, etc.), `metadata` (JSON)
- **Chat:** `id`, `type` (GROUP, DIRECT), `groupId`, `isActive`

---

## Task 1 — Calendar list (table) UI component (reusable)

**Status:** DONE

**Goal:** Implement `CalendarLessonsTable` component with columns: checkbox, lessonName, lessonDateTime, teacherName, absence tick, feedback tick, voice tick, text tick, actions (view/edit/delete). Use mock data only.

**Scope:**
- Create reusable table component
- Include all specified columns
- Use mock data (no API integration yet)
- Support checkbox selection for mass operations
- Actions column with view/edit/delete buttons
- Make it reusable for both Admin and Teacher views
- Do NOT add filters/search/pagination yet

**Implementation Checklist:**
- [x] Create `CalendarLessonsTable` component in `apps/web/src/shared/components/calendar/`
- [x] Define TypeScript interface for lesson row data
- [x] Implement table with all columns
- [x] Add checkbox column with selection state
- [x] Add tick columns (absence, feedback, voice, text) - show checkmarks or empty
- [x] Add actions column (view/edit/delete buttons)
- [x] Style consistently with project UI
- [x] Export component from shared components

**Definition of Done:**
- Component renders with mock data
- All columns display correctly
- Checkbox selection works
- Actions buttons are present (functionality will be wired in Task 9)
- Component is reusable (no role-specific logic yet)
- No TypeScript errors
- Component compiles and renders in Storybook or test page

**Files to Touch:**
- `apps/web/src/shared/components/calendar/CalendarLessonsTable.tsx` ✓
- `apps/web/src/shared/components/calendar/index.ts` ✓

**QA Notes:**
- Component created with all required columns
- Checkbox selection implemented (select all, select individual)
- Tick columns show checkmarks (green circle with check icon) or empty state (grey circle with dash)
- Actions column includes View button (Eye icon) and ActionButtons (Edit/Delete)
- Obligations column shows "X/4" format
- Component accepts mock data via `lessons` prop
- Styling matches project style (slate colors, rounded borders, hover states)
- Component is reusable (no role-specific logic)
- To test: Import and render with mock data:
  ```tsx
  import { CalendarLessonsTable, type CalendarLessonRow } from '@/shared/components/calendar';
  
  const mockLessons: CalendarLessonRow[] = [
    {
      id: '1',
      lessonName: 'Grammar Basics',
      lessonDateTime: '2024-01-15T10:00:00Z',
      teacherName: 'John Doe',
      absenceDone: true,
      feedbackDone: false,
      voiceDone: true,
      textDone: false,
    },
    // ... more mock lessons
  ];
  
  <CalendarLessonsTable lessons={mockLessons} />
  ```

---

## Task 2 — Navigation: tick button → Workbench page + sticky tabs + default tab

**Status:** TODO

**Goal:** Create route `/calendar/lessons/:lessonId/workbench?tab=absence|feedbacks|voice|text` with sticky tabs bar. Tab selection persists via URL query param.

**Scope:**
- Create workbench page route for both Admin and Teacher
- Implement sticky tabs bar
- Support 4 tabs: Absence, Feedbacks, Voice, Text
- URL query param controls active tab
- Default tab is "absence" if not specified
- Tabs persist on page refresh
- Do NOT implement tab content yet (just navigation)

**Implementation Checklist:**
- [ ] Create Admin workbench page: `apps/web/src/app/[locale]/(admin)/admin/calendar/lessons/[lessonId]/workbench/page.tsx`
- [ ] Create Teacher workbench page: `apps/web/src/app/[locale]/(teacher)/teacher/calendar/lessons/[lessonId]/workbench/page.tsx`
- [ ] Create shared `WorkbenchTabs` component with sticky positioning
- [ ] Implement tab navigation with URL query param
- [ ] Add "Back to Calendar" navigation
- [ ] Handle invalid lessonId (404 or redirect)
- [ ] Ensure tabs are sticky (stay at top when scrolling)

**Definition of Done:**
- Routes are accessible
- Tabs bar is sticky
- Tab selection updates URL query param
- URL query param controls active tab
- Default tab works when no query param
- Page refresh maintains tab selection
- Navigation works for both Admin and Teacher

**Files to Touch:**
- `apps/web/src/app/[locale]/(admin)/admin/calendar/lessons/[lessonId]/workbench/page.tsx`
- `apps/web/src/app/[locale]/(teacher)/teacher/calendar/lessons/[lessonId]/workbench/page.tsx`
- `apps/web/src/shared/components/calendar/WorkbenchTabs.tsx` (optional, if reusable)

**QA Notes:**
- Navigate to workbench page
- Test tab switching updates URL
- Refresh page and verify tab persists
- Test sticky tabs behavior (scroll down, tabs stay visible)
- Test with invalid lessonId

---

## Task 3 — Absence tab: embed existing Attendance Register

**Status:** TODO

**Goal:** Move/reuse Attendance Register component in Workbench → Absence tab. Admin view-only, Teacher edit.

**Scope:**
- Embed `AttendanceGrid` component in Absence tab
- Fetch attendance data for the specific lesson
- Admin: view-only (read-only mode)
- Teacher: edit mode (can mark attendance)
- Reuse existing `AttendanceGrid` component
- Handle save functionality
- Show lesson context (lesson name, date, time)

**Implementation Checklist:**
- [ ] Create Absence tab content component
- [ ] Fetch lesson data by ID
- [ ] Fetch students for the lesson's group
- [ ] Fetch attendance data for the lesson
- [ ] Embed `AttendanceGrid` with lesson-specific data
- [ ] Implement permission check (Admin view-only, Teacher edit)
- [ ] Handle save for Teacher role
- [ ] Show lesson context header
- [ ] Handle loading and error states

**Definition of Done:**
- Absence tab shows attendance grid for the lesson
- Admin can view but not edit
- Teacher can view and edit attendance
- Save functionality works for Teacher
- Lesson context is displayed
- Loading and error states handled

**Files to Touch:**
- `apps/web/src/shared/components/calendar/WorkbenchAbsenceTab.tsx` (or inline in workbench page)
- Update workbench page to render Absence tab content

**QA Notes:**
- Open workbench for a lesson
- Verify Absence tab shows attendance grid
- Test Admin view (should be read-only)
- Test Teacher edit (should be able to mark attendance and save)
- Verify save persists to database

---

## Task 4 — Feedbacks tab: participants list + per-student feedback

**Status:** TODO

**Goal:** Show all participants in the lesson's group, allow per-student feedback save, persist to database.

**Scope:**
- Display list of students in the lesson's group
- For each student, show feedback form/editor
- Allow saving feedback per student
- Persist feedback to database using existing Feedback API
- Show existing feedbacks if any
- Support create and update
- Admin view-only, Teacher edit

**Implementation Checklist:**
- [ ] Create Feedbacks tab content component
- [ ] Fetch students for the lesson's group
- [ ] Fetch existing feedbacks for the lesson
- [ ] Create feedback form component (content, rating, strengths, improvements)
- [ ] Implement per-student feedback save
- [ ] Handle create vs update logic
- [ ] Show loading states
- [ ] Implement permission check (Admin view-only, Teacher edit)
- [ ] Show success/error messages

**Definition of Done:**
- Feedbacks tab shows all students in group
- Each student has feedback form
- Teacher can save feedback per student
- Feedback persists to database
- Existing feedbacks are loaded and displayed
- Admin can view but not edit
- Loading and error states handled

**Files to Touch:**
- `apps/web/src/shared/components/calendar/WorkbenchFeedbacksTab.tsx`
- `apps/web/src/shared/components/calendar/StudentFeedbackForm.tsx` (optional, if reusable)
- Update workbench page to render Feedbacks tab content

**QA Notes:**
- Open workbench for a lesson
- Verify Feedbacks tab shows all students
- Test creating feedback for a student
- Test updating existing feedback
- Verify feedback persists to database
- Test Admin view (read-only)
- Test Teacher edit

---

## Task 5 — Voice tab: record/upload voice → Done → upload to R2 → send to group chat

**Status:** TODO

**Goal:** Implement minimal flow: record or upload audio, backend uploads to R2, on Done send chat message referencing stored audio, persist metadata.

**Scope:**
- Create voice recording/upload UI
- Support both recording (browser MediaRecorder) and file upload
- Backend uploads audio to R2 using StorageService
- Store metadata in database (lessonId, teacherId, r2Key, public/secure URL, size, mimeType, createdAt)
- On "Done", create chat message in group chat with voice message type
- Message should reference the R2 URL/key
- Use signed URLs if chat should be private
- Admin view-only, Teacher edit

**Implementation Checklist:**
- [ ] Create Voice tab content component
- [ ] Implement audio recording UI (MediaRecorder API)
- [ ] Implement audio file upload UI
- [ ] Create backend endpoint for voice upload (or reuse existing storage endpoint)
- [ ] Upload audio to R2 using StorageService
- [ ] Store voice metadata in database (may need new table or use Message metadata)
- [ ] Fetch group chat for the lesson's group
- [ ] On "Done", create chat message with type VOICE
- [ ] Message content/metadata should reference R2 key/URL
- [ ] Implement permission check (Admin view-only, Teacher edit)
- [ ] Show upload progress
- [ ] Handle errors

**Definition of Done:**
- Voice tab allows recording or uploading audio
- Audio is uploaded to R2
- Metadata is stored in database
- Chat message is created in group chat on "Done"
- Message references stored audio
- Admin can view but not record/upload
- Teacher can record/upload and send
- Loading and error states handled

**Files to Touch:**
- `apps/web/src/shared/components/calendar/WorkbenchVoiceTab.tsx`
- `apps/web/src/shared/components/calendar/VoiceRecorder.tsx` (optional, if reusable)
- Backend: Create voice upload endpoint or extend storage controller
- Database: May need to add voice metadata table or use Message.metadata JSON field

**QA Notes:**
- Open workbench for a lesson
- Test recording audio
- Test uploading audio file
- Verify audio is uploaded to R2
- Verify chat message is created in group chat
- Verify message has correct type and references audio
- Test Admin view (read-only)
- Test Teacher edit

---

## Task 6 — Text tab: write text → Done → send to group chat

**Status:** TODO

**Goal:** Implement minimal text editor, on Done send to group chat, persist message.

**Scope:**
- Create text editor (simple textarea is sufficient, no rich text needed)
- On "Done", send text message to group chat
- Message type: TEXT
- Persist message to database
- Admin view-only, Teacher edit

**Implementation Checklist:**
- [ ] Create Text tab content component
- [ ] Implement text editor (textarea)
- [ ] Fetch group chat for the lesson's group
- [ ] On "Done", send message to group chat using existing chat API
- [ ] Implement permission check (Admin view-only, Teacher edit)
- [ ] Show success/error messages
- [ ] Clear editor after successful send

**Definition of Done:**
- Text tab shows text editor
- Teacher can type and send message
- Message is sent to group chat
- Message persists to database
- Admin can view but not send
- Loading and error states handled

**Files to Touch:**
- `apps/web/src/shared/components/calendar/WorkbenchTextTab.tsx`
- Update workbench page to render Text tab content

**QA Notes:**
- Open workbench for a lesson
- Test typing and sending text message
- Verify message appears in group chat
- Verify message persists to database
- Test Admin view (read-only)
- Test Teacher edit

---

## Task 7 — Completion tracking: 4 actions → obligations (X/4) + done flags

**Status:** TODO

**Goal:** Define "done" rules for 4 actions (absence, feedbacks, voice, text), persist flags per lessonId+teacherId, reflect in Calendar list (replace mock data).

**Scope:**
- Define completion rules:
  - Absence: All students marked (present or absent)
  - Feedbacks: All students have feedback OR at least one feedback exists (clarify requirement)
  - Voice: At least one voice message sent to group chat for this lesson
  - Text: At least one text message sent to group chat for this lesson
- Create database model/fields to track completion flags
- Update completion flags when actions are completed
- Update CalendarLessonsTable to show real completion status (replace mock)
- Show obligations as "X/4" in table

**Implementation Checklist:**
- [ ] Define completion rules clearly
- [ ] Create database migration for completion tracking (may use Lesson model fields or new table)
- [ ] Update Absence tab to mark completion when all students marked
- [ ] Update Feedbacks tab to mark completion when feedbacks are saved
- [ ] Update Voice tab to mark completion when voice message sent
- [ ] Update Text tab to mark completion when text message sent
- [ ] Create API endpoint or service method to get completion status
- [ ] Update CalendarLessonsTable to fetch real data and show completion status
- [ ] Replace mock data with real API calls
- [ ] Show "X/4" obligations in table

**Definition of Done:**
- Completion rules are defined and documented
- Database tracks completion flags
- Completion flags update when actions complete
- Calendar list shows real completion status
- Obligations display as "X/4"
- All 4 actions tracked correctly

**Files to Touch:**
- Database: Migration file for completion tracking
- `apps/api/src/modules/lessons/lessons.service.ts` (add completion tracking methods)
- `apps/web/src/shared/components/calendar/CalendarLessonsTable.tsx` (replace mock with real data)
- Update all workbench tabs to mark completion

**QA Notes:**
- Complete all 4 actions for a lesson
- Verify completion flags are set
- Verify Calendar list shows "4/4" obligations
- Test partial completion (e.g., 2/4)
- Verify flags persist after page refresh

---

## Task 8 — Finance integration: obligations column + deductions column

**Status:** TODO

**Goal:** In Finance module show obligations (X/4) and deductions amount based on missing actions and salary rules. Document formula and align with existing finance flow.

**Scope:**
- Add obligations column to Finance module (teacher salary view)
- Calculate deductions based on missing actions
- Use existing Deduction model and DeductionReason enum
- Document deduction formula
- Align with existing salary calculation flow
- Show obligations count (X/4) per teacher/period

**Implementation Checklist:**
- [ ] Document deduction formula (e.g., X% per missing action, or fixed amount)
- [ ] Add obligations column to Finance salary view
- [ ] Calculate obligations count per teacher/period
- [ ] Calculate deductions based on missing actions
- [ ] Create deduction records when salary is generated
- [ ] Update Finance UI to show obligations and deductions
- [ ] Ensure deductions integrate with existing salary calculation

**Definition of Done:**
- Finance module shows obligations (X/4)
- Deductions are calculated based on missing actions
- Deduction formula is documented
- Deductions are created in database
- Deductions integrate with salary calculation
- UI displays obligations and deductions clearly

**Files to Touch:**
- `apps/api/src/modules/finance/salaries.service.ts` (add obligation/deduction calculation)
- `apps/web/src/app/[locale]/(admin)/admin/finance/page.tsx` (add obligations column)
- `docs/CALENDAR_WORKBENCH_PLAN.md` (document formula)

**QA Notes:**
- Generate salary for a teacher with missing actions
- Verify obligations count is correct
- Verify deductions are calculated correctly
- Verify deductions appear in Finance UI
- Verify deductions are included in salary calculation

---

## Task 9 — Mass delete + row actions wiring

**Status:** TODO

**Goal:** Implement mass delete with confirmation, wire view/edit/delete actions, enforce permissions.

**Scope:**
- Implement mass delete functionality (delete selected lessons)
- Add confirmation dialog for mass delete
- Wire "view" action → navigate to workbench
- Wire "edit" action → navigate to lesson edit (if exists) or workbench
- Wire "delete" action → delete lesson with confirmation
- Enforce permissions: Admin can delete, Teacher cannot delete
- Handle errors gracefully

**Implementation Checklist:**
- [ ] Implement checkbox selection state management
- [ ] Add "Delete Selected" button (only visible when items selected)
- [ ] Create confirmation dialog for mass delete
- [ ] Implement mass delete API call
- [ ] Wire "view" button → navigate to workbench
- [ ] Wire "edit" button → navigate to edit page or workbench
- [ ] Wire "delete" button → delete with confirmation
- [ ] Implement permission checks (Admin vs Teacher)
- [ ] Handle errors and show messages
- [ ] Refresh table after delete operations

**Definition of Done:**
- Mass delete works with confirmation
- View action navigates to workbench
- Edit action navigates appropriately
- Delete action works with confirmation
- Permissions are enforced
- Errors are handled gracefully
- Table refreshes after operations

**Files to Touch:**
- `apps/web/src/shared/components/calendar/CalendarLessonsTable.tsx` (wire actions)
- `apps/web/src/shared/components/ui/ConfirmDialog.tsx` (if doesn't exist)
- Update Calendar pages to handle actions

**QA Notes:**
- Select multiple lessons and delete
- Verify confirmation dialog appears
- Test view action navigation
- Test edit action navigation
- Test delete action
- Verify permissions (Teacher cannot delete)
- Test error handling

---

## Notes

- All tasks must be completed sequentially
- After each task, update Status to DONE and fill in "Files to Touch"
- Add QA steps that confirm the feature works
- Ensure app compiles and runs after each task
- Reuse existing components/APIs whenever possible
- Do not add extra features unless explicitly listed
- Keep UI consistent with project style

