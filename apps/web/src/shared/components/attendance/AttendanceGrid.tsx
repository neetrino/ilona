'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { Lesson } from '@/features/lessons';
import type { AbsenceType } from '@/features/attendance';
import type { AttendanceCell, AttendanceStatus, WeekAttendanceStudent } from './week-attendance/types';
import { WeekAttendanceToolbar } from './week-attendance/WeekAttendanceToolbar';
import { WeekAttendanceLegend } from './week-attendance/WeekAttendanceLegend';
import { useAttendanceGrid } from './lesson-attendance/useAttendanceGrid';
import { AttendanceGridTable } from './lesson-attendance/AttendanceGridTable';
import { AttendanceGridDialogs } from './lesson-attendance/AttendanceGridDialogs';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';

interface AttendanceGridProps {
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
  isLoading?: boolean;
  isSaving?: Record<string, boolean>;
  dateRange?: { from: string; to: string };
  onSaveSuccess?: (lessonId: string) => void;
  onSaveError?: (lessonId: string, error: string) => void;
  onUnsavedChangesChange?: (hasUnsavedChanges: boolean) => void;
}

export function AttendanceGrid({
  students,
  lessons,
  initialAttendance = {},
  onCellChange,
  onLessonSave,
  isLoading = false,
  isSaving = {},
  dateRange,
  onSaveSuccess,
  onSaveError,
  onUnsavedChangesChange,
}: AttendanceGridProps) {
  const t = useTranslations('attendance');
  const locale = useLocale();

  const grid = useAttendanceGrid({
    students,
    lessons,
    initialAttendance,
    onCellChange,
    onLessonSave,
    isSaving,
    dateRange,
    onSaveSuccess,
    onSaveError,
    onUnsavedChangesChange,
    t,
    locale,
    isLoading,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <LoadingSpinner size="md" />
          <p className="mt-4 text-sm text-slate-500">{t('loadingAttendanceData')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <WeekAttendanceToolbar
        totalPendingChanges={grid.totalPendingChanges}
        hasAnySaving={grid.hasAnySaving}
        isEditMode={grid.isEditMode}
        saveSuccess={grid.saveSuccess}
        saveError={grid.saveError}
        datesWithChanges={grid.lessonsWithChanges}
        missingJustificationCount={grid.missingJustificationCount}
        onStartEditMode={grid.handleStartEditMode}
        onCancelEditMode={grid.handleCancelEditMode}
        onConfirmEditMode={grid.handleConfirmEditMode}
        onSaveAll={grid.handleSaveAll}
        t={t}
      />

      <AttendanceGridTable
        gridRef={grid.gridRef}
        cellRefs={grid.cellRefs}
        students={students}
        sortedLessons={grid.sortedLessons}
        attendanceData={grid.attendanceData}
        pendingChanges={grid.pendingChanges}
        isSaving={isSaving}
        isEditMode={grid.isEditMode}
        focusedCell={grid.focusedCell}
        getCellStatus={grid.getCellStatus}
        getStatusLabel={grid.getStatusLabel}
        getNextMarkLabel={grid.getNextMarkLabel}
        formatDate={grid.formatDate}
        formatTime={grid.formatTime}
        onToggleCell={grid.toggleCellStatus}
        onKeyDown={grid.handleKeyDown}
        onOpenCommentPreview={(studentId, lessonId) =>
          grid.setCommentPreviewDialog({ studentId, lessonId })
        }
        t={t}
      />

      <AttendanceGridDialogs
        students={students}
        attendanceData={grid.attendanceData}
        justificationDialog={grid.justificationDialog}
        commentPreviewDialog={grid.commentPreviewDialog}
        onJustificationDialogChange={(open) => !open && grid.setJustificationDialog(null)}
        onCommentPreviewDialogChange={(open) => !open && grid.setCommentPreviewDialog(null)}
        onUpdateCellNote={grid.updateCellNote}
        t={t}
      />

      <WeekAttendanceLegend t={t} />
    </div>
  );
}

export type { AttendanceCell, AttendanceStatus, WeekAttendanceStudent } from './week-attendance/types';
