'use client';

import { useMemo } from 'react';
import { CalendarMonthGrid } from '@/shared/components/calendar/CalendarMonthGrid';
import type { Lesson } from '@/features/lessons';
import { cn } from '@/shared/lib/utils';
import { studentScheduleTable } from '@/features/student-ui/tokens';
import { ScheduleLessonCard } from './ScheduleLessonCard';
import { SCHEDULE_CELL_MAX_VISIBLE_LESSONS } from './ScheduleDayLessonsSheet';
import type { MonthLessonGridProps } from './schedule-lesson-views.types';

export function MonthLessonGrid({
  monthDates,
  lessonsByDate,
  isLoading,
  className,
  highlightPastLessonCards = false,
  theme = 'default',
}: MonthLessonGridProps) {
  const referenceTime = new Date();
  const totalInMonth = useMemo(
    () => Object.values(lessonsByDate).reduce((n, list) => n + list.length, 0),
    [lessonsByDate],
  );

  if (!isLoading && totalInMonth === 0) {
    return (
      <div
        className={cn(
          'flex h-full min-h-0 flex-1 flex-col items-center justify-center rounded-b-[inherit] p-10 text-center text-sm',
          theme === 'student' ? studentScheduleTable.emptyText : 'text-slate-500',
          className,
        )}
      >
        No lessons available.
      </div>
    );
  }

  return (
    <CalendarMonthGrid<Lesson>
      theme={theme}
      monthDates={monthDates}
      getLessonsForDay={(k) => lessonsByDate[k] ?? []}
      getLessonKey={(l) => l.id}
      getSortTime={(l) => new Date(l.scheduledAt).getTime()}
      maxVisibleOverride={SCHEDULE_CELL_MAX_VISIBLE_LESSONS}
      overflowLabel="threePlus"
      renderLesson={({ lesson, variant: cardVariant }) => (
        <ScheduleLessonCard
          lesson={lesson}
          variant={cardVariant}
          highlightPastLessonCards={highlightPastLessonCards}
          referenceTime={referenceTime}
          uiVariant={theme}
        />
      )}
      isLoading={isLoading}
      className={className}
    />
  );
}
