'use client';

import { Clock } from 'lucide-react';
import {
  APP_TIMEZONE,
  formatAppDate,
  formatAppTimeRange,
  getZonedParts,
} from '@/shared/lib/app-timezone';

/** Date badge labels stay English everywhere (compact FRI / JUL icon look). */
const DATE_BADGE_LOCALE = 'en';

function getDateParts(dateStr: string) {
  const date = new Date(dateStr);
  const parts = getZonedParts(date);
  return {
    weekday: formatAppDate(date, DATE_BADGE_LOCALE, {
      weekday: 'short',
      timeZone: APP_TIMEZONE,
    }).toUpperCase(),
    day: parts.day,
    month: formatAppDate(date, DATE_BADGE_LOCALE, {
      month: 'short',
      timeZone: APP_TIMEZONE,
    }).toUpperCase(),
  };
}

type LessonListDateCellProps = {
  dateStr: string;
  /** Kept for call-site compatibility; badge text is always English. */
  locale?: string;
  /** When set, shows `start–end` instead of start only. */
  durationMinutes?: number | null;
};

export function LessonListDateCell({
  dateStr,
  durationMinutes,
}: LessonListDateCellProps) {
  const { weekday, day, month } = getDateParts(dateStr);
  const timeLabel = formatAppTimeRange(dateStr, durationMinutes);

  return (
    <div className="inline-flex items-stretch">
      <div className="relative z-[2] flex min-w-[3.25rem] flex-col items-center justify-center rounded-[15px] bg-[#1010a3] px-3 py-2 leading-none text-white shadow-[0_2px_10px_rgba(14,14,16,0.1)]">
        <span className="text-[9px] font-bold tracking-wider">{weekday}</span>
        <span className="py-0.5 text-lg font-bold">{day}</span>
        <span className="text-[9px] font-bold tracking-wider">{month}</span>
      </div>
      <div className="relative z-[1] -ml-2.5 flex min-w-[4.5rem] flex-col items-center justify-center gap-[5px] rounded-r-[15px] border border-[rgba(14,14,16,0.08)] bg-white py-1.5 pl-3.5 pr-2.5 shadow-[0_2px_10px_rgba(14,14,16,0.06)]">
        <Clock className="h-4 w-4 shrink-0 text-[#8b8b90]" strokeWidth={1.75} aria-hidden />
        <span className="text-[11px] font-bold tabular-nums leading-none text-[#1010a3] sm:text-sm">
          {timeLabel}
        </span>
      </div>
    </div>
  );
}
