import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Lesson } from '@/features/lessons';
import { formatDateString } from '@/features/attendance/utils/dateUtils';
import { ATTENDANCE_STATUSES, type AttendanceCell, type AttendanceStatus } from './types';
import { createStatusLabelHelpers } from './attendance-status';
import type { UseWeekAttendanceGridOptions } from './use-week-attendance-grid.util';
import {
  cloneWeekPendingChanges,
  mergeWeekAttendanceWithPendingChanges,
} from './use-week-attendance-grid.util';
import { useWeekAttendanceGridSave } from './useWeekAttendanceGridSave';

export type { UseWeekAttendanceGridOptions } from './use-week-attendance-grid.util';

export function useWeekAttendanceGrid({
  lessons,
  initialAttendance = {},
  onDaySave,
  isSaving = {},
  weekDates,
  onUnsavedChangesChange,
  onSaveSuccess,
  onSaveError,
  t,
}: UseWeekAttendanceGridOptions) {
  const { getStatusLabel, getNextMarkLabel } = useMemo(() => createStatusLabelHelpers(t), [t]);

  const [attendanceData, setAttendanceData] =
    useState<Record<string, Record<string, AttendanceCell>>>(initialAttendance);
  const [pendingChanges, setPendingChanges] = useState<Record<string, Set<string>>>({});
  const [saveError, setSaveError] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState<Record<string, boolean>>({});
  const [justificationDialog, setJustificationDialog] = useState<{
    studentId: string;
    dateStr: string;
  } | null>(null);
  const [commentPreviewDialog, setCommentPreviewDialog] = useState<{
    studentId: string;
    dateStr: string;
  } | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);
  const prevInitialAttendanceRef = useRef(initialAttendance);
  const isInitialMountRef = useRef(true);
  const pendingChangesRef = useRef<Record<string, Set<string>>>({});
  const editSnapshotRef = useRef<{
    attendanceData: Record<string, Record<string, AttendanceCell>>;
    pendingChanges: Record<string, Set<string>>;
  } | null>(null);

  useEffect(() => {
    pendingChangesRef.current = pendingChanges;
  }, [pendingChanges]);

  useEffect(() => {
    if (isInitialMountRef.current && Object.keys(initialAttendance).length > 0) {
      setAttendanceData(initialAttendance);
      prevInitialAttendanceRef.current = initialAttendance;
      isInitialMountRef.current = false;
    }
  }, [initialAttendance]);

  useEffect(() => {
    if (isInitialMountRef.current || Object.keys(initialAttendance).length === 0) return;

    const hasAnyPendingChanges = Object.values(pendingChangesRef.current).some((set) => set.size > 0);
    const prevInitial = prevInitialAttendanceRef.current;
    const currentLessonIds = Object.keys(initialAttendance).sort();
    const prevLessonIds = Object.keys(prevInitial).sort();
    const hasStructuralChange =
      currentLessonIds.length !== prevLessonIds.length ||
      currentLessonIds.some((id, idx) => id !== prevLessonIds[idx]);

    if (!hasAnyPendingChanges) {
      setAttendanceData(initialAttendance);
      prevInitialAttendanceRef.current = initialAttendance;
      return;
    }

    if (hasStructuralChange) {
      setAttendanceData(initialAttendance);
      prevInitialAttendanceRef.current = initialAttendance;
      setPendingChanges({});
      setSaveError({});
      setSaveSuccess({});
      return;
    }

    setAttendanceData((prev) =>
      mergeWeekAttendanceWithPendingChanges(initialAttendance, prev, pendingChangesRef.current, lessons),
    );
    prevInitialAttendanceRef.current = initialAttendance;
  }, [initialAttendance, lessons]);

  const hasUnsavedChanges = useMemo(
    () => Object.values(pendingChanges).some((set) => set.size > 0),
    [pendingChanges],
  );

  useEffect(() => {
    onUnsavedChangesChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onUnsavedChangesChange]);

  const lessonsByDate = useMemo(() => {
    const grouped: Record<string, Lesson[]> = {};
    weekDates.forEach((date) => {
      const dateStr = formatDateString(date);
      grouped[dateStr] = lessons.filter((lesson) => {
        const lessonDate = new Date(lesson.scheduledAt).toISOString().split('T')[0];
        return lessonDate === dateStr;
      });
    });
    return grouped;
  }, [lessons, weekDates]);

  const updateDayNote = useCallback(
    (studentId: string, dateStr: string, note: string) => {
      const dayLessons = lessonsByDate[dateStr] || [];
      setAttendanceData((prev) => {
        const updated = { ...prev };
        dayLessons.forEach((lesson) => {
          const existing = updated[lesson.id]?.[studentId];
          if (!existing) return;
          updated[lesson.id] = {
            ...updated[lesson.id],
            [studentId]: { ...existing, note },
          };
        });
        return updated;
      });
    },
    [lessonsByDate],
  );

  const getCellStatus = useCallback(
    (studentId: string, date: Date): { status: AttendanceStatus; lessonId: string | null } => {
      const dateStr = formatDateString(date);
      const dayLessons = lessonsByDate[dateStr] || [];
      if (dayLessons.length === 0) return { status: 'not_marked', lessonId: null };
      const firstLesson = dayLessons[0];
      const cell = attendanceData[firstLesson.id]?.[studentId];
      if (!cell) return { status: 'not_marked', lessonId: firstLesson.id };
      return { status: cell.status, lessonId: firstLesson.id };
    },
    [attendanceData, lessonsByDate],
  );

  const toggleCellStatus = useCallback(
    (studentId: string, date: Date) => {
      const dateStr = formatDateString(date);
      const dayLessons = lessonsByDate[dateStr] || [];
      if (dayLessons.length === 0) return;

      const currentStatus = getCellStatus(studentId, date);
      const currentIndex = ATTENDANCE_STATUSES.indexOf(currentStatus.status);
      const newStatus = ATTENDANCE_STATUSES[(currentIndex + 1) % ATTENDANCE_STATUSES.length];

      setAttendanceData((prev) => {
        const updated = { ...prev };
        dayLessons.forEach((lesson) => {
          if (!updated[lesson.id]) updated[lesson.id] = {};
          updated[lesson.id] = {
            ...updated[lesson.id],
            [studentId]: {
              studentId,
              lessonId: lesson.id,
              status: newStatus,
              isPresent: newStatus === 'present',
              absenceType:
                newStatus === 'absent_justified'
                  ? 'JUSTIFIED'
                  : newStatus === 'absent_unjustified'
                    ? 'UNJUSTIFIED'
                    : undefined,
              note:
                newStatus === 'present' || newStatus === 'not_marked'
                  ? undefined
                  : updated[lesson.id]?.[studentId]?.note,
            },
          };
        });
        return updated;
      });

      setPendingChanges((prev) => {
        const dateChanges = prev[dateStr] || new Set();
        return { ...prev, [dateStr]: new Set(dateChanges).add(studentId) };
      });

      setSaveSuccess((prev) => {
        const next = { ...prev };
        delete next[dateStr];
        return next;
      });
      setSaveError((prev) => {
        const next = { ...prev };
        delete next[dateStr];
        return next;
      });

      if (newStatus === 'absent_justified') {
        setJustificationDialog({ studentId, dateStr });
      } else if (justificationDialog?.studentId === studentId && justificationDialog.dateStr === dateStr) {
        setJustificationDialog(null);
      }
    },
    [getCellStatus, lessonsByDate, justificationDialog],
  );

  const { handleDaySave, handleSaveAll } = useWeekAttendanceGridSave({
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
  });

  const handleStartEditMode = useCallback(() => {
    editSnapshotRef.current = {
      attendanceData: JSON.parse(JSON.stringify(attendanceData)) as Record<
        string,
        Record<string, AttendanceCell>
      >,
      pendingChanges: cloneWeekPendingChanges(pendingChanges),
    };
    setSaveError({});
    setSaveSuccess({});
    setIsEditMode(true);
  }, [attendanceData, pendingChanges]);

  const handleCancelEditMode = useCallback(() => {
    if (editSnapshotRef.current) {
      setAttendanceData(editSnapshotRef.current.attendanceData);
      setPendingChanges(cloneWeekPendingChanges(editSnapshotRef.current.pendingChanges));
    }
    setJustificationDialog(null);
    setSaveError({});
    setSaveSuccess({});
    setIsEditMode(false);
  }, []);

  const handleConfirmEditMode = useCallback(async () => {
    if (Object.values(pendingChanges).some((set) => set.size > 0)) {
      await handleSaveAll();
      const stillHasPending = Object.values(pendingChangesRef.current).some((set) => set.size > 0);
      if (stillHasPending) return;
    }
    editSnapshotRef.current = null;
    setIsEditMode(false);
  }, [pendingChanges, handleSaveAll]);

  const totalPendingChanges = Object.values(pendingChanges).reduce((sum, set) => sum + set.size, 0);
  const hasAnySaving = Object.values(isSaving).some((saving) => saving);
  const datesWithChanges = Object.keys(pendingChanges).filter(
    (dateStr) => pendingChanges[dateStr]?.size > 0,
  );
  const missingJustificationCount = Object.entries(pendingChanges).reduce((sum, [dateStr, studentIds]) => {
    const dayLessons = lessonsByDate[dateStr] || [];
    if (dayLessons.length === 0) return sum;
    const firstLessonId = dayLessons[0].id;
    studentIds.forEach((studentId) => {
      const cell = attendanceData[firstLessonId]?.[studentId];
      if (cell?.status === 'absent_justified' && !cell.note?.trim()) sum += 1;
    });
    return sum;
  }, 0);

  return {
    gridRef,
    attendanceData,
    pendingChanges,
    saveError,
    saveSuccess,
    justificationDialog,
    setJustificationDialog,
    commentPreviewDialog,
    setCommentPreviewDialog,
    isEditMode,
    lessonsByDate,
    getCellStatus,
    toggleCellStatus,
    handleDaySave,
    handleSaveAll,
    handleStartEditMode,
    handleCancelEditMode,
    handleConfirmEditMode,
    updateDayNote,
    getStatusLabel,
    getNextMarkLabel,
    totalPendingChanges,
    hasAnySaving,
    datesWithChanges,
    missingJustificationCount,
  };
}
