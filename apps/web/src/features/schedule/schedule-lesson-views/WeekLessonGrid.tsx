'use client';

import { cn } from '@/shared/lib/utils';
import { studentScheduleTable } from '@/features/student-ui/tokens';
import { useWeekLessonGrid } from './useWeekLessonGrid';
import { WeekLessonGridMobileDayView } from './WeekLessonGridMobileDayView';
import { WeekLessonGridDesktopTable } from './WeekLessonGridDesktopTable';
import type { WeekLessonGridProps } from './schedule-lesson-views.types';

export function WeekLessonGrid({
  weekDates,
  lessons,
  isLoading,
  highlightPastLessonCards = false,
  theme = 'default',
  forceMobileLayout = false,
}: WeekLessonGridProps) {
  const isStudent = theme === 'student';
  const referenceTime = new Date();
  const grid = useWeekLessonGrid({ weekDates, lessons });

  if (isLoading) {
    return (
      <div
        className={cn(
          'p-8 text-center',
          isStudent ? studentScheduleTable.emptyText : 'text-slate-500',
        )}
      >
        Loading schedule...
      </div>
    );
  }

  if (grid.totalLessons === 0) {
    return (
      <div
        className={cn(
          'p-10 text-center text-sm',
          isStudent ? studentScheduleTable.emptyText : 'text-slate-500',
        )}
      >
        No lessons available.
      </div>
    );
  }

  return (
    <div>
      <WeekLessonGridMobileDayView
        weekDates={weekDates}
        selectedDayIndex={grid.selectedDayIndex}
        selectedDate={grid.selectedDate}
        selectedDayLessons={grid.selectedDayLessons}
        referenceTime={referenceTime}
        forceMobileLayout={forceMobileLayout}
        onSelectDay={grid.setSelectedDayIndex}
      />
      <WeekLessonGridDesktopTable
        weekDates={weekDates}
        slots={grid.slots}
        cells={grid.cells}
        highlightPastLessonCards={highlightPastLessonCards}
        referenceTime={referenceTime}
        theme={theme}
        forceMobileLayout={forceMobileLayout}
      />
    </div>
  );
}
