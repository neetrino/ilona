'use client';

import { useMemo } from 'react';
import type { Lesson } from '@/features/lessons';
import { WeekLessonGrid, MonthLessonGrid } from '@/features/schedule/ScheduleLessonViews';
import type { ScheduleViewMode } from '@/features/schedule/schedule-dates';
import type { ReactNode } from 'react';

function buildLessonsByDate(lessons: Lesson[]): Record<string, Lesson[]> {
  return lessons.reduce<Record<string, Lesson[]>>((acc, lesson) => {
    const key = lesson.scheduledAt.split('T')[0];
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(lesson);
    return acc;
  }, {});
}

export type ScheduleBoardProps = {
  lessons: Lesson[];
  isLoading: boolean;
  topBar: ReactNode;
  managerBranchName?: string | null;
  weekDates: Date[];
  monthDates: (Date | null)[][];
  viewMode: ScheduleViewMode;
  onViewModeChange: (mode: ScheduleViewMode) => void;
  periodLabel: string;
  onPeriodNavigate: (direction: 'prev' | 'next') => void;
  onGoToToday: () => void;
};

export function ScheduleBoard({
  lessons,
  isLoading,
  topBar,
  managerBranchName = null,
  weekDates,
  monthDates,
  viewMode,
  onViewModeChange,
  periodLabel,
  onPeriodNavigate,
  onGoToToday,
}: ScheduleBoardProps) {
  const lessonsByDate = useMemo(
    () => buildLessonsByDate(lessons),
    [lessons],
  );

  return (
    <>
      {topBar}
      <div className="flex h-[calc(100vh-260px)] min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="relative flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPeriodNavigate('prev')}
              className="h-9 w-9 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              aria-label="Previous period"
            >
              ←
            </button>
            <div className="min-w-[180px] text-center text-sm font-semibold text-slate-800">
              {periodLabel}
            </div>
            <button
              type="button"
              onClick={() => onPeriodNavigate('next')}
              className="h-9 w-9 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              aria-label="Next period"
            >
              →
            </button>
            <button
              type="button"
              onClick={onGoToToday}
              className="ml-2 h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 hover:bg-slate-50"
            >
              Today
            </button>
          </div>

          {managerBranchName ? (
            <div className="flex justify-center md:absolute md:left-1/2 md:-translate-x-1/2">
              <span className="inline-flex h-9 items-center rounded-full border border-slate-200 bg-slate-50 px-3 text-base font-medium whitespace-nowrap text-slate-600">
                {managerBranchName}
              </span>
            </div>
          ) : null}

          <div className="inline-flex items-center self-start rounded-lg border border-slate-200 bg-slate-50 p-1 md:self-auto">
            <button
              type="button"
              onClick={() => onViewModeChange('week')}
              className={`h-8 rounded-md px-3 text-sm ${
                viewMode === 'week'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('month')}
              className={`h-8 rounded-md px-3 text-sm ${
                viewMode === 'month'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Month
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 flex flex-col">
          {viewMode === 'week' ? (
            <WeekLessonGrid
              weekDates={weekDates}
              lessons={lessons}
              isLoading={isLoading}
            />
          ) : (
            <MonthLessonGrid
              className="min-h-0 flex-1"
              monthDates={monthDates}
              lessonsByDate={lessonsByDate}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </>
  );
}

