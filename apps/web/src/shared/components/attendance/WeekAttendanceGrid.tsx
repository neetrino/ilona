'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { Lesson } from '@/features/lessons';
import type { AbsenceType } from '@/features/attendance';
import type { AttendanceCell, WeekAttendanceStudent } from './week-attendance/types';
import { useWeekAttendanceGrid } from './week-attendance/useWeekAttendanceGrid';
import { WeekAttendanceToolbar } from './week-attendance/WeekAttendanceToolbar';
import { WeekAttendanceGridTable } from './week-attendance/WeekAttendanceGridTable';
import { WeekAttendanceDialogs } from './week-attendance/WeekAttendanceDialogs';
import { WeekAttendanceLegend } from './week-attendance/WeekAttendanceLegend';

interface WeekAttendanceGridProps {
  students: WeekAttendanceStudent[];
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
  isLoading?: boolean;
  isSaving?: Record<string, boolean>;
  weekDates: Date[];
  onUnsavedChangesChange?: (hasUnsavedChanges: boolean) => void;
  onSaveSuccess?: (date: string) => void;
  onSaveError?: (date: string, error: string) => void;
}

export function WeekAttendanceGrid({
  students,
  lessons,
  initialAttendance = {},
  onDaySave,
  isLoading = false,
  isSaving = {},
  weekDates,
  onUnsavedChangesChange,
  onSaveSuccess,
  onSaveError,
}: WeekAttendanceGridProps) {
  const t = useTranslations('attendance');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const grid = useWeekAttendanceGrid({
    lessons,
    initialAttendance,
    onDaySave,
    isSaving,
    weekDates,
    onUnsavedChangesChange,
    onSaveSuccess,
    onSaveError,
    t,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
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
        datesWithChanges={grid.datesWithChanges}
        missingJustificationCount={grid.missingJustificationCount}
        onStartEditMode={grid.handleStartEditMode}
        onCancelEditMode={grid.handleCancelEditMode}
        onConfirmEditMode={grid.handleConfirmEditMode}
        onSaveAll={grid.handleSaveAll}
        t={t}
      />

      <WeekAttendanceGridTable
        gridRef={grid.gridRef}
        students={students}
        weekDates={weekDates}
        locale={locale}
        lessonsByDate={grid.lessonsByDate}
        attendanceData={grid.attendanceData}
        pendingChanges={grid.pendingChanges}
        isSaving={isSaving}
        isEditMode={grid.isEditMode}
        getCellStatus={grid.getCellStatus}
        getStatusLabel={grid.getStatusLabel}
        getNextMarkLabel={grid.getNextMarkLabel}
        onToggleCell={grid.toggleCellStatus}
        onDaySave={grid.handleDaySave}
        onOpenCommentPreview={(studentId, dateStr) =>
          grid.setCommentPreviewDialog({ studentId, dateStr })
        }
        t={t}
        tCommon={tCommon}
      />

      <WeekAttendanceDialogs
        students={students}
        lessonsByDate={grid.lessonsByDate}
        attendanceData={grid.attendanceData}
        justificationDialog={grid.justificationDialog}
        commentPreviewDialog={grid.commentPreviewDialog}
        onJustificationDialogChange={(open) => !open && grid.setJustificationDialog(null)}
        onCommentPreviewDialogChange={(open) => !open && grid.setCommentPreviewDialog(null)}
        onUpdateDayNote={grid.updateDayNote}
        t={t}
      />

      <WeekAttendanceLegend t={t} />
    </div>
  );
}

export type { AttendanceCell, WeekAttendanceStudent } from './week-attendance/types';
