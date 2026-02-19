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

interface MonthViewCalendarProps {
  currentDate: Date;
  selectedGroup: Group | undefined;
  selectedDayForMonthView: string | null;
  lessonsByDate: Record<string, Lesson[]>;
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
  const monthDates = getMonthDates(currentDate);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          {selectedGroup?.name || 'N/A'} - {formatMonthDisplay(currentDate)}
        </h3>
        {hasUnsavedChanges && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 border-2 border-amber-400 rounded-lg inline-flex">
            <div className="h-2 w-2 rounded-full bg-amber-600 animate-pulse"></div>
            <span className="text-sm font-semibold text-amber-800">Unsaved Changes</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {/* Week day headers */}
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-slate-700 py-2">
            {day}
          </div>
        ))}
        {/* Calendar days */}
        {monthDates.map((date, idx) => {
          const dateStr = formatDateString(date);
          const isInCurrentMonth = isCurrentMonth(date, currentDate);
          const dayLessons = lessonsByDate[dateStr] || [];
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
                isSelected && 'border-primary bg-primary/10 ring-2 ring-primary',
                !isSelected && hasLessons && 'border-slate-300 hover:border-primary/40 hover:bg-primary/10',
                !hasLessons && 'border-slate-200 bg-slate-50 cursor-not-allowed',
                isTodayDate && !isSelected && 'border-primary/30 bg-primary/10'
              )}
            >
              <div className="text-sm font-semibold text-slate-900 mb-1">
                {date.getDate()}
                {isTodayDate && (
                  <span className="ml-1 text-xs text-primary font-bold">Today</span>
                )}
              </div>
              {hasLessons && (
                <div className="text-xs text-slate-600 mt-1">
                  {dayLessons.length} {dayLessons.length === 1 ? 'session' : 'sessions'}
                </div>
              )}
            </button>
          );
        })}
      </div>
      {selectedDayForMonthView && (
        <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600 mb-2">
            Click a day above to view and edit attendance, or select a different day.
          </p>
        </div>
      )}
    </div>
  );
}



