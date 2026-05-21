'use client';

import { useMemo } from 'react';
import type { Lesson } from '@/features/lessons';
import { WeekLessonGrid, MonthLessonGrid } from '@/features/schedule/ScheduleLessonViews';
import { scheduleDateKeyFromIso, type ScheduleViewMode } from '@/features/schedule/schedule-dates';
import type { ReactNode } from 'react';

function buildLessonsByDate(lessons: Lesson[]): Record<string, Lesson[]> {
  return lessons.reduce<Record<string, Lesson[]>>((acc, lesson) => {
    const key = scheduleDateKeyFromIso(lesson.scheduledAt);
    if (!key) {
      return acc;
    }
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
  /** Past vs future lesson starts (local instant): green vs blue; status accents unchanged. */
  highlightPastLessonCards?: boolean;
  /** Student portal styling aligned with dashboard. */
  variant?: 'default' | 'student';
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
  highlightPastLessonCards = false,
  variant = 'default',
}: ScheduleBoardProps) {
  const isStudent = variant === 'student';
  const lessonsByDate = useMemo(
    () => buildLessonsByDate(lessons),
    [lessons],
  );

  return (
    <>
      {topBar}
      <div
        className={
          isStudent
            ? 'flex min-h-[min(70vh,32rem)] flex-col overflow-hidden rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white md:min-h-[min(75vh,36rem)] lg:h-[calc(100vh-260px)] lg:min-h-0'
            : 'flex min-h-[min(70vh,32rem)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white md:min-h-[min(75vh,36rem)] lg:h-[calc(100vh-260px)] lg:min-h-0'
        }
      >
        <div
          className={
            isStudent
              ? 'relative flex flex-col gap-3 border-b border-[rgba(14,14,16,0.07)] p-4 md:flex-row md:items-center md:justify-between'
              : 'relative flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between'
          }
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPeriodNavigate('prev')}
              className={
                isStudent
                  ? 'flex h-9 w-9 items-center justify-center rounded-[0.875rem] border border-[rgba(14,14,16,0.07)] text-[#3b3b40] hover:bg-[#f6f6f7]'
                  : 'h-9 w-9 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50'
              }
              aria-label="Previous period"
            >
              ←
            </button>
            <div
              className={
                isStudent
                  ? 'min-w-0 flex-1 text-center text-sm font-semibold tracking-tight text-[#1010a3] sm:min-w-[10rem] sm:flex-none'
                  : 'min-w-0 flex-1 text-center text-sm font-semibold text-slate-800 sm:min-w-[10rem] sm:flex-none'
              }
            >
              {periodLabel}
            </div>
            <button
              type="button"
              onClick={() => onPeriodNavigate('next')}
              className={
                isStudent
                  ? 'flex h-9 w-9 items-center justify-center rounded-[0.875rem] border border-[rgba(14,14,16,0.07)] text-[#3b3b40] hover:bg-[#f6f6f7]'
                  : 'h-9 w-9 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50'
              }
              aria-label="Next period"
            >
              →
            </button>
            <button
              type="button"
              onClick={onGoToToday}
              className={
                isStudent
                  ? 'ml-2 h-9 rounded-full border border-[rgba(14,14,16,0.07)] px-3 text-sm font-medium text-[#1010a3] hover:bg-[#f6f6f7]'
                  : 'ml-2 h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 hover:bg-slate-50'
              }
            >
              Today
            </button>
          </div>

          {managerBranchName ? (
            <div className="flex justify-center md:absolute md:left-1/2 md:-translate-x-1/2">
              <span
                className={
                  isStudent
                    ? 'inline-flex h-9 items-center rounded-full border border-[rgba(14,14,16,0.07)] bg-[#f6f6f7] px-3 text-sm font-medium whitespace-nowrap text-[#3b3b40]'
                    : 'inline-flex h-9 items-center rounded-full border border-slate-200 bg-slate-50 px-3 text-base font-medium whitespace-nowrap text-slate-600'
                }
              >
                {managerBranchName}
              </span>
            </div>
          ) : null}

          <div
            className={
              isStudent
                ? 'inline-flex items-center self-start rounded-full border border-[rgba(14,14,16,0.07)] bg-[#f6f6f7] p-1 md:self-auto'
                : 'inline-flex items-center self-start rounded-lg border border-slate-200 bg-slate-50 p-1 md:self-auto'
            }
          >
            <button
              type="button"
              onClick={() => onViewModeChange('week')}
              className={
                viewMode === 'week'
                  ? isStudent
                    ? 'h-8 rounded-full bg-[#1010a3] px-3 text-sm font-medium text-white'
                    : 'h-8 rounded-md bg-white px-3 text-sm text-slate-900 shadow-sm'
                  : isStudent
                    ? 'h-8 rounded-full px-3 text-sm font-medium text-[#3b3b40] hover:text-[#1010a3]'
                    : 'h-8 rounded-md px-3 text-sm text-slate-600 hover:text-slate-800'
              }
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('month')}
              className={
                viewMode === 'month'
                  ? isStudent
                    ? 'h-8 rounded-full bg-[#1010a3] px-3 text-sm font-medium text-white'
                    : 'h-8 rounded-md bg-white px-3 text-sm text-slate-900 shadow-sm'
                  : isStudent
                    ? 'h-8 rounded-full px-3 text-sm font-medium text-[#3b3b40] hover:text-[#1010a3]'
                    : 'h-8 rounded-md px-3 text-sm text-slate-600 hover:text-slate-800'
              }
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
              highlightPastLessonCards={highlightPastLessonCards}
              theme={isStudent ? 'student' : 'default'}
            />
          ) : (
            <MonthLessonGrid
              className="min-h-0 flex-1"
              monthDates={monthDates}
              lessonsByDate={lessonsByDate}
              isLoading={isLoading}
              highlightPastLessonCards={highlightPastLessonCards}
              theme={isStudent ? 'student' : 'default'}
            />
          )}
        </div>
      </div>
    </>
  );
}

