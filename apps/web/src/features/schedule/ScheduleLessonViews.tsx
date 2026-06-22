'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Lesson } from '@/features/lessons';
import { CalendarMonthGrid } from '@/shared/components/calendar/CalendarMonthGrid';
import { Clock3 } from 'lucide-react';
import {
  formatScheduleDate,
  isLessonStartStrictlyInFuture,
  scheduleDateKeyFromIso,
} from '@/features/schedule/schedule-dates';
import { cn } from '@/shared/lib/utils';
import { studentScheduleTable } from '@/features/student-ui/tokens';

type ScheduleUiVariant = 'default' | 'student';

const SCHEDULE_START_HOUR = 9;
const SCHEDULE_END_HOUR = 22;

interface WeekLessonGridProps {
  weekDates: Date[];
  lessons: Lesson[];
  isLoading?: boolean;
  /**
   * When true, card background follows lesson start vs now: past/start reached = green,
   * strictly future start = blue (schedule pages for all roles).
   */
  highlightPastLessonCards?: boolean;
  theme?: ScheduleUiVariant;
  forceMobileLayout?: boolean;
}

interface MonthLessonGridProps {
  monthDates: (Date | null)[][];
  lessonsByDate: Record<string, Lesson[]>;
  isLoading?: boolean;
  className?: string;
  /**
   * When true, card background follows lesson start vs now: past/start reached = green,
   * strictly future start = blue (schedule pages for all roles).
   */
  highlightPastLessonCards?: boolean;
  theme?: ScheduleUiVariant;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatMinutesToLabel(totalMinutes: number): string {
  const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const mm = String(totalMinutes % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatWeekdayLabel(date: Date): string {
  return date
    .toLocaleDateString('en-GB', { weekday: 'short' })
    .toUpperCase();
}

function formatWeekdayShort(date: Date): string {
  return date.toLocaleDateString('en-GB', { weekday: 'short' });
}

function getLessonTimeBounds(lesson: Lesson): { start: number; end: number } | null {
  const startDate = new Date(lesson.scheduledAt);
  if (Number.isNaN(startDate.getTime())) return null;
  const start = startDate.getHours() * 60 + startDate.getMinutes();
  const duration = lesson.duration > 0 ? lesson.duration : 60;
  const end = start + duration;
  return { start, end };
}

const PAST_LESSON_CARD_CLASSES = 'border-green-200 bg-green-50';
const FUTURE_LESSON_CARD_CLASSES = 'border-blue-200 bg-blue-50';

function lessonCardTone(
  lesson: Lesson,
  options: { highlightPastLessonCards: boolean; referenceTime: Date; variant: ScheduleUiVariant },
): string {
  const isStudent = options.variant === 'student';
  if (lesson.status === 'CANCELLED' || lesson.status === 'MISSED') {
    return isStudent ? studentScheduleTable.mutedCard : 'border-slate-200 bg-slate-100';
  }
  if (options.highlightPastLessonCards) {
    if (isLessonStartStrictlyInFuture(lesson.scheduledAt, options.referenceTime)) {
      return isStudent ? studentScheduleTable.futureCard : FUTURE_LESSON_CARD_CLASSES;
    }
    if (lesson.status === 'COMPLETED') return PAST_LESSON_CARD_CLASSES;
    if (lesson.status === 'IN_PROGRESS') return 'border-amber-200 bg-amber-50';
    return PAST_LESSON_CARD_CLASSES;
  }
  if (lesson.status === 'COMPLETED') return PAST_LESSON_CARD_CLASSES;
  if (lesson.status === 'IN_PROGRESS') return 'border-amber-200 bg-amber-50';
  return isStudent ? studentScheduleTable.defaultCard : 'border-primary/15 bg-primary/5';
}

function LessonCard({
  lesson,
  variant = 'cell',
  highlightPastLessonCards = false,
  referenceTime,
  uiVariant = 'default',
}: {
  lesson: Lesson;
  variant?: 'cell' | 'dialog';
  highlightPastLessonCards?: boolean;
  referenceTime: Date;
  uiVariant?: ScheduleUiVariant;
}) {
  const compact = variant === 'cell';
  const teacherName = `${lesson.teacher?.user?.firstName ?? ''} ${lesson.teacher?.user?.lastName ?? ''}`.trim() || 'No teacher';
  const timeBounds = getLessonTimeBounds(lesson);
  const timeLabel = timeBounds
    ? `${formatMinutesToLabel(timeBounds.start)}-${formatMinutesToLabel(timeBounds.end)}`
    : formatTime(lesson.scheduledAt);

  return (
    <div
      className={`rounded-md border leading-snug ${lessonCardTone(lesson, { highlightPastLessonCards, referenceTime, variant: uiVariant })} ${compact ? 'px-1.5 py-1 text-[10px]' : 'px-2.5 py-2 text-sm'}`}
    >
      <div
        className={cn(
          'truncate font-semibold',
          uiVariant === 'student' ? studentScheduleTable.lessonTitle : 'text-slate-800',
        )}
        title={lesson.group?.name}
      >
        {lesson.group?.name ?? 'Unknown group'}
        {lesson.group?.level ? (
          <span
            className={cn(
              'font-normal',
              uiVariant === 'student' ? studentScheduleTable.lessonMeta : 'text-slate-500',
            )}
          >
            {' '}
            · {lesson.group.level}
          </span>
        ) : null}
      </div>
      <div
        className={cn(
          'truncate',
          uiVariant === 'student' ? studentScheduleTable.lessonSub : 'text-slate-600',
        )}
        title={teacherName}
      >
        {teacherName}
      </div>
      <div
        className={cn(
          'truncate font-medium',
          uiVariant === 'student' ? studentScheduleTable.lessonMeta : 'text-slate-500',
        )}
      >
        {timeLabel}
      </div>
    </div>
  );
}

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
  const todayWeekIndex = useMemo(() => {
    const todayKey = formatScheduleDate(new Date());
    const idx = weekDates.findIndex((date) => formatScheduleDate(date) === todayKey);
    return idx >= 0 ? idx : 0;
  }, [weekDates]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(todayWeekIndex);
  useEffect(() => {
    setSelectedDayIndex(todayWeekIndex);
  }, [todayWeekIndex]);
  const { slots, cells, totalLessons } = useMemo(() => {
    const groupedByDay = weekDates.map((date) => {
      const dayKey = formatScheduleDate(date);
      return lessons
        .filter((lesson) => scheduleDateKeyFromIso(lesson.scheduledAt) === dayKey)
        .sort(
          (a, b) =>
            new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
        );
    });

    const timeline = Array.from(
      { length: SCHEDULE_END_HOUR - SCHEDULE_START_HOUR + 1 },
      (_, idx) => (SCHEDULE_START_HOUR + idx) * 60,
    );

    const map = new Map<string, Lesson[]>();
    groupedByDay.forEach((dayLessons, dayIdx) => {
      for (const lesson of dayLessons) {
        const boundsData = getLessonTimeBounds(lesson);
        if (!boundsData) continue;
        const rowHour = Math.floor(boundsData.start / 60) * 60;
        const key = `${dayIdx}|${rowHour}`;
        const bucket = map.get(key) ?? [];
        bucket.push(lesson);
        map.set(key, bucket);
      }
    });

    return {
      slots: timeline,
      cells: map,
      totalLessons: groupedByDay.reduce((sum, day) => sum + day.length, 0),
    };
  }, [lessons, weekDates]);
  const lessonsByDay = useMemo(
    () =>
      weekDates.map((date) => {
        const dayKey = formatScheduleDate(date);
        return lessons
          .filter((lesson) => scheduleDateKeyFromIso(lesson.scheduledAt) === dayKey)
          .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
      }),
    [lessons, weekDates],
  );
  const selectedDate = weekDates[selectedDayIndex] ?? weekDates[0];
  const selectedDayLessons = lessonsByDay[selectedDayIndex] ?? [];

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

  if (totalLessons === 0) {
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
      <div
        className={cn(
          forceMobileLayout ? 'min-[769px]:hidden' : 'sm:hidden',
        )}
      >
        <div className="border-b border-[rgba(14,14,16,0.08)] px-3 pb-3 pt-2">
          <div
            className={cn(
              'flex gap-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
              forceMobileLayout ? 'justify-center overflow-x-visible' : 'overflow-x-auto',
            )}
          >
            {weekDates.map((date, idx) => {
              const isActive = idx === selectedDayIndex;
              return (
                <button
                  key={`${formatScheduleDate(date)}-${idx}`}
                  type="button"
                  onClick={() => setSelectedDayIndex(idx)}
                  className={cn(
                    'min-w-[4.35rem] rounded-2xl border px-2.5 py-2 text-center transition-colors',
                    isActive
                      ? 'border-[#1010a3] bg-[#1010a3] text-white'
                      : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40]',
                  )}
                >
                  <p className="text-xs font-semibold leading-tight">{formatWeekdayShort(date)}</p>
                  <p className="mt-0.5 text-[13px] font-semibold leading-tight">{date.getDate()}</p>
                </button>
              );
            })}
          </div>
        </div>
        <div className="px-3 py-3">
          <h3 className="text-[1.85rem] font-semibold tracking-[-0.02em] text-[#1f2937]">
            {selectedDate.toLocaleDateString('en-GB', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </h3>
          {selectedDayLessons.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-[rgba(14,14,16,0.1)] bg-white p-5 text-sm text-[#8b8b90]">
              No lessons scheduled.
            </div>
          ) : (
            <div className="mt-4 space-y-3 pb-3">
              {selectedDayLessons.map((lesson) => {
                const startDate = new Date(lesson.scheduledAt);
                const startLabel = formatTime(lesson.scheduledAt);
                const endDate = new Date(startDate.getTime() + (lesson.duration > 0 ? lesson.duration : 60) * 60000);
                const endLabel = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
                const isFuture = isLessonStartStrictlyInFuture(lesson.scheduledAt, referenceTime);
                const cardToneClass =
                  lesson.status === 'CANCELLED' || lesson.status === 'MISSED'
                    ? 'border-slate-200 bg-slate-100'
                    : isFuture
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-emerald-200 bg-emerald-50';
                const dotColorClass =
                  lesson.status === 'CANCELLED' || lesson.status === 'MISSED'
                    ? 'bg-slate-400'
                    : isFuture
                      ? 'bg-blue-400'
                      : 'bg-emerald-400';
                const teacherName =
                  `${lesson.teacher?.user?.firstName ?? ''} ${lesson.teacher?.user?.lastName ?? ''}`.trim() ||
                  'No teacher';

                return (
                  <div key={lesson.id} className="relative pl-[5.25rem]">
                    <div className="absolute left-0 top-1 text-[1.05rem] font-semibold text-[#6b7280]">{startLabel}</div>
                    <div className="absolute left-[4.05rem] top-0 h-full border-l border-dashed border-[rgba(14,14,16,0.12)]" />
                    <span className={cn('absolute left-[3.72rem] top-2.5 h-2.5 w-2.5 rounded-full', dotColorClass)} />
                    <article className={cn('ml-3 rounded-2xl border px-4 py-3', cardToneClass)}>
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold tracking-[-0.01em] text-[#1f2937]">
                          {lesson.group?.name ?? 'Unknown group'}
                          {lesson.group?.level ? (
                            <span className="font-medium text-[#64748b]"> · {lesson.group.level}</span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 truncate text-[1rem] text-[#475569]">{teacherName}</p>
                        <p className="mt-1 inline-flex items-center gap-1.5 text-[0.95rem] text-[#334155]">
                          <Clock3 className="h-4 w-4" />
                          {startLabel} - {endLabel}
                        </p>
                      </div>
                    </article>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div
        className={cn(
          'hidden',
          forceMobileLayout ? 'min-[769px]:block' : 'sm:block',
        )}
      >
      <table className="w-full border-collapse table-fixed">
        <thead>
          <tr>
            <th
              className={cn(
                'w-16 border-b-2 border-r-2 px-2 py-1 text-left text-[10px] font-semibold uppercase',
                isStudent
                  ? `${studentScheduleTable.border} ${studentScheduleTable.headBg} ${studentScheduleTable.headText}`
                  : 'border-slate-200 bg-slate-50 text-slate-500',
              )}
            >
              Time
            </th>
            {weekDates.map((date, dayIdx) => (
              <th
                key={`${formatScheduleDate(date)}-${dayIdx}`}
                className={cn(
                  'border-b-2 border-r-2 px-2 py-1 text-center text-[10px] font-semibold uppercase last:border-r-0',
                  isStudent
                    ? `${studentScheduleTable.border} ${studentScheduleTable.headBg} ${studentScheduleTable.headText}`
                    : 'border-slate-200 bg-slate-50 text-slate-500',
                )}
              >
                <div className="leading-tight">
                  <div>{formatWeekdayLabel(date)}</div>
                  <div className="text-[9px] font-medium normal-case">
                    {date.getDate()}
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slots.map((slot) => {
            const rowHasLessons = weekDates.some((_, dayIdx) => {
              const key = `${dayIdx}|${slot}`;
              return (cells.get(key) ?? []).length > 0;
            });
            return (
            <tr key={slot} className="align-top">
              <td
                className={cn(
                  'border-b-2 border-r-2 px-1.5 py-1 text-[10px] font-semibold align-top',
                  rowHasLessons ? 'min-h-0' : 'h-8',
                  isStudent
                    ? `${studentScheduleTable.border} ${studentScheduleTable.cellText}`
                    : 'border-slate-200 text-slate-500',
                )}
              >
                {formatMinutesToLabel(slot)}
              </td>
              {weekDates.map((_, dayIdx) => {
                const key = `${dayIdx}|${slot}`;
                const items = (cells.get(key) ?? []).sort(
                  (a, b) =>
                    new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
                );
                return (
                  <td
                    key={key}
                    className={cn(
                      'border-b-2 border-r-2 px-0.5 py-0.5 align-top last:border-r-0',
                      rowHasLessons ? 'min-h-0' : 'h-8',
                      isStudent ? studentScheduleTable.border : 'border-slate-200',
                    )}
                  >
                    <div className="space-y-1">
                      {items.map((lesson) => (
                        <LessonCard
                          key={lesson.id}
                          lesson={lesson}
                          highlightPastLessonCards={highlightPastLessonCards}
                          referenceTime={referenceTime}
                          uiVariant={theme}
                        />
                      ))}
                    </div>
                  </td>
                );
              })}
            </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}

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
      renderLesson={({ lesson, variant: cardVariant }) => (
        <LessonCard
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
