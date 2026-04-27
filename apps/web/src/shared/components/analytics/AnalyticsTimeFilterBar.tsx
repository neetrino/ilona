'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { type TimeFilterMode } from '@/shared/lib/analytics-time-range';

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
}: AnalyticsTimeFilterBarProps) {
  const t = useTranslations('analytics');
  const modes: { id: TimeFilterMode; label: string }[] = [
    { id: 'day', label: t('timeFilterDay') },
    { id: 'week', label: t('timeFilterWeek') },
    { id: 'date', label: t('timeFilterDate') },
  ];

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-1">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onModeChange(m.id)}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              mode === m.id
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
        {mode === 'day' && (
          <label className="flex items-center gap-2">
            <span className="whitespace-nowrap text-slate-500">{t('timeFilterSelectDay')}</span>
            <input
              type="date"
              className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800"
              value={dayYmd}
              onChange={(e) => onDayYmdChange(e.target.value)}
            />
          </label>
        )}
        {mode === 'week' && (
          <label className="flex items-center gap-2">
            <span className="whitespace-nowrap text-slate-500">{t('timeFilterSelectWeek')}</span>
            <input
              type="date"
              className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800"
              value={weekAnchorYmd}
              onChange={(e) => onWeekAnchorYmdChange(e.target.value)}
            />
          </label>
        )}
        {mode === 'date' && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="whitespace-nowrap text-slate-500">{t('timeFilterFrom')}</span>
            <input
              type="date"
              className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800"
              value={customFromYmd}
              onChange={(e) => onCustomFromYmd(e.target.value)}
            />
            <span className="whitespace-nowrap text-slate-500">{t('timeFilterTo')}</span>
            <input
              type="date"
              className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-800"
              value={customToYmd}
              onChange={(e) => onCustomToYmd(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
