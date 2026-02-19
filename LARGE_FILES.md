# Large Files Analysis Report

This document lists all project source files that exceed **650 lines of code**.

**Generated:** Analysis of project source code (frontend + backend)  
**Exclusions:** node_modules, dist, build folders, generated files  
**Purpose:** Identify files that may benefit from refactoring and splitting responsibilities

---

## Summary

**Total files exceeding 650 lines:** 17

- **Backend files:** 5
- **Frontend files:** 12

---

## Backend Files (apps/api/src)

### 1. Chat Service ✅ DONE
- **File Path:** `apps/api/src/modules/chat/chat.service.ts`
- **File Name:** `chat.service.ts`
- **Total Lines:** 80 (was 2,230)
- **Category:** Backend Service
- **Module:** Chat
- **Status:** Refactored into: ChatManagementService, MessageService, ChatListsService, ChatAuthorizationService

### 2. Salaries Service ✅ DONE
- **File Path:** `apps/api/src/modules/finance/salaries.service.ts`
- **File Name:** `salaries.service.ts`
- **Total Lines:** 72 (was 1,193)
- **Category:** Backend Service
- **Module:** Finance
- **Status:** Refactored into: SalaryCalculationService, SalaryGenerationService, SalaryRecordService, SalaryBreakdownService

### 3. Lessons Service ✅ DONE
- **File Path:** `apps/api/src/modules/lessons/lessons.service.ts`
- **File Name:** `lessons.service.ts`
- **Total Lines:** 130 (was 1,074)
- **Category:** Backend Service
- **Module:** Lessons
- **Status:** Refactored into: LessonCrudService, LessonStatusService, LessonActionsService, LessonSchedulingService, LessonStatisticsService, LessonEnrichmentService

### 4. Students Service ✅ DONE
- **File Path:** `apps/api/src/modules/students/students.service.ts`
- **File Name:** `students.service.ts`
- **Total Lines:** 87 (was 902, originally 1,008)
- **Category:** Backend Service
- **Module:** Students
- **Status:** Refactored into: StudentCrudService, StudentQueryService, StudentStatisticsService, StudentGroupService

### 5. Teachers Service ✅ DONE
- **File Path:** `apps/api/src/modules/teachers/teachers.service.ts`
- **File Name:** `teachers.service.ts`
- **Total Lines:** 61 (was 880, originally 981)
- **Category:** Backend Service
- **Module:** Teachers
- **Status:** Refactored into: TeacherCrudService, TeacherObligationService, TeacherStatisticsService

---

## Frontend Files (apps/web/src)

### 6. Groups Page ✅ DONE
- **File Path:** `apps/web/src/app/[locale]/(admin)/admin/groups/page.tsx`
- **File Name:** `page.tsx`
- **Total Lines:** 121 (was 1,241)
- **Category:** Frontend Page Component
- **Feature:** Groups & Centers Management
- **Status:** Refactored into: GroupsTab component, CentersTab component, GroupCard component, CenterCard component, useGroupsManagement hook, useCentersManagement hook

### 7. Teachers Page ✅ DONE
- **File Path:** `apps/web/src/app/[locale]/(admin)/admin/teachers/page.tsx`
- **File Name:** `page.tsx`
- **Total Lines:** 278 (was 1,240)
- **Category:** Frontend Page Component
- **Feature:** Teachers Management
- **Status:** Refactored into: TeachersList component, TeachersBoard component, TeachersFilters component, TeachersStats component, TeachersInfoCards component, TeachersMessages component, TeachersTableColumns utility

### 8. Students Page ✅ DONE
- **File Path:** `apps/web/src/app/[locale]/(admin)/admin/students/page.tsx`
- **File Name:** `page.tsx`
- **Total Lines:** 759 (was 1,235)
- **Category:** Frontend Page Component
- **Feature:** Students Management
- **Status:** Refactored into: StudentsList component, StudentsBoard component, StudentsFilters component, StudentsStats component, StudentsMessages component, StudentsTableColumns utility

### 9. Attendance Register Page ✅ DONE
- **File Path:** `apps/web/src/app/[locale]/(admin)/admin/attendance-register/page.tsx`
- **File Name:** `page.tsx`
- **Total Lines:** 239 (was 1,062)
- **Category:** Frontend Page Component
- **Feature:** Attendance Management
- **Status:** Refactored into: useAttendanceData hook, useAttendanceNavigation hook, DayView component, WeekView component, MonthView component, AttendanceControls component, AttendanceStats component, and other utility components

### 10. Finance Page ✅ DONE
- **File Path:** `apps/web/src/app/[locale]/(admin)/admin/finance/page.tsx`
- **File Name:** `page.tsx`
- **Total Lines:** 269 (was 821)
- **Category:** Frontend Page Component
- **Feature:** Finance Management
- **Status:** Refactored into: FinanceStats component, FinanceTabs component, FinanceFilters component, PaymentsTable component, SalariesTable component, FinanceInfoCards component, SelectAllCheckbox component, useFinancePage hook, tableColumns utilities

