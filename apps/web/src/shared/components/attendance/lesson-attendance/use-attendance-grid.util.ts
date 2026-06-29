import type { Lesson } from '@/features/lessons';
import type { AbsenceType } from '@/features/attendance';
import type { AttendanceCell, AttendanceStatus, WeekAttendanceStudent } from '../week-attendance/types';

export interface UseAttendanceGridOptions {
  students: WeekAttendanceStudent[];
  lessons: Lesson[];
  initialAttendance?: Record<string, Record<string, AttendanceCell>>;
  onCellChange?: (studentId: string, lessonId: string, status: AttendanceStatus) => void;
  onLessonSave?: (
    lessonId: string,
    attendances: Array<{
      studentId: string;
      isPresent: boolean;
      absenceType?: AbsenceType;
      note?: string;
    }>,
  ) => Promise<void>;
  isSaving?: Record<string, boolean>;
  dateRange?: { from: string; to: string };
  onSaveSuccess?: (lessonId: string) => void;
  onSaveError?: (lessonId: string, error: string) => void;
  onUnsavedChangesChange?: (hasUnsavedChanges: boolean) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
  locale: string;
  isLoading?: boolean;
}

export type AttendanceGridPendingChanges = Record<string, Set<string>>;

export function clonePendingChanges(source: AttendanceGridPendingChanges): AttendanceGridPendingChanges {
  const cloned: AttendanceGridPendingChanges = {};
  Object.entries(source).forEach(([lessonId, studentsSet]) => {
    cloned[lessonId] = new Set(studentsSet);
  });
  return cloned;
}

export function mergeAttendanceWithPendingChanges(
  initialAttendance: Record<string, Record<string, AttendanceCell>>,
  prev: Record<string, Record<string, AttendanceCell>>,
  pendingChanges: AttendanceGridPendingChanges,
): Record<string, Record<string, AttendanceCell>> {
  const merged: Record<string, Record<string, AttendanceCell>> = {};
  Object.keys(initialAttendance).forEach((lessonId) => {
    merged[lessonId] = { ...initialAttendance[lessonId] };
  });
  Object.keys(pendingChanges).forEach((lessonId) => {
    const lessonPendingChanges = pendingChanges[lessonId];
    if (lessonPendingChanges && lessonPendingChanges.size > 0 && prev[lessonId]) {
      if (!merged[lessonId]) merged[lessonId] = {};
      lessonPendingChanges.forEach((studentId) => {
        if (prev[lessonId]?.[studentId]) {
          merged[lessonId][studentId] = prev[lessonId][studentId];
        }
      });
    }
  });
  return merged;
}
