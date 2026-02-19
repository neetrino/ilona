'use client';

import { AttendanceGrid } from '@/shared/components/attendance';
import { AttendanceContextHeader } from './AttendanceContextHeader';
import { AttendanceLoadingState } from './AttendanceLoadingState';
import { AttendanceErrorState } from './AttendanceErrorState';
import { AttendanceEmptyState } from './AttendanceEmptyState';
import { formatDateDisplay } from '@/features/attendance/utils/dateUtils';
import type { Group } from '@/features/groups';
import type { Lesson } from '@/features/lessons';
import type { Student } from '@/features/students';
import type { AttendanceCell } from '../hooks/useAttendanceData';
import type { AbsenceType } from '@/features/attendance';

interface DayViewProps {
  group: Group | undefined;
  currentDate: Date;
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
  onLessonSave: (
    lessonId: string,
    attendances: Array<{ studentId: string; isPresent: boolean; absenceType?: AbsenceType }>
  ) => Promise<void>;
  onSaveSuccess: (id: string) => void;
  onSaveError: (id: string, error: string) => void;
  onUnsavedChangesChange: (hasUnsavedChanges: boolean) => void;
  isCurrentDateToday: boolean;
}

export function DayView({
  group,
  currentDate,
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
  onLessonSave,
  onSaveSuccess,
  onSaveError,
  onUnsavedChangesChange,
  isCurrentDateToday,
}: DayViewProps) {
  return (
    <div className="bg-white rounded-xl border-2 border-slate-300 p-6 shadow-sm">
      <AttendanceContextHeader
        group={group || null}
        date={currentDate}
        viewMode="day"
        lessonsCount={filteredLessons.length}
        studentsCount={students.length}
        hasUnsavedChanges={hasUnsavedChanges}
        isCurrentDateToday={isCurrentDateToday}
      />

      {isLoadingLessons || isLoadingStudents || isLoadingAttendance ? (
        <AttendanceLoadingState isLoadingAttendance={isLoadingAttendance} />
      ) : attendanceQueries.some((q) => q.isError) ? (
        <AttendanceErrorState />
      ) : filteredLessons.length === 0 ? (
        <AttendanceEmptyState date={currentDate} />
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
  );
}

