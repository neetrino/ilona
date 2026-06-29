'use client';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { Pencil, X } from 'lucide-react';
import {
  ATTENDANCE_EDIT_ICON_BUTTON_CLASS,
  ATTENDANCE_PRIMARY_BUTTON_CLASS,
} from '@/shared/components/attendance/attendance-button-theme';

interface WeekAttendanceToolbarProps {
  totalPendingChanges: number;
  hasAnySaving: boolean;
  isEditMode: boolean;
  saveSuccess: Record<string, boolean>;
  saveError: Record<string, string>;
  datesWithChanges: string[];
  missingJustificationCount: number;
  onStartEditMode: () => void;
  onCancelEditMode: () => void;
  onConfirmEditMode: () => void;
  onSaveAll: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export function WeekAttendanceToolbar({
  totalPendingChanges,
  hasAnySaving,
  isEditMode,
  saveSuccess,
  saveError,
  datesWithChanges,
  missingJustificationCount,
  onStartEditMode,
  onCancelEditMode,
  onConfirmEditMode,
  onSaveAll,
  t,
}: WeekAttendanceToolbarProps) {
  return (
    <>
      <div
        className={cn(
          'flex items-center justify-between rounded-lg border-2 px-5 py-4 text-sm transition-all',
          totalPendingChanges > 0
            ? 'border-amber-300 bg-amber-50'
            : hasAnySaving
              ? 'border-primary/30 bg-primary/10'
              : Object.keys(saveSuccess).length > 0
                ? 'border-green-300 bg-green-50'
                : 'border-slate-200 bg-slate-50',
        )}
      >
        <div className="flex flex-1 items-center gap-4">
          {hasAnySaving ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
              <span className="text-base font-semibold text-primary">{t('savingChanges')}</span>
            </>
          ) : totalPendingChanges > 0 ? (
            <>
              <div className="h-4 w-4 animate-pulse rounded-full bg-amber-500" />
              <div>
                <span className="block text-base font-bold text-amber-800">
                  {t('unsavedChangesCount', { count: totalPendingChanges })}
                </span>
                <span className="mt-0.5 block text-xs text-amber-700">{t('clickSaveAllHint')}</span>
              </div>
            </>
          ) : isEditMode ? (
            <span className="text-base font-semibold text-primary">{t('editingModeEnabled')}</span>
          ) : Object.keys(saveSuccess).length > 0 ? (
            <>
              <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-base font-semibold text-green-800">{t('allChangesSaved')}</span>
            </>
          ) : (
            <span className="text-sm text-slate-600">{t('noUnsavedChanges')}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            size="icon"
            variant={isEditMode ? 'destructive' : 'outline'}
            className={ATTENDANCE_EDIT_ICON_BUTTON_CLASS}
            onClick={isEditMode ? onCancelEditMode : onStartEditMode}
            title={isEditMode ? t('cancelEditing') : t('enableEditing')}
            aria-label={isEditMode ? t('cancelEditing') : t('enableEditing')}
          >
            {isEditMode ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          </Button>
          {Object.keys(saveError).length > 0 && (
            <span className="rounded bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
              {Object.values(saveError)[0]}{' '}
              {Object.keys(saveError).length > 1 &&
                t('errorsMore', { count: Object.keys(saveError).length - 1 })}
            </span>
          )}
          {isEditMode && (
            <Button
              onClick={onConfirmEditMode}
              disabled={hasAnySaving || missingJustificationCount > 0}
              className={cn(ATTENDANCE_PRIMARY_BUTTON_CLASS, 'px-6 text-base')}
              size="lg"
            >
              {t('confirmChanges')}
            </Button>
          )}
          {isEditMode && totalPendingChanges > 0 && !hasAnySaving && (
            <Button
              onClick={onSaveAll}
              disabled={datesWithChanges.length === 0 || hasAnySaving || missingJustificationCount > 0}
              className={cn(ATTENDANCE_PRIMARY_BUTTON_CLASS, 'px-6 text-base')}
              size="lg"
            >
              {t('saveAllChanges')}
            </Button>
          )}
        </div>
      </div>

      {missingJustificationCount > 0 && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {t('justificationPending', { count: missingJustificationCount })}
        </div>
      )}
    </>
  );
}
