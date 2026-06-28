'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { type TimeFilterMode } from '@/shared/lib/analytics-time-range';
import { DatePickerInput } from '@/shared/components/ui';
import { StudentAnimatedPillSwitcher, StudentDatePicker } from '@/features/student-ui';
import {
  getSegmentedIndicatorStyle,
  SEGMENTED_TOGGLE_BUTTON_ACTIVE_CLASS,
  SEGMENTED_TOGGLE_BUTTON_INACTIVE_CLASS,
  SEGMENTED_TOGGLE_GRID_BUTTON_CLASS,
  SEGMENTED_TOGGLE_GRID_TRACK_CLASS,
  SEGMENTED_TOGGLE_INDICATOR_CLASS,
  SEGMENTED_TOGGLE_TRACK_PADDING_PX,
} from '@/shared/components/ui/segmented-toggle-theme';
import { ADMIN_DATE_INPUT_CLASS, ADMIN_PRIMARY_BUTTON_CLASS } from '@/shared/lib/admin-control-theme';

type ApplyAction = {
  onApply: () => void;
  hasUnsavedChanges: boolean;
  /** If false, Apply is disabled; defaults to hasUnsavedChanges. */
  applyDisabled?: boolean;
};

type AnalyticsTimeFilterBarProps = {
  mode: TimeFilterMode;
  onModeChange: (m: TimeFilterMode) => void;
  dayYmd: string;
  onDayYmdChange: (v: string) => void;
  weekAnchorYmd: string;
  onWeekAnchorYmdChange: (v: string) => void;
  customFromYmd: string;
  customToYmd: string;
  onCustomFromYmd: (v: string) => void;
  onCustomToYmd: (v: string) => void;
  className?: string;
  /** Student dashboard color system */
  variant?: 'default' | 'student' | 'admin';
  /** When set, shows an Apply control (used when API requests must not run until explicit confirm). */
  applyAction?: ApplyAction;
};

