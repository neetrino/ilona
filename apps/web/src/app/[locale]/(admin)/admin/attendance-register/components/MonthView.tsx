'use client';

import { AttendanceGrid } from '@/shared/components/attendance';
import { MonthViewCalendar } from './MonthViewCalendar';
import { AttendanceContextHeader } from './AttendanceContextHeader';
import { AttendanceLoadingState } from './AttendanceLoadingState';
import { AttendanceEmptyState } from './AttendanceEmptyState';
import { formatDateDisplay } from '@/features/attendance/utils/dateUtils';
import type { Group } from '@/features/groups';
import type { Lesson } from '@/features/lessons';
import type { Student } from '@/features/students';
import type { AttendanceCell } from '../hooks/useAttendanceData';
import type { AbsenceType } from '@/features/attendance';

interface MonthViewProps {
  group: Group | undefined;
  currentDate: Date;
  selectedDayForMonthView: string | null;
  students: Student[];
  filteredLessons: Lesson[];
  attendanceData: Record<string, Record<string, AttendanceCell>>;
  attendanceQueries: Array<{ isLoading: boolean; isError: boolean }>;
  isLoadingLessons: boolean;
  isLoadingStudents: boolean;
  isLoadingAttendance: boolean;
  savingLessons: Record<string, boolean>;
  hasUnsavedChanges: boolean;
  effectiveDateRange: { from: string; to: string };
  lessonsByDate: Record<string, Lesson[]>;
  onDaySelect: (date: Date) => void;
  onLessonSave: (
    lessonId: string,
    attendances: Array<{ studentId: string; isPresent: boolean; absenceType?: AbsenceType }>
  ) => Promise<void>;
  onSaveSuccess: (id: string) => void;
  onSaveError: (id: string, error: string) => void;
  onUnsavedChangesChange: (hasUnsavedChanges: boolean) => void;
}

export function MonthView({
  group,
  currentDate,
  selectedDayForMonthView,
  students,
  filteredLessons,
  attendanceData,
  attendanceQueries,
  isLoadingLessons,
  isLoadingStudents,
  isLoadingAttendance,
  savingLessons,
  hasUnsavedChanges,
  effectiveDateRange,
  lessonsByDate,
  onDaySelect,
  onLessonSave,
  onSaveSuccess,
  onSaveError,
  onUnsavedChangesChange,
}: MonthViewProps) {
  return (
    <>
      <MonthViewCalendar
        currentDate={currentDate}
        selectedGroup={group}
        selectedDayForMonthView={selectedDayForMonthView}
        lessonsByDate={lessonsByDate}
        hasUnsavedChanges={hasUnsavedChanges}
        onDaySelect={onDaySelect}
      />

      {selectedDayForMonthView && (
        <div className="bg-white rounded-xl border-2 border-slate-300 p-6 shadow-sm">
          <AttendanceContextHeader
            group={group || null}
            date={new Date(selectedDayForMonthView)}
            viewMode="month"
            lessonsCount={filteredLessons.length}
            studentsCount={students.length}
            hasUnsavedChanges={hasUnsavedChanges}
          />

          {isLoadingLessons || isLoadingStudents || isLoadingAttendance ? (
            <AttendanceLoadingState isLoadingAttendance={isLoadingAttendance} />
          ) : filteredLessons.length === 0 ? (
            <AttendanceEmptyState dateString={selectedDayForMonthView} />
          ) : (
            <AttendanceGrid
              students={students.map((s) => ({
                id: s.id,
                user: {
                  id: s.user.id,
                  firstName: s.user.firstName,
                  lastName: s.user.lastName,
                  avatarUrl: s.user.avatarUrl,
                },
              }))}
              lessons={filteredLessons}
              initialAttendance={attendanceData}
              onLessonSave={onLessonSave}
              isLoading={isLoadingAttendance}
              isSaving={savingLessons}
              dateRange={effectiveDateRange}
              onSaveSuccess={onSaveSuccess}
              onSaveError={onSaveError}
              onUnsavedChangesChange={onUnsavedChangesChange}
            />
          )}
        </div>
      )}
    </>
  );
}

