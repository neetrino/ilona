import { cn } from '@/shared/lib/utils';
import {
  getMonthDates,
  formatDateString,
  formatMonthDisplay,
  isToday,
  isCurrentMonth,
} from '@/features/attendance/utils/dateUtils';
import type { Group } from '@/features/groups';
import type { Lesson } from '@/features/lessons';
import { useLocale, useTranslations } from 'next-intl';

interface MonthViewCalendarProps {
  currentDate: Date;
  selectedGroup: Group | undefined;
  selectedDayForMonthView: string | null;
  lessonsByDate?: Record<string, Lesson[]>; // Optional for backward compatibility
  hasUnsavedChanges: boolean;
  onDaySelect: (date: Date) => void;
}

export function MonthViewCalendar({
  currentDate,
  selectedGroup,
  selectedDayForMonthView,
  lessonsByDate,
  hasUnsavedChanges,
  onDaySelect,
}: MonthViewCalendarProps) {
  const t = useTranslations('attendance');
  const locale = useLocale();
  const monthDates = getMonthDates(currentDate);
  const weekDayLabels = Array.from({ length: 7 }, (_, index) => {
    const baseDate = new Date(Date.UTC(2024, 0, 1 + index)); // Monday-first fixed week
    return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(baseDate);
  });
  const monthLabel = formatMonthDisplay(currentDate);
  const groupLabel = selectedGroup?.name || t('notAvailable');

  return (
    <div className="rounded-xl border border-[rgba(14,14,16,0.07)] bg-white p-6">
      <div className="mb-4 hidden md:block">
        <h3 className="mb-2 text-lg font-semibold text-[#1010a3]">
          {groupLabel} - {monthLabel}
        </h3>
        {hasUnsavedChanges && (
          <div className="inline-flex items-center gap-2 rounded-lg border-2 border-amber-400 bg-amber-100 px-4 py-2">
            <div className="h-2 w-2 rounded-full bg-amber-600 animate-pulse"></div>
            <span className="text-sm font-semibold text-amber-800">{t('unsavedChanges')}</span>
          </div>
        )}
      </div>

      <div className="mb-4 rounded-[28px] border border-[rgba(14,14,16,0.08)] bg-white px-5 py-4 md:hidden">
        <div className="grid grid-cols-[32px_1fr_32px] items-center">
          <span className="inline-flex h-8 w-8 items-center justify-center text-[#1010a3]" aria-hidden>
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M15 18l-6-6 6-6" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div className="text-center">
            <p className="truncate text-[44px] font-semibold leading-none tracking-[-0.02em] text-[#1010a3]">
              {groupLabel}
            </p>
            <p className="mt-2 text-[26px] font-semibold leading-none text-[#2f3442]">{monthLabel}</p>
          </div>
          <span className="inline-flex h-8 w-8 items-center justify-center text-[#1010a3]" aria-hidden>
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 18l6-6-6-6" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 md:hidden">
        {weekDayLabels.map((day) => (
          <div key={`mobile-${day}`} className="py-2 text-center text-[22px] font-semibold text-[#3b3f4c]">
            {day}
          </div>
        ))}
        {monthDates.map((date, idx) => {
          const dateStr = formatDateString(date);
          const isInCurrentMonth = isCurrentMonth(date, currentDate);
          const dayLessons = (lessonsByDate && lessonsByDate[dateStr]) || [];
          const hasLessons = dayLessons.length > 0;
          const isSelected = selectedDayForMonthView === dateStr;
          const isTodayDate = isToday(date);

          return (
            <button
              key={`mobile-${idx}`}
              onClick={() => hasLessons && onDaySelect(date)}
              disabled={!hasLessons}
              className={cn(
                'rounded-[14px] border border-[rgba(14,14,16,0.08)] px-2 py-3 text-center transition-all min-h-[92px]',
                !isInCurrentMonth && 'text-[#b5bbd5]',
                isSelected && 'border-[#99a3ff] bg-[#f6f7ff] ring-1 ring-[#99a3ff]',
                !isSelected && hasLessons && 'bg-white',
                !hasLessons && 'bg-[#fcfcfe]',
              )}
            >
              <div className={cn('text-[36px] font-semibold leading-none', isInCurrentMonth ? 'text-[#1010a3]' : 'text-[#b5bbd5]')}>
                {date.getDate()}
              </div>
              {isTodayDate && (
                <div className="mt-1 inline-flex rounded-full bg-[#1010a3] px-2 py-0.5 text-[14px] font-semibold text-white">
                  {t('monthTodayLabel')}
                </div>
              )}
              {hasLessons && (
                <div className="mt-1 text-[17px] font-medium text-[#2f3442]">
                  {t('sessionsCount', { count: dayLessons.length })}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="hidden grid-cols-7 gap-2 md:grid">
        {/* Week day headers */}
        {weekDayLabels.map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-[#3b3b40] py-2">
            {day}
          </div>
        ))}
        {/* Calendar days */}
        {monthDates.map((date, idx) => {
          const dateStr = formatDateString(date);
          const isInCurrentMonth = isCurrentMonth(date, currentDate);
          const dayLessons = (lessonsByDate && lessonsByDate[dateStr]) || [];
          const hasLessons = dayLessons.length > 0;
          const isSelected = selectedDayForMonthView === dateStr;
          const isTodayDate = isToday(date);

          return (
            <button
              key={idx}
              onClick={() => hasLessons && onDaySelect(date)}
              disabled={!hasLessons}
              className={cn(
                'p-3 border-2 rounded-lg text-center transition-all min-h-[80px]',
                !isInCurrentMonth && 'opacity-40',
                isSelected && 'border-[#1010a3] bg-[#f0f0fc] ring-2 ring-[#1010a3]',
                !isSelected && hasLessons && 'border-[rgba(14,14,16,0.12)] hover:border-[#1010a3]/40 hover:bg-[#f0f0fc]',
                !hasLessons && 'border-[rgba(14,14,16,0.07)] bg-[#fafafa] cursor-not-allowed',
                isTodayDate && !isSelected && 'border-[#1010a3]/30 bg-[#f0f0fc]'
              )}
            >
              <div className="text-sm font-semibold text-[#1010a3] mb-1">
                {date.getDate()}
                {isTodayDate && (
                  <span className="ml-1 text-xs text-[#1010a3] font-bold">{t('monthTodayLabel')}</span>
                )}
              </div>
              {hasLessons && (
                <div className="text-xs text-[#3b3b40] mt-1">
                  {t('sessionsCount', { count: dayLessons.length })}
                </div>
              )}
            </button>
          );
        })}
      </div>
      {selectedDayForMonthView && (
        <div className="mt-4 p-4 bg-[#fafafa] rounded-lg border border-[rgba(14,14,16,0.07)]">
          <p className="text-sm text-[#3b3b40] mb-2">
            {t('monthSelectHint')}
          </p>
        </div>
      )}
    </div>
  );
}




