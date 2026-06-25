'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { type TimeFilterMode } from '@/shared/lib/analytics-time-range';
import { DatePickerInput } from '@/shared/components/ui';
import { StudentAnimatedPillSwitcher, StudentDatePicker } from '@/features/student-ui';

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

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border p-4 pb-6 sm:flex-row sm:items-end sm:justify-between sm:pb-7',
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
          'flex flex-wrap items-center gap-3 text-sm',
          usesGroupAccent ? 'text-[#3b3b40]' : 'text-slate-600',
        )}
      >
        {mode === 'day' && (
          <label className="flex items-center gap-2">
            <span
              className={cn(
                'whitespace-nowrap',
                usesGroupAccent ? 'text-[#8b8b90]' : 'text-slate-500',
              )}
            >
              {t('timeFilterSelectDay')}
            </span>
            {isStudent ? (
              <StudentDatePicker value={dayYmd} onValueChange={onDayYmdChange} />
            ) : (
              <DatePickerInput
                className={adminDatePickerClassName}
                value={dayYmd}
                onValueChange={onDayYmdChange}
              />
            )}
          </label>
        )}
        {mode === 'week' && (
          <label className="flex items-center gap-2">
            <span
              className={cn(
                'whitespace-nowrap',
                usesGroupAccent ? 'text-[#8b8b90]' : 'text-slate-500',
              )}
            >
              {t('timeFilterSelectWeek')}
            </span>
            {isStudent ? (
              <StudentDatePicker value={weekAnchorYmd} onValueChange={onWeekAnchorYmdChange} />
            ) : (
              <DatePickerInput
                className={adminDatePickerClassName}
                value={weekAnchorYmd}
                onValueChange={onWeekAnchorYmdChange}
              />
            )}
          </label>
        )}
        {mode === 'date' && (
          <div className="flex w-full justify-center overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:w-auto sm:justify-start sm:overflow-visible">
            <div className="inline-flex min-w-max flex-nowrap items-center gap-2">
              <span
                className={cn(
                  'whitespace-nowrap',
                  usesGroupAccent ? 'text-[#8b8b90]' : 'text-slate-500',
                )}
              >
                {t('timeFilterFrom')}
              </span>
              <div className="min-w-[8.5rem] shrink-0 sm:min-w-[9.5rem]">
                {isStudent ? (
                  <StudentDatePicker value={customFromYmd} onValueChange={onCustomFromYmd} />
                ) : (
                  <DatePickerInput
                    className={adminDatePickerClassName}
                    value={customFromYmd}
                    onValueChange={onCustomFromYmd}
                  />
                )}
              </div>
              <span
                className={cn(
                  'whitespace-nowrap',
                  usesGroupAccent ? 'text-[#8b8b90]' : 'text-slate-500',
                )}
              >
                {t('timeFilterTo')}
              </span>
              <div className="min-w-[8.5rem] shrink-0 sm:min-w-[9.5rem]">
                {isStudent ? (
                  <StudentDatePicker value={customToYmd} onValueChange={onCustomToYmd} />
                ) : (
                  <DatePickerInput
                    className={adminDatePickerClassName}
                    value={customToYmd}
                    onValueChange={onCustomToYmd}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {applyAction && (
          <div
            className={cn(
              'relative flex min-w-0 flex-col items-stretch sm:items-end sm:self-end sm:pl-2',
              mode === 'date' && 'ml-auto',
            )}
          >
            <button
              type="button"
              onClick={applyAction.onApply}
              disabled={applyAction.applyDisabled ?? !applyAction.hasUnsavedChanges}
              className={cn(
                'inline-flex w-full min-w-[7rem] items-center justify-center px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto',
                isStudent
                  ? 'rounded-full bg-[#1010a3]'
                  : isAdmin
                    ? 'rounded-lg bg-[#1010a3] shadow-sm ring-1 ring-[rgba(14,14,16,0.12)]'
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
