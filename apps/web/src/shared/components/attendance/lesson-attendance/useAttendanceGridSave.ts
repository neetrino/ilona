import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { AbsenceType } from '@/features/attendance';
import type { AttendanceCell } from '../week-attendance/types';
import type { AttendanceGridPendingChanges } from './use-attendance-grid.util';

interface UseAttendanceGridSaveOptions {
  onLessonSave?: (
    lessonId: string,
    attendances: Array<{
      studentId: string;
      isPresent: boolean;
      absenceType?: AbsenceType;
      note?: string;
    }>,
  ) => Promise<void>;
  pendingChanges: AttendanceGridPendingChanges;
  attendanceData: Record<string, Record<string, AttendanceCell>>;
  setPendingChanges: Dispatch<SetStateAction<AttendanceGridPendingChanges>>;
  setSaveError: Dispatch<SetStateAction<Record<string, string>>>;
  setSaveSuccess: Dispatch<SetStateAction<Record<string, boolean>>>;
  setFocusedCell: Dispatch<SetStateAction<{ studentId: string; lessonId: string } | null>>;
  setJustificationDialog: Dispatch<
    SetStateAction<{ studentId: string; lessonId: string } | null>
  >;
  onSaveSuccess?: (lessonId: string) => void;
  onSaveError?: (lessonId: string, error: string) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export function useAttendanceGridSave({
  onLessonSave,
  pendingChanges,
  attendanceData,
  setPendingChanges,
  setSaveError,
  setSaveSuccess,
  setFocusedCell,
  setJustificationDialog,
  onSaveSuccess,
  onSaveError,
  t,
}: UseAttendanceGridSaveOptions) {
  const handleManualSave = useCallback(
    async (lessonId: string) => {
      if (!onLessonSave || !pendingChanges[lessonId] || pendingChanges[lessonId].size === 0) return;

      const attendances: Array<{
        studentId: string;
        isPresent: boolean;
        absenceType?: AbsenceType;
        note?: string;
      }> = [];
      const studentsMissingJustification: string[] = [];

      pendingChanges[lessonId].forEach((studentId) => {
        const cell = attendanceData[lessonId]?.[studentId];
        if (!cell) return;
        const trimmedNote = cell.note?.trim();
        if (cell.status === 'absent_justified' && !trimmedNote) {
          studentsMissingJustification.push(studentId);
          return;
        }
        attendances.push({
          studentId,
          isPresent: cell.isPresent,
          absenceType: cell.absenceType,
          note: trimmedNote || undefined,
        });
      });

      if (studentsMissingJustification.length > 0) {
        const firstStudentId = studentsMissingJustification[0];
        setFocusedCell({ studentId: firstStudentId, lessonId });
        setJustificationDialog({ studentId: firstStudentId, lessonId });
        setSaveError((prev) => ({ ...prev, [lessonId]: t('justificationBeforeSave') }));
        return;
      }

      if (attendances.length === 0) return;

      try {
        setSaveError((prev) => {
          const next = { ...prev };
          delete next[lessonId];
          return next;
        });
        setSaveSuccess((prev) => {
          const next = { ...prev };
          delete next[lessonId];
          return next;
        });

        await onLessonSave(lessonId, attendances);

        setPendingChanges((prev) => {
          const next = { ...prev };
          delete next[lessonId];
          return next;
        });
        setSaveSuccess((prev) => ({ ...prev, [lessonId]: true }));
        onSaveSuccess?.(lessonId);

        setTimeout(() => {
          setSaveSuccess((prev) => {
            const next = { ...prev };
            delete next[lessonId];
            return next;
          });
        }, 3000);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t('failedToSaveAttendanceDefault');
        setSaveError((prev) => ({ ...prev, [lessonId]: errorMessage }));
        onSaveError?.(lessonId, errorMessage);
        console.error('Save failed:', error);
      }
    },
    [
      onLessonSave,
      pendingChanges,
      attendanceData,
      setPendingChanges,
      setSaveError,
      setSaveSuccess,
      setFocusedCell,
      setJustificationDialog,
      onSaveSuccess,
      onSaveError,
      t,
    ],
  );

  const handleSaveAll = useCallback(async () => {
    const lessonsWithChanges = Object.keys(pendingChanges).filter(
      (lessonId) => pendingChanges[lessonId]?.size > 0,
    );
    for (const lessonId of lessonsWithChanges) {
      await handleManualSave(lessonId);
    }
  }, [pendingChanges, handleManualSave]);

  return { handleManualSave, handleSaveAll };
}
