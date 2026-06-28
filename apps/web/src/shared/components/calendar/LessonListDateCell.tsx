'use client';

function formatTime(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString(locale === 'hy' ? 'hy-AM' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getDateParts(dateStr: string, locale: string) {
  const date = new Date(dateStr);
  const loc = locale === 'hy' ? 'hy-AM' : 'en-GB';
  return {
    weekday: date.toLocaleDateString(loc, { weekday: 'short' }).toUpperCase(),
    day: date.getDate(),
    month: date.toLocaleDateString(loc, { month: 'short' }).toUpperCase(),
  };
}

type LessonListDateCellProps = {
  dateStr: string;
  locale: string;
};

export function LessonListDateCell({ dateStr, locale }: LessonListDateCellProps) {
  const { weekday, day, month } = getDateParts(dateStr, locale);

  return (
    <div className="flex items-center gap-3">
      <div className="flex w-10 flex-col items-center text-center leading-none text-[#1a1a1a]">
        <span className="text-[10px] font-bold tracking-wider">{weekday}</span>
        <span className="text-xl font-semibold leading-none py-0.5">{day}</span>
        <span className="text-[10px] font-bold tracking-wider">{month}</span>
      </div>
      <span className="text-sm tabular-nums text-slate-600">{formatTime(dateStr, locale)}</span>
    </div>
  );
}
