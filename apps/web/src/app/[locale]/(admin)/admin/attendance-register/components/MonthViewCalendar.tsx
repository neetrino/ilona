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

  return (
    <div className="bg-white rounded-xl border border-[rgba(14,14,16,0.07)] p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[#1010a3] mb-2">
          {selectedGroup?.name || t('notAvailable')} - {formatMonthDisplay(currentDate)}
        </h3>
        {hasUnsavedChanges && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 border-2 border-amber-400 rounded-lg inline-flex">
            <div className="h-2 w-2 rounded-full bg-amber-600 animate-pulse"></div>
            <span className="text-sm font-semibold text-amber-800">{t('unsavedChanges')}</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-7 gap-2">
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




