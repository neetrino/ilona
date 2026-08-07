'use client';

import { useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { cn, formatLocaleDate } from '@/shared/lib/utils';
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
  /** Cap lessons shown per day cell (e.g. 3). Omit to use viewport-based default. */
  maxVisibleOverride?: number;
  highlightToday?: boolean;
  /** Student schedule board color system */
  theme?: 'default' | 'student';
  className?: string;
  scrollAreaClassName?: string;
  /** When true, clicking a day cell opens the full-day lessons dialog. */
  openDayDialogOnCellClick?: boolean;
  /** Label for overflow: `count` → "+1", `more` → "+1 more", `threePlus` → "3+". Default `more`. */
  overflowLabel?: 'count' | 'more' | 'threePlus';
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
  theme = 'default',
  className,
  scrollAreaClassName,
  openDayDialogOnCellClick = false,
  overflowLabel = 'more',
}: CalendarMonthGridProps<T>) {
  const isStudent = theme === 'student';
  const locale = useLocale();
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
        <div
          className={cn(
            'grid grid-cols-7 border-b',
            isStudent
              ? 'border-[rgba(14,14,16,0.07)] bg-[#f6f6f7]'
              : 'border-slate-200 bg-slate-50/90',
          )}
        >
          {DAY_LABELS.map((day) => (
            <div
              key={day}
              className={cn(
                'px-0.5 py-1.5 text-center text-[10px] font-semibold uppercase leading-none tracking-wide sm:px-1.5 sm:py-2 sm:text-xs',
                isStudent ? 'text-[#8b8b90]' : 'text-slate-500',
              )}
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
                    className={cn(
                      'min-h-[3.5rem] animate-pulse rounded-md border sm:min-h-[4.5rem] lg:min-h-[5.5rem]',
                      isStudent
                        ? 'border-[rgba(14,14,16,0.07)] bg-[#f6f6f7]/80'
                        : 'border-slate-100/80 bg-slate-100/60',
                    )}
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
          <div
            className={cn(
              'grid min-w-0 grid-cols-7 border-b',
              isStudent
                ? 'border-[rgba(14,14,16,0.07)] bg-[#f6f6f7]'
                : 'border-slate-200 bg-slate-50/90',
            )}
          >
            {DAY_LABELS.map((day) => (
              <div
                key={day}
                className={cn(
                  'px-0.5 py-1.5 text-center text-[10px] font-semibold uppercase leading-none tracking-wide sm:px-1.5 sm:py-2.5 sm:text-xs',
                  isStudent ? 'text-[#8b8b90]' : 'text-slate-500',
                )}
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
                className={cn(
                  'grid min-w-0 grid-cols-7 border-b last:border-b-0',
                  isStudent ? 'border-[rgba(14,14,16,0.07)]' : 'border-slate-100',
                )}
              >
                {week.map((date, dayIndex) => {
                  if (!date) {
                    return (
                      <div
                        key={dayIndex}
                        className={cn(
                          'min-h-[3.5rem] min-w-0 border-r last:border-r-0 sm:min-h-[4.5rem] lg:min-h-[5.5rem]',
                          isStudent
                            ? 'border-[rgba(14,14,16,0.07)] bg-[#fafafa]/80'
                            : 'border-slate-100/80 bg-slate-50/50',
                        )}
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
                  const cellOpensDialog =
                    openDayDialogOnCellClick && dayLessons.length > 0;

                  return (
                    <div
                      key={dayIndex}
                      role={cellOpensDialog ? 'button' : undefined}
                      tabIndex={cellOpensDialog ? 0 : undefined}
                      onClick={
                        cellOpensDialog
                          ? () => setDayDialog({ date, lessons: dayLessons })
                          : undefined
                      }
                      onKeyDown={
                        cellOpensDialog
                          ? (event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                setDayDialog({ date, lessons: dayLessons });
                              }
                            }
                          : undefined
                      }
                      className={cn(
                        'group/cell box-border min-h-0 min-w-0 max-w-full border-r p-0.5 last:border-r-0',
                        isStudent ? 'border-[rgba(14,14,16,0.07)]' : 'border-slate-100/80',
                        'sm:p-1 lg:p-1.5',
                        'min-h-[3.5rem] sm:min-h-[4.5rem] lg:min-h-[5.5rem]',
                        'flex min-w-0 flex-col',
                        showToday &&
                          (isStudent
                            ? 'bg-[#ddecff]/50 ring-1 ring-inset ring-[#1010a3]/20'
                            : 'bg-sky-50/90 ring-1 ring-inset ring-sky-200/60'),
                        !showToday && 'bg-white/70',
                        cellOpensDialog &&
                          'cursor-pointer transition-colors hover:bg-slate-50/90',
                      )}
                    >
                      <p
                        className={cn(
                          'shrink-0 text-[10px] font-bold tabular-nums sm:text-xs',
                          showToday
                            ? isStudent
                              ? 'text-[#1010a3]'
                              : 'text-sky-700'
                            : isStudent
                              ? 'text-[#3b3b40]'
                              : 'text-slate-700',
                        )}
                      >
                        {date.getDate()}
                      </p>
                      <div className="mt-0.5 min-h-0 min-w-0 max-w-full flex-1">
                        <ul className="m-0 flex min-w-0 list-none flex-col gap-0.5 p-0 sm:gap-1">
                          {shown.map((lesson) => (
                            <li
                              key={getLessonKey(lesson)}
                              className="min-w-0"
                              onClick={(event) => event.stopPropagation()}
                              onKeyDown={(event) => event.stopPropagation()}
                            >
                              {renderLesson({ lesson, variant: 'cell' })}
                            </li>
                          ))}
                        </ul>
                        {hidden > 0 && (
                          <div className="mt-0.5 sm:mt-1">
                            {cellOpensDialog ? (
                              <p
                                className={cn(
                                  'w-full max-w-full truncate px-1 py-0.5 text-left text-[9px] font-medium sm:text-[10px]',
                                  isStudent ? 'text-[#1010a3]' : 'text-slate-600',
                                )}
                              >
                                {overflowLabel === 'threePlus'
                                  ? '3+'
                                  : `+${hidden}${overflowLabel === 'more' ? ' more' : ''}`}
                              </p>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setDayDialog({ date, lessons: dayLessons })
                                }
                                className={cn(
                                  'w-full max-w-full truncate rounded border px-1 py-0.5 text-left text-[9px] font-medium transition sm:text-[10px]',
                                  isStudent
                                    ? 'border-[rgba(14,14,16,0.07)] bg-[#f6f6f7] text-[#1010a3] hover:bg-[#ddecff]/60'
                                    : 'border-slate-200/90 bg-slate-50/90 text-slate-600 hover:border-slate-300 hover:bg-slate-100/90',
                                )}
                                aria-label={`View ${hidden} more lesson${hidden === 1 ? '' : 's'} for ${date.toDateString()}`}
                              >
                                {overflowLabel === 'threePlus'
                                  ? '3+'
                                  : `+${hidden}${overflowLabel === 'more' ? ' more' : ''}`}
                              </button>
                            )}
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
          <DialogContent
            sheet
            className="flex max-h-[min(92vh,720px)] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
          >
            <DialogHeader
              className={cn(
                'shrink-0 border-b p-4 pb-3 sm:p-5',
                isStudent ? 'border-[rgba(14,14,16,0.07)]' : 'border-slate-100',
              )}
            >
              <DialogTitle
                className={cn(
                  'pr-8 text-left text-base font-semibold sm:text-lg',
                  isStudent && 'text-[#1010a3]',
                )}
              >
                {formatLocaleDate(dayDialog.date, locale, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </DialogTitle>
            </DialogHeader>
            <ul className="min-h-0 flex-1 list-none space-y-1.5 overflow-y-auto p-3 sm:space-y-2 sm:p-4">
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
