import { useCallback } from 'react';
import type { KeyboardEvent } from 'react';
import type { Lesson } from '@/features/lessons';
import type { WeekAttendanceStudent } from '../week-attendance/types';

interface UseAttendanceGridKeyboardOptions {
  students: WeekAttendanceStudent[];
  sortedLessons: Lesson[];
  isLoading: boolean;
  isSaving: Record<string, boolean>;
  isEditMode: boolean;
  toggleCellStatus: (studentId: string, lessonId: string) => void;
  setFocusedCell: (cell: { studentId: string; lessonId: string }) => void;
}

export function useAttendanceGridKeyboard({
  students,
  sortedLessons,
  isLoading,
  isSaving,
  isEditMode,
  toggleCellStatus,
  setFocusedCell,
}: UseAttendanceGridKeyboardOptions) {
  return useCallback(
    (e: KeyboardEvent, studentId: string, lessonId: string) => {
      if (isLoading || Object.values(isSaving).some(Boolean)) return;

      const studentIndex = students.findIndex((s) => s.id === studentId);
      const lessonIndex = sortedLessons.findIndex((l) => l.id === lessonId);

      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (isEditMode) toggleCellStatus(studentId, lessonId);
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (studentIndex > 0) {
            setFocusedCell({ studentId: students[studentIndex - 1].id, lessonId });
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (studentIndex < students.length - 1) {
            setFocusedCell({ studentId: students[studentIndex + 1].id, lessonId });
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (lessonIndex > 0) {
            setFocusedCell({ studentId, lessonId: sortedLessons[lessonIndex - 1].id });
          }
          break;
        case 'ArrowRight':
        case 'Tab':
          e.preventDefault();
          if (lessonIndex < sortedLessons.length - 1) {
            setFocusedCell({ studentId, lessonId: sortedLessons[lessonIndex + 1].id });
          }
          break;
      }
    },
    [students, sortedLessons, toggleCellStatus, isLoading, isSaving, isEditMode, setFocusedCell],
  );
}
