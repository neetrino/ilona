'use client';

import { useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui';
import { useMaxVisibleInCell } from '@/shared/components/calendar/useCalendarMonthCellLimit';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export function formatCalendarDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export type CalendarMonthLessonVariant = 'cell' | 'dialog';

export type CalendarMonthGridRenderLesson<T> = (args: {
  lesson: T;
  variant: CalendarMonthLessonVariant;
}) => ReactNode;

export type CalendarMonthGridProps<T> = {
  monthDates: (Date | null)[][];
  getLessonsForDay: (dateKey: string) => T[];
  getLessonKey: (lesson: T) => string;
  getSortTime?: (lesson: T) => number;
  renderLesson: CalendarMonthGridRenderLesson<T>;
  isLoading?: boolean;
  maxVisibleOverride?: number;
  highlightToday?: boolean;
  className?: string;
  scrollAreaClassName?: string;
};

type DayDialogState<T> = {
  date: Date;
  lessons: T[];
};

function sortDayLessons<T>(
  list: T[],
  getSortTime: ((lesson: T) => number) | undefined,
): T[] {
  if (!getSortTime || list.length < 2) {
    return list;
  }
  return [...list].sort((a, b) => getSortTime(a) - getSortTime(b));
}

export function CalendarMonthGrid<T>({
  monthDates,
  getLessonsForDay,
  getLessonKey,
  getSortTime,
  renderLesson,
  isLoading,
  maxVisibleOverride,
  highlightToday = true,
  className,
  scrollAreaClassName,
}: CalendarMonthGridProps<T>) {
  const maxFromViewport = useMaxVisibleInCell(maxVisibleOverride);
  const [dayDialog, setDayDialog] = useState<DayDialogState<T> | null>(null);

  const isToday = useCallback((date: Date) => {
    const t = new Date();
    return (
      date.getFullYear() === t.getFullYear() &&
      date.getMonth() === t.getMonth() &&
      date.getDate() === t.getDate()
    );
  }, []);

  if (isLoading) {
    return (
      <div
        className={cn(
          'flex h-full min-h-0 flex-1 flex-col',
          'rounded-b-[inherit]',
          className,
        )}
      >
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/90">
          {DAY_LABELS.map((day) => (
            <div
              key={day}
              className="px-0.5 py-1.5 text-center text-[10px] font-semibold uppercase leading-none tracking-wide text-slate-500 sm:px-1.5 sm:py-2 sm:text-xs"
            >
              {day}
            </div>
          ))}
        </div>
        <div
          className={cn(
            'min-h-0 flex-1 overflow-y-auto p-0.5 sm:p-1',
            scrollAreaClassName,
          )}
        >
          <div className="space-y-0.5 sm:space-y-1">
            {Array.from({ length: 6 }, (_, w) => (
              <div
                key={w}
                className="grid min-w-0 grid-cols-7 gap-0.5 sm:gap-px"
              >
                {Array.from({ length: 7 }, (_, d) => (
                  <div
                    key={d}
                    className="min-h-[3.5rem] animate-pulse rounded-md border border-slate-100/80 bg-slate-100/60 sm:min-h-[4.5rem] lg:min-h-[5.5rem]"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          'flex h-full min-h-0 flex-1 min-w-0 flex-col',
          className,
        )}
      >
        <div className="shrink-0">
          <div className="grid min-w-0 grid-cols-7 border-b border-slate-200 bg-slate-50/90">
            {DAY_LABELS.map((day) => (
              <div
                key={day}
                className="px-0.5 py-1.5 text-center text-[10px] font-semibold uppercase leading-none tracking-wide text-slate-500 sm:px-1.5 sm:py-2.5 sm:text-xs"
              >
                {day}
              </div>
            ))}
          </div>
        </div>

        <div
          className={cn(
            'min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-auto overscroll-contain',
            scrollAreaClassName,
          )}
        >
          <div className="min-w-0">
            {monthDates.map((week, weekIndex) => (
              <div
                key={weekIndex}
                className="grid min-w-0 grid-cols-7 border-b border-slate-100 last:border-b-0"
              >
                {week.map((date, dayIndex) => {
                  if (!date) {
                    return (
                      <div
                        key={dayIndex}
                        className="min-h-[3.5rem] min-w-0 border-r border-slate-100/80 bg-slate-50/50 last:border-r-0 sm:min-h-[4.5rem] lg:min-h-[5.5rem]"
                        aria-hidden
                      />
                    );
                  }

                  const dayKey = formatCalendarDayKey(date);
                  const raw = getLessonsForDay(dayKey);
                  const dayLessons = sortDayLessons(raw, getSortTime);
                  const showToday = highlightToday && isToday(date);
                  const cap = maxFromViewport;
                  const shown = dayLessons.slice(0, cap);
                  const hidden = Math.max(0, dayLessons.length - cap);

                  return (
                    <div
                      key={dayIndex}
                      className={cn(
                        'group/cell box-border min-h-0 min-w-0 max-w-full border-r border-slate-100/80 p-0.5 last:border-r-0',
                        'sm:p-1 lg:p-1.5',
                        'min-h-[3.5rem] sm:min-h-[4.5rem] lg:min-h-[5.5rem]',
                        'flex min-w-0 flex-col',
                        showToday && 'bg-sky-50/90 ring-1 ring-inset ring-sky-200/60',
                        !showToday && 'bg-white/70',
                      )}
                    >
                      <p
                        className={cn(
                          'shrink-0 text-[10px] font-bold tabular-nums sm:text-xs',
                          showToday ? 'text-sky-700' : 'text-slate-700',
                        )}
                      >
                        {date.getDate()}
                      </p>
                      <div
                        className="mt-0.5 min-h-0 min-w-0 max-w-full flex-1"
                      >
                        <ul className="m-0 flex min-w-0 list-none flex-col gap-0.5 p-0 sm:gap-1">
                          {shown.map((lesson) => (
                            <li
                              key={getLessonKey(lesson)}
                              className="min-w-0"
                            >
                              {renderLesson({ lesson, variant: 'cell' })}
                            </li>
                          ))}
                        </ul>
                        {hidden > 0 && (
                          <div className="mt-0.5 sm:mt-1">
                            <button
                              type="button"
                              onClick={() =>
                                setDayDialog({ date, lessons: dayLessons })
                              }
                              className="w-full max-w-full truncate rounded border border-slate-200/90 bg-slate-50/90 px-1 py-0.5 text-left text-[9px] font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100/90 sm:text-[10px]"
                              aria-label={`View ${hidden} more lesson${hidden === 1 ? '' : 's'} for ${date.toDateString()}`}
                            >
                              +{hidden} more
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog
        open={dayDialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDayDialog(null);
          }
        }}
      >
        {dayDialog && (
          <DialogContent className="max-h-[min(80vh,540px)] gap-0 overflow-hidden p-0 sm:max-w-md">
            <DialogHeader className="border-b border-slate-100 p-4 pb-3 sm:p-5">
              <DialogTitle className="pr-6 text-left text-base font-semibold sm:text-lg">
                {dayDialog.date.toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </DialogTitle>
            </DialogHeader>
            <ul className="max-h-[60vh] list-none space-y-1.5 overflow-y-auto p-3 sm:space-y-2 sm:p-4">
              {dayDialog.lessons.map((lesson) => (
                <li key={getLessonKey(lesson)} className="min-w-0">
                  {renderLesson({ lesson, variant: 'dialog' })}
                </li>
              ))}
            </ul>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
