'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { type TimeFilterMode } from '@/shared/lib/analytics-time-range';
import { DatePickerInput } from '@/shared/components/ui';

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
  const modes: { id: TimeFilterMode; label: string }[] = [
    { id: 'day', label: t('timeFilterDay') },
    { id: 'week', label: t('timeFilterWeek') },
    { id: 'date', label: t('timeFilterDate') },
  ];

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-end sm:justify-between',
        usesGroupAccent
          ? 'border-[rgba(14,14,16,0.07)] bg-[#fafafa]'
          : 'border-slate-200 bg-slate-50/80',
        className,
      )}
    >
      <div
        className={cn(
          'flex flex-wrap items-center gap-1',
          isStudent && 'rounded-full border border-[rgba(14,14,16,0.07)] bg-[#f6f6f7] p-1',
        )}
      >
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onModeChange(m.id)}
            className={cn(
              'px-3 py-2 text-sm font-medium transition-colors',
              isStudent ? 'rounded-full' : 'rounded-lg',
              mode === m.id
                ? isStudent
                  ? 'bg-[#1010a3] text-white'
                  : isAdmin
                    ? 'bg-[#1010a3] text-white shadow-sm'
                    : 'bg-primary text-white shadow-sm'
                : isStudent
                  ? 'bg-transparent text-[#3b3b40] hover:text-[#1010a3]'
                  : isAdmin
                    ? 'bg-white text-[#3b3b40] ring-1 ring-[rgba(14,14,16,0.08)] hover:text-[#1010a3]'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

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
            <DatePickerInput
              className={cn(
                'rounded-[0.875rem] border bg-white px-2 py-1.5',
                usesGroupAccent
                  ? 'border-[rgba(14,14,16,0.07)] text-[#3b3b40] focus:border-[#1010a3] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/15'
                  : 'rounded-md border-slate-200 text-slate-800',
              )}
              value={dayYmd}
              onValueChange={onDayYmdChange}
            />
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
            <DatePickerInput
              className={cn(
                'rounded-[0.875rem] border bg-white px-2 py-1.5',
                usesGroupAccent
                  ? 'border-[rgba(14,14,16,0.07)] text-[#3b3b40] focus:border-[#1010a3] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/15'
                  : 'rounded-md border-slate-200 text-slate-800',
              )}
              value={weekAnchorYmd}
              onValueChange={onWeekAnchorYmdChange}
            />
          </label>
        )}
        {mode === 'date' && (
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'whitespace-nowrap',
                usesGroupAccent ? 'text-[#8b8b90]' : 'text-slate-500',
              )}
            >
              {t('timeFilterFrom')}
            </span>
            <DatePickerInput
              className={cn(
                'rounded-[0.875rem] border bg-white px-2 py-1.5',
                usesGroupAccent
                  ? 'border-[rgba(14,14,16,0.07)] text-[#3b3b40] focus:border-[#1010a3] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/15'
                  : 'rounded-md border-slate-200 text-slate-800',
              )}
              value={customFromYmd}
              onValueChange={onCustomFromYmd}
            />
            <span
              className={cn(
                'whitespace-nowrap',
                usesGroupAccent ? 'text-[#8b8b90]' : 'text-slate-500',
              )}
            >
              {t('timeFilterTo')}
            </span>
            <DatePickerInput
              className={cn(
                'rounded-[0.875rem] border bg-white px-2 py-1.5',
                usesGroupAccent
                  ? 'border-[rgba(14,14,16,0.07)] text-[#3b3b40] focus:border-[#1010a3] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/15'
                  : 'rounded-md border-slate-200 text-slate-800',
              )}
              value={customToYmd}
              onValueChange={onCustomToYmd}
            />
          </div>
        )}

        {applyAction && (
          <div className="flex min-w-0 flex-col items-stretch gap-1 sm:items-end sm:pl-2">
            {applyAction.hasUnsavedChanges && (
              <span className="text-right text-xs font-medium text-amber-700" role="status">
                {t('timeFilterUnsaved')}
              </span>
            )}
            <button
              type="button"
              onClick={applyAction.onApply}
              disabled={applyAction.applyDisabled ?? !applyAction.hasUnsavedChanges}
              className={cn(
                'inline-flex w-full min-w-[7rem] items-center justify-center px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50',
                isStudent
                  ? 'rounded-full bg-[#1010a3]'
                  : isAdmin
                    ? 'rounded-lg bg-[#1010a3] shadow-sm ring-1 ring-[rgba(14,14,16,0.12)]'
                    : 'rounded-lg bg-primary shadow-sm ring-1 ring-slate-200/40',
              )}
            >
              {t('applyTimeFilter')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