### 11. Settings Page
- **File Path:** `apps/web/src/app/[locale]/(admin)/admin/settings/page.tsx`
- **File Name:** `page.tsx`
- **Total Lines:** 687
- **Category:** Frontend Page Component
- **Feature:** Settings Management

### 12. Teacher Attendance Register Page
- **File Path:** `apps/web/src/app/[locale]/(teacher)/teacher/attendance-register/page.tsx`
- **File Name:** `page.tsx`
- **Total Lines:** 980
- **Category:** Frontend Page Component
- **Feature:** Teacher Attendance Management

### 13. API Library
- **File Path:** `apps/web/src/shared/lib/api.ts`
- **File Name:** `api.ts`
- **Total Lines:** 696
- **Category:** Frontend Library/Utility
- **Feature:** API Client & Utilities

### 14. Chat Window Component
- **File Path:** `apps/web/src/features/chat/components/ChatWindow.tsx`
- **File Name:** `ChatWindow.tsx`
- **Total Lines:** 861
- **Category:** Frontend Component
- **Feature:** Chat

### 15. Student Detail Page
- **File Path:** `apps/web/src/app/[locale]/(admin)/admin/students/[id]/page.tsx`
- **File Name:** `page.tsx`
- **Total Lines:** 745
- **Category:** Frontend Page Component
- **Feature:** Student Details View

### 16. Teacher Detail Page
- **File Path:** `apps/web/src/app/[locale]/(admin)/admin/teachers/[id]/page.tsx`
- **File Name:** `page.tsx`
- **Total Lines:** 680
- **Category:** Frontend Page Component
- **Feature:** Teacher Details View

### 17. Teacher Calendar Page
- **File Path:** `apps/web/src/app/[locale]/(teacher)/teacher/calendar/page.tsx`
- **File Name:** `page.tsx`
- **Total Lines:** 659
- **Category:** Frontend Page Component
- **Feature:** Teacher Calendar View

---

## Recommendations

### High Priority (2000+ lines)
- **chat.service.ts (2,230 lines)** - This file is significantly large and should be prioritized for refactoring. Consider splitting into:
  - Message handling service
  - Chat room/group management service
  - File/voice message service
  - Notification service

### High Priority (1000-1300 lines)
- **groups/page.tsx (1,241 lines)** - Consider splitting into separate components:
  - GroupsTab component
  - CentersTab component
  - GroupCard component (already exists, extract more logic)
  - CenterCard component
  - Separate hooks for groups and centers management

- **teachers/page.tsx (1,240 lines)** - Consider splitting into:
  - TeachersList component
  - TeachersBoard component
  - TeacherCard component (already exists, extract more logic)
  - Separate hooks for filtering, pagination, and bulk operations

- **students/page.tsx (1,235 lines)** - Consider splitting into:
  - StudentsList component
  - StudentsBoard component
  - StudentCard component (already exists, extract more logic)
  - Separate hooks for filtering, pagination, and bulk operations

- **attendance-register/page.tsx (1,062 lines)** - Consider splitting into:
  - DayView component
  - WeekView component
  - MonthView component
  - AttendanceControls component
  - Separate hooks for attendance data management

- **teacher/attendance-register/page.tsx (980 lines)** - Consider splitting into:
  - DayView component
  - WeekView component
  - MonthView component
  - AttendanceControls component
  - Separate hooks for attendance data management

### Medium Priority (800-1000 lines)
- **salaries.service.ts** ✅ DONE - Refactored into specialized services
- **lessons.service.ts** ✅ DONE - Refactored into specialized services
- **students.service.ts** ✅ DONE - Refactored into specialized services
- **teachers.service.ts** ✅ DONE - Refactored into specialized services

### Lower Priority (650-800 lines)
- **ChatWindow.tsx (861 lines)** - Consider extracting sub-components for:
  - Message list rendering
  - Input/textarea handling
  - File upload UI
  - Voice recording UI

- **api.ts (696 lines)** - Consider splitting into:
  - API client configuration
  - Request/response interceptors
  - Error handling utilities
  - File upload utilities

- **settings/page.tsx (687 lines)** - Consider splitting into:
  - SettingsForm component
  - SettingsSections component
  - Separate hooks for settings management

- **students/[id]/page.tsx (745 lines)** - Consider splitting into:
  - StudentDetails component
  - StudentStats component
  - StudentHistory component
  - Separate hooks for student data

- **teachers/[id]/page.tsx (680 lines)** - Consider splitting into:
  - TeacherDetails component
  - TeacherStats component
  - TeacherSchedule component
  - Separate hooks for teacher data

- **teacher/calendar/page.tsx (659 lines)** - Consider splitting into:
  - CalendarView component
  - LessonList component
  - CalendarControls component
  - Separate hooks for calendar data

---

## Notes

- All files listed are active source code files
- No generated files, build artifacts, or dependencies were included
- This analysis is for informational purposes only - no code changes were made
- Files are sorted by line count (descending) within each category

---

## Next Steps

1. Review each file to identify logical boundaries for splitting
2. Create refactoring plan for each file
3. Implement changes incrementally with proper testing
4. Update this document as files are refactored

