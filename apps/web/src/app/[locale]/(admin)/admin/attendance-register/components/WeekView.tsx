'use client';

import { WeekAttendanceGrid } from '@/shared/components/attendance';
import { AttendanceContextHeader } from './AttendanceContextHeader';
import { AttendanceLoadingState } from './AttendanceLoadingState';
import { AttendanceErrorState } from './AttendanceErrorState';
import { formatWeekRange } from '@/features/attendance/utils/dateUtils';
import type { Group } from '@/features/groups';
import type { Lesson } from '@/features/lessons';
import type { Student } from '@/features/students';
import type { AttendanceCell } from '../hooks/useAttendanceData';
import type { AbsenceType } from '@/features/attendance';

interface WeekViewProps {
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
  weekDates: Date[];
  onDaySave: (
    date: string,
    attendances: Array<{ studentId: string; lessonId: string; isPresent: boolean; absenceType?: AbsenceType }>
  ) => Promise<void>;
  onSaveSuccess: (id: string) => void;
  onSaveError: (id: string, error: string) => void;
  onUnsavedChangesChange: (hasUnsavedChanges: boolean) => void;
}

export function WeekView({
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
  weekDates,
  onDaySave,
  onSaveSuccess,
  onSaveError,
  onUnsavedChangesChange,
}: WeekViewProps) {
  return (
    <div className="bg-white rounded-xl border-2 border-slate-300 p-6 shadow-sm">
      <AttendanceContextHeader
        group={group || null}
        weekRange={formatWeekRange(currentDate)}
        viewMode="week"
        lessonsCount={filteredLessons.length}
        studentsCount={students.length}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      {isLoadingLessons || isLoadingStudents || isLoadingAttendance ? (
        <AttendanceLoadingState isLoadingAttendance={isLoadingAttendance} />
      ) : attendanceQueries.some((q) => q.isError) ? (
        <AttendanceErrorState />
      ) : (
        <WeekAttendanceGrid
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
          onDaySave={onDaySave}
          isLoading={isLoadingAttendance}
          isSaving={savingLessons}
          weekDates={weekDates}
          onSaveSuccess={onSaveSuccess}
          onSaveError={onSaveError}
          onUnsavedChangesChange={onUnsavedChangesChange}
        />
      )}
    </div>
  );
}

