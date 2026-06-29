import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { Lesson } from '@/features/lessons';
import type { AbsenceType } from '@/features/attendance';
import { formatDateString } from '@/features/attendance/utils/dateUtils';
import type { AttendanceCell } from './types';
import type { WeekAttendancePendingChanges } from './use-week-attendance-grid.util';

interface UseWeekAttendanceGridSaveOptions {
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
  pendingChanges: WeekAttendancePendingChanges;
  attendanceData: Record<string, Record<string, AttendanceCell>>;
  lessonsByDate: Record<string, Lesson[]>;
  weekDates: Date[];
  setPendingChanges: Dispatch<SetStateAction<WeekAttendancePendingChanges>>;
  setSaveError: Dispatch<SetStateAction<Record<string, string>>>;
  setSaveSuccess: Dispatch<SetStateAction<Record<string, boolean>>>;
  setJustificationDialog: Dispatch<SetStateAction<{ studentId: string; dateStr: string } | null>>;
  onSaveSuccess?: (date: string) => void;
  onSaveError?: (date: string, error: string) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export function useWeekAttendanceGridSave({
  onDaySave,
  pendingChanges,
  attendanceData,
  lessonsByDate,
  weekDates,
  setPendingChanges,
  setSaveError,
  setSaveSuccess,
  setJustificationDialog,
  onSaveSuccess,
  onSaveError,
  t,
}: UseWeekAttendanceGridSaveOptions) {
  const handleDaySave = useCallback(
    async (date: Date) => {
      if (!onDaySave) return;

      const dateStr = formatDateString(date);
      if (!pendingChanges[dateStr]?.size) return;

      const dayLessons = lessonsByDate[dateStr] || [];
      if (dayLessons.length === 0) return;

      const attendances: Array<{
        studentId: string;
        lessonId: string;
        isPresent: boolean;
        absenceType?: AbsenceType;
        note?: string;
      }> = [];
      const studentsMissingJustification: string[] = [];

      pendingChanges[dateStr].forEach((studentId) => {
        const firstLesson = dayLessons[0];
        const cell = attendanceData[firstLesson.id]?.[studentId];
        if (!cell) return;

        const trimmedNote = cell.note?.trim();
        if (cell.status === 'absent_justified' && !trimmedNote) {
          studentsMissingJustification.push(studentId);
          return;
        }

        dayLessons.forEach((lesson) => {
          attendances.push({
            studentId,
            lessonId: lesson.id,
            isPresent: cell.isPresent,
            absenceType: cell.absenceType,
            note: trimmedNote || undefined,
          });
        });
      });

      if (studentsMissingJustification.length > 0) {
        setJustificationDialog({ studentId: studentsMissingJustification[0], dateStr });
        setSaveError((prev) => ({ ...prev, [dateStr]: t('justificationBeforeSave') }));
        return;
      }

      if (attendances.length === 0) return;

      try {
        setSaveError((prev) => {
          const next = { ...prev };
          delete next[dateStr];
          return next;
        });
        setSaveSuccess((prev) => {
          const next = { ...prev };
          delete next[dateStr];
          return next;
        });

        await onDaySave(dateStr, attendances);

        setPendingChanges((prev) => {
          const next = { ...prev };
          delete next[dateStr];
          return next;
        });
        setSaveSuccess((prev) => ({ ...prev, [dateStr]: true }));
        onSaveSuccess?.(dateStr);

        setTimeout(() => {
          setSaveSuccess((prev) => {
            const next = { ...prev };
            delete next[dateStr];
            return next;
          });
        }, 3000);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('failedToSaveAttendanceDefault');
        setSaveError((prev) => ({ ...prev, [dateStr]: errorMessage }));
        onSaveError?.(dateStr, errorMessage);
      }
    },
    [
      onDaySave,
      pendingChanges,
      attendanceData,
      lessonsByDate,
      setPendingChanges,
      setSaveError,
      setSaveSuccess,
      setJustificationDialog,
      onSaveSuccess,
      onSaveError,
      t,
    ],
  );

  const handleSaveAll = useCallback(async () => {
    const datesWithChanges = Object.keys(pendingChanges).filter(
      (dateStr) => pendingChanges[dateStr]?.size > 0,
    );
    for (const dateStr of datesWithChanges) {
      const date = weekDates.find((d) => formatDateString(d) === dateStr);
      if (date) await handleDaySave(date);
    }
  }, [pendingChanges, handleDaySave, weekDates]);

  return { handleDaySave, handleSaveAll };
}
