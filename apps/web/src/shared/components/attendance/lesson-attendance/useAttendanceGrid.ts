import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ATTENDANCE_STATUSES,
  type AttendanceCell,
  type AttendanceStatus,
} from '../week-attendance/types';
import { createStatusLabelHelpers } from '../week-attendance/attendance-status';
import type { UseAttendanceGridOptions } from './use-attendance-grid.util';
import {
  clonePendingChanges,
  mergeAttendanceWithPendingChanges,
} from './use-attendance-grid.util';
import { useAttendanceGridSave } from './useAttendanceGridSave';
import { useAttendanceGridKeyboard } from './useAttendanceGridKeyboard';

export type { UseAttendanceGridOptions } from './use-attendance-grid.util';

export function useAttendanceGrid({
  students,
  lessons,
  initialAttendance = {},
  onCellChange,
  onLessonSave,
  isSaving = {},
  dateRange,
  onSaveSuccess,
  onSaveError,
  onUnsavedChangesChange,
  t,
  locale,
  isLoading = false,
}: UseAttendanceGridOptions) {
  const { getStatusLabel, getNextMarkLabel } = useMemo(() => createStatusLabelHelpers(t), [t]);

  const [attendanceData, setAttendanceData] =
    useState<Record<string, Record<string, AttendanceCell>>>(initialAttendance);
  const [focusedCell, setFocusedCell] = useState<{ studentId: string; lessonId: string } | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Record<string, Set<string>>>({});
  const [saveError, setSaveError] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState<Record<string, boolean>>({});
  const [justificationDialog, setJustificationDialog] = useState<{
    studentId: string;
    lessonId: string;
  } | null>(null);
  const [commentPreviewDialog, setCommentPreviewDialog] = useState<{
    studentId: string;
    lessonId: string;
  } | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<Record<string, HTMLTableCellElement>>({});
  const initialDataRef = useRef(initialAttendance);
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
      initialDataRef.current = initialAttendance;
      prevInitialAttendanceRef.current = initialAttendance;
      isInitialMountRef.current = false;
    }
  }, [initialAttendance]);

  useEffect(() => {
    if (isInitialMountRef.current) return;

    if (Object.keys(initialAttendance).length === 0) return;

    const hasAnyPendingChanges = Object.values(pendingChangesRef.current).some((set) => set.size > 0);
    const prevInitial = prevInitialAttendanceRef.current;
    const currentLessonIds = Object.keys(initialAttendance).sort();
    const prevLessonIds = Object.keys(prevInitial).sort();
    const hasStructuralChange =
      currentLessonIds.length !== prevLessonIds.length ||
      currentLessonIds.some((id, idx) => id !== prevLessonIds[idx]);

    if (!hasAnyPendingChanges) {
      setAttendanceData(initialAttendance);
      initialDataRef.current = initialAttendance;
      prevInitialAttendanceRef.current = initialAttendance;
      return;
    }

    if (hasStructuralChange) {
      setAttendanceData(initialAttendance);
      initialDataRef.current = initialAttendance;
      prevInitialAttendanceRef.current = initialAttendance;
      setPendingChanges({});
      setSaveError({});
      setSaveSuccess({});
      return;
    }

    setAttendanceData((prev) =>
      mergeAttendanceWithPendingChanges(initialAttendance, prev, pendingChangesRef.current),
    );
    prevInitialAttendanceRef.current = initialAttendance;
  }, [initialAttendance]);

  const hasUnsavedChanges = useMemo(
    () => Object.values(pendingChanges).some((set) => set.size > 0),
    [pendingChanges],
  );

  useEffect(() => {
    onUnsavedChangesChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onUnsavedChangesChange]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const getCellStatus = useCallback(
    (studentId: string, lessonId: string): AttendanceStatus => {
      const cell = attendanceData[lessonId]?.[studentId];
      if (!cell) return 'not_marked';
      return cell.status;
    },
    [attendanceData],
  );

  const updateCellNote = useCallback((studentId: string, lessonId: string, note: string) => {
    setAttendanceData((prev) => {
      const lessonData = prev[lessonId] || {};
      const existing = lessonData[studentId];
      if (!existing) return prev;
      return {
        ...prev,
        [lessonId]: {
          ...lessonData,
          [studentId]: { ...existing, note },
        },
      };
    });
  }, []);

  const toggleCellStatus = useCallback(
    (studentId: string, lessonId: string) => {
      const currentStatus = getCellStatus(studentId, lessonId);
      const currentIndex = ATTENDANCE_STATUSES.indexOf(currentStatus);
      const newStatus = ATTENDANCE_STATUSES[(currentIndex + 1) % ATTENDANCE_STATUSES.length];

      setAttendanceData((prev) => {
        const lessonData = prev[lessonId] || {};
        const existingCell = lessonData[studentId];
        return {
          ...prev,
          [lessonId]: {
            ...lessonData,
            [studentId]: {
              studentId,
              lessonId,
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
                  : existingCell?.note,
            },
          },
        };
      });

      if (newStatus === 'absent_justified') {
        setJustificationDialog({ studentId, lessonId });
      } else if (
        justificationDialog?.studentId === studentId &&
        justificationDialog.lessonId === lessonId
      ) {
        setJustificationDialog(null);
      }

      setPendingChanges((prev) => {
        const lessonChanges = prev[lessonId] || new Set();
        return { ...prev, [lessonId]: new Set(lessonChanges).add(studentId) };
      });

      setSaveSuccess((prev) => {
        const next = { ...prev };
        delete next[lessonId];
        return next;
      });
      setSaveError((prev) => {
        const next = { ...prev };
        delete next[lessonId];
        return next;
      });

      onCellChange?.(studentId, lessonId, newStatus);
    },
    [getCellStatus, onCellChange, justificationDialog],
  );

  const { handleManualSave, handleSaveAll } = useAttendanceGridSave({
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
  });

  const handleStartEditMode = useCallback(() => {
    editSnapshotRef.current = {
      attendanceData: JSON.parse(JSON.stringify(attendanceData)) as Record<
        string,
        Record<string, AttendanceCell>
      >,
      pendingChanges: clonePendingChanges(pendingChanges),
    };
    setSaveError({});
    setSaveSuccess({});
    setIsEditMode(true);
  }, [attendanceData, pendingChanges]);

  const handleCancelEditMode = useCallback(() => {
    if (editSnapshotRef.current) {
      setAttendanceData(editSnapshotRef.current.attendanceData);
      setPendingChanges(clonePendingChanges(editSnapshotRef.current.pendingChanges));
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

  useEffect(() => {
    if (focusedCell) {
      const cellKey = `${focusedCell.studentId}-${focusedCell.lessonId}`;
      const cellElement = cellRefs.current[cellKey];
      if (cellElement && gridRef.current) {
        cellElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        cellElement.focus();
      }
    }
  }, [focusedCell]);

  const filteredLessons = useMemo(() => {
    if (!dateRange) return lessons;
    return lessons.filter((lesson) => {
      const lessonDate = new Date(lesson.scheduledAt).toISOString().split('T')[0];
      return lessonDate === dateRange.from;
    });
  }, [lessons, dateRange]);

  const sortedLessons = useMemo(
    () =>
      [...filteredLessons].sort(
        (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      ),
    [filteredLessons],
  );

  const handleKeyDown = useAttendanceGridKeyboard({
    students,
    sortedLessons,
    isLoading,
    isSaving,
    isEditMode,
    toggleCellStatus,
    setFocusedCell,
  });

  const formatDate = useCallback(
    (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    },
    [locale],
  );

  const formatTime = useCallback(
    (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    },
    [locale],
  );

  const totalPendingChanges = Object.values(pendingChanges).reduce((sum, set) => sum + set.size, 0);
  const hasAnySaving = Object.values(isSaving).some((saving) => saving);
  const lessonsWithChanges = Object.keys(pendingChanges).filter(
    (lessonId) => pendingChanges[lessonId] && pendingChanges[lessonId].size > 0,
  );
  const missingJustificationCount = Object.entries(pendingChanges).reduce((sum, [lessonId, studentIds]) => {
    studentIds.forEach((studentId) => {
      const cell = attendanceData[lessonId]?.[studentId];
      if (cell?.status === 'absent_justified' && !cell.note?.trim()) sum += 1;
    });
    return sum;
  }, 0);

  return {
    gridRef,
    cellRefs,
    attendanceData,
    pendingChanges,
    saveError,
    saveSuccess,
    focusedCell,
    justificationDialog,
    setJustificationDialog,
    commentPreviewDialog,
    setCommentPreviewDialog,
    isEditMode,
    sortedLessons,
    getCellStatus,
    toggleCellStatus,
    handleManualSave,
    handleSaveAll,
    handleStartEditMode,
    handleCancelEditMode,
    handleConfirmEditMode,
    updateCellNote,
    handleKeyDown,
    getStatusLabel,
    getNextMarkLabel,
    formatDate,
    formatTime,
    totalPendingChanges,
    hasAnySaving,
    lessonsWithChanges,
    missingJustificationCount,
  };
}