export function AnalyticsTimeFilterBar({
  mode,
  onModeChange,
  dayYmd,
  onDayYmdChange,
  weekAnchorYmd,
  onWeekAnchorYmdChange,
  customFromYmd,
  customToYmd,
  onCustomFromYmd,
  onCustomToYmd,
  className,
  variant = 'default',
  applyAction,
}: AnalyticsTimeFilterBarProps) {
  const t = useTranslations('analytics');
  const isStudent = variant === 'student';
  const isAdmin = variant === 'admin';
  const usesGroupAccent = isStudent || isAdmin;
  const isPillModeToggle = isStudent;
  const modeTrackRef = useRef<HTMLDivElement | null>(null);
  const modeButtonRefs = useRef<Record<TimeFilterMode, HTMLButtonElement | null>>({
    day: null,
    week: null,
    date: null,
  });
  const [modeIndicator, setModeIndicator] = useState({ x: 0, width: 0, visible: false });
  const modes: { id: TimeFilterMode; label: string }[] = [
    { id: 'day', label: t('timeFilterDay') },
    { id: 'week', label: t('timeFilterWeek') },
    { id: 'date', label: t('timeFilterDate') },
  ];

  useEffect(() => {
    if (isStudent) return;

    const syncModeIndicator = () => {
      const activeModeEl = modeButtonRefs.current[mode];
      const trackEl = modeTrackRef.current;
      if (!activeModeEl || !trackEl) {
        setModeIndicator((prev) => ({ ...prev, visible: false }));
        return;
      }
      setModeIndicator({
        x: activeModeEl.offsetLeft,
        width: activeModeEl.offsetWidth,
        visible: true,
      });
    };

    syncModeIndicator();
    window.addEventListener('resize', syncModeIndicator);
    return () => window.removeEventListener('resize', syncModeIndicator);
  }, [mode, isStudent]);

  const adminDatePickerClassName = cn(
    'rounded-[0.875rem] border bg-white px-2 py-1.5',
    usesGroupAccent
      ? 'border-[rgba(14,14,16,0.07)] text-[#3b3b40] focus:border-[#1010a3] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/15'
      : 'rounded-md border-slate-200 text-slate-800',
  );
  const adminDateRowClassName = 'flex w-full min-w-0 flex-nowrap items-center gap-1.5 sm:w-auto sm:gap-2';
  const adminDateLabelClassName = cn(
    'shrink-0 whitespace-nowrap',
    usesGroupAccent ? 'text-[#8b8b90]' : 'text-slate-500',
  );
  const adminDateFieldWrapClassName = 'min-w-0 flex-1 basis-0 sm:min-w-[9.5rem] sm:flex-none';
  const adminDateInputClassName = isAdmin
    ? cn(ADMIN_DATE_INPUT_CLASS, 'min-w-0 pl-2 pr-8')
    : cn(adminDatePickerClassName, 'min-w-0 pl-2 pr-8');
  const selectedModeIndex = Math.max(0, modes.findIndex((m) => m.id === mode));
  const studentDateFieldWrapClassName = 'min-w-0 flex-1 basis-0 sm:flex-none sm:basis-auto';
  const isSingleDateMode = mode === 'day' || mode === 'week';
  const inlineApplyWithDate = Boolean(applyAction && isSingleDateMode);
  const singleDateRowClassName = cn(
    'flex min-w-0 flex-nowrap items-center gap-1.5 sm:gap-2',
    inlineApplyWithDate ? 'flex-1' : 'w-full sm:w-auto',
  );

  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-3 rounded-xl border p-4 pb-6 sm:flex-row sm:items-end sm:justify-between sm:pb-7',
        usesGroupAccent
          ? 'border-[rgba(14,14,16,0.07)] bg-[#fafafa]'
          : 'border-slate-200 bg-slate-50/80',
        className,
      )}
    >
      {isStudent ? (
        <StudentAnimatedPillSwitcher
          options={modes.map((m) => ({ value: m.id, label: m.label }))}
          value={mode}
          onChange={onModeChange}
          shape="rectangular"
          size="md"
          className="w-full sm:w-auto"
        />
      ) : isAdmin ? (
      <div
        className={cn(SEGMENTED_TOGGLE_GRID_TRACK_CLASS, 'w-full sm:w-auto')}
        style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
      >
        <span
          aria-hidden
          className={SEGMENTED_TOGGLE_INDICATOR_CLASS}
          style={getSegmentedIndicatorStyle(
            selectedModeIndex,
            modes.length,
            SEGMENTED_TOGGLE_TRACK_PADDING_PX,
          )}
        />
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onModeChange(m.id)}
            className={cn(
              SEGMENTED_TOGGLE_GRID_BUTTON_CLASS,
              mode === m.id
                ? SEGMENTED_TOGGLE_BUTTON_ACTIVE_CLASS
                : SEGMENTED_TOGGLE_BUTTON_INACTIVE_CLASS,
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
      ) : (
      <div
        className={cn(
          'relative grid w-full grid-cols-3 items-center p-1 sm:w-auto',
          isPillModeToggle
            ? 'rounded-full border border-[rgba(14,14,16,0.07)] bg-[#f6f6f7]'
            : usesGroupAccent
              ? 'rounded-lg border border-[rgba(14,14,16,0.07)] bg-[#f6f6f7]'
              : 'rounded-lg border border-slate-200 bg-slate-50',
        )}
        ref={modeTrackRef}
      >
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute left-0 top-1 z-0 h-8 transition-[transform,width,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
            isPillModeToggle
              ? 'rounded-full bg-[#1010a3]'
              : usesGroupAccent
                ? 'rounded-md bg-[#1010a3] shadow-sm'
                : 'rounded-md bg-primary shadow-sm',
          )}
          style={{
            width: `${modeIndicator.width}px`,
            transform: `translateX(${modeIndicator.x}px)`,
            opacity: modeIndicator.visible ? 1 : 0,
          }}
        />
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onModeChange(m.id)}
            ref={(node) => {
              modeButtonRefs.current[m.id] = node;
            }}
            className={cn(
              'relative z-10 inline-flex h-8 min-w-0 items-center justify-center px-3 text-center text-sm font-semibold transition-colors duration-300 sm:min-w-[5.75rem]',
              isPillModeToggle ? 'rounded-full font-medium' : 'rounded-md',
              mode === m.id
                ? 'text-white'
                : usesGroupAccent
                  ? 'text-[#3b3b40] hover:text-[#1010a3]'
                  : 'text-slate-600 hover:text-slate-800',
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
      )}

      <div
        className={cn(
          'flex min-w-0 w-full gap-3 text-sm sm:w-auto',
          inlineApplyWithDate ? 'flex-nowrap items-end' : 'flex-wrap items-center',
          usesGroupAccent ? 'text-[#3b3b40]' : 'text-slate-600',
        )}
      >
        {mode === 'day' && (
          <label className={singleDateRowClassName}>
            <span className={adminDateLabelClassName}>{t('timeFilterSelectDay')}</span>
            <div className={isStudent ? studentDateFieldWrapClassName : adminDateFieldWrapClassName}>
              {isStudent ? (
                <StudentDatePicker
                  className="w-full min-w-0 sm:w-auto"
                  value={dayYmd}
                  onValueChange={onDayYmdChange}
                />
              ) : (
                <DatePickerInput
                  className={adminDateInputClassName}
                  value={dayYmd}
                  onValueChange={onDayYmdChange}
                />
              )}
            </div>
          </label>
        )}
        {mode === 'week' && (
          <label className={singleDateRowClassName}>
            <span className={adminDateLabelClassName}>{t('timeFilterSelectWeek')}</span>
            <div className={isStudent ? studentDateFieldWrapClassName : adminDateFieldWrapClassName}>
              {isStudent ? (
                <StudentDatePicker
                  className="w-full min-w-0 sm:w-auto"
                  value={weekAnchorYmd}
                  onValueChange={onWeekAnchorYmdChange}
                />
              ) : (
                <DatePickerInput
                  className={adminDateInputClassName}
                  value={weekAnchorYmd}
                  onValueChange={onWeekAnchorYmdChange}
                />
              )}
            </div>
          </label>
        )}
        {mode === 'date' && isStudent ? (
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
            <label className="flex w-full flex-col gap-1.5 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
              <span className="whitespace-nowrap text-[#8b8b90]">{t('timeFilterFrom')}</span>
              <StudentDatePicker
                className="w-full sm:w-auto"
                value={customFromYmd}
                onValueChange={onCustomFromYmd}
              />
            </label>
            <label className="flex w-full flex-col gap-1.5 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
              <span className="whitespace-nowrap text-[#8b8b90]">{t('timeFilterTo')}</span>
              <StudentDatePicker
                className="w-full sm:w-auto"
                value={customToYmd}
                onValueChange={onCustomToYmd}
              />
            </label>
          </div>
        ) : null}
        {mode === 'date' && !isStudent && (
          <div className={adminDateRowClassName}>
            <span className={adminDateLabelClassName}>{t('timeFilterFrom')}</span>
            <div className={adminDateFieldWrapClassName}>
              <DatePickerInput
                className={adminDateInputClassName}
                value={customFromYmd}
                onValueChange={onCustomFromYmd}
              />
            </div>
            <span className={adminDateLabelClassName}>{t('timeFilterTo')}</span>
            <div className={adminDateFieldWrapClassName}>
              <DatePickerInput
                className={adminDateInputClassName}
                value={customToYmd}
                onValueChange={onCustomToYmd}
              />
            </div>
          </div>
        )}

        {applyAction && (
          <div
            className={cn(
              'relative flex min-w-0 flex-col sm:items-end sm:self-end sm:pl-2',
              inlineApplyWithDate ? 'shrink-0 items-stretch' : 'items-stretch',
              mode === 'date' && 'ml-auto',
            )}
          >
            <button
              type="button"
              onClick={applyAction.onApply}
              disabled={applyAction.applyDisabled ?? !applyAction.hasUnsavedChanges}
              className={cn(
                'inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50',
                inlineApplyWithDate
                  ? 'w-auto min-w-[5.5rem] shrink-0'
                  : 'w-full min-w-[7rem] sm:w-auto',
                isStudent
                  ? 'rounded-full bg-[#1010a3]'
                  : isAdmin
                    ? cn(ADMIN_PRIMARY_BUTTON_CLASS, 'bg-[#1010a3] text-white shadow-sm ring-1 ring-[rgba(14,14,16,0.12)] hover:bg-[#1010a3]/90')
                    : 'rounded-lg bg-primary shadow-sm ring-1 ring-slate-200/40',
              )}
            >
              {t('applyTimeFilter')}
            </button>
            <span
              className={cn(
                'pointer-events-none absolute top-full mt-1 h-4 text-right text-xs font-medium whitespace-nowrap',
                applyAction.hasUnsavedChanges ? 'right-0 text-amber-700 opacity-100' : 'right-0 opacity-0',
              )}
              role="status"
            >
              {t('timeFilterUnsaved')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
