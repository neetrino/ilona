import type { Lesson } from '@/features/lessons';
import type { AbsenceType } from '@/features/attendance';
import type { AttendanceCell } from './types';

export interface UseWeekAttendanceGridOptions {
  lessons: Lesson[];
  initialAttendance?: Record<string, Record<string, AttendanceCell>>;
  onDaySave?: (
    date: string,
    attendances: Array<{
      studentId: string;
      lessonId: string;
      isPresent: boolean;
      absenceType?: AbsenceType;
      note?: string;
    }>,
  ) => Promise<void>;
  isSaving?: Record<string, boolean>;
  weekDates: Date[];
  onUnsavedChangesChange?: (hasUnsavedChanges: boolean) => void;
  onSaveSuccess?: (date: string) => void;
  onSaveError?: (date: string, error: string) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export type WeekAttendancePendingChanges = Record<string, Set<string>>;

export function cloneWeekPendingChanges(source: WeekAttendancePendingChanges): WeekAttendancePendingChanges {
  const cloned: WeekAttendancePendingChanges = {};
  Object.entries(source).forEach(([dateStr, studentsSet]) => {
    cloned[dateStr] = new Set(studentsSet);
  });
  return cloned;
}

export function mergeWeekAttendanceWithPendingChanges(
  initialAttendance: Record<string, Record<string, AttendanceCell>>,
  prev: Record<string, Record<string, AttendanceCell>>,
  pendingChanges: WeekAttendancePendingChanges,
  lessons: Lesson[],
): Record<string, Record<string, AttendanceCell>> {
  const merged: Record<string, Record<string, AttendanceCell>> = {};
  Object.keys(initialAttendance).forEach((lessonId) => {
    merged[lessonId] = { ...initialAttendance[lessonId] };
  });

  Object.keys(pendingChanges).forEach((dateStr) => {
    const datePendingChanges = pendingChanges[dateStr];
    if (!datePendingChanges?.size) return;

    const lessonsForDate = lessons.filter((lesson) => {
      const lessonDate = new Date(lesson.scheduledAt).toISOString().split('T')[0];
      return lessonDate === dateStr;
    });

    lessonsForDate.forEach((lesson) => {
      if (!merged[lesson.id]) merged[lesson.id] = {};
      datePendingChanges.forEach((studentId) => {
        if (prev[lesson.id]?.[studentId]) {
          merged[lesson.id][studentId] = prev[lesson.id][studentId];
        }
      });
    });
  });

  return merged;
}
