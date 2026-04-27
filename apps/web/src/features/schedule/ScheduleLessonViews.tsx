'use client';

import { useMemo } from 'react';
import type { Lesson } from '@/features/lessons';
import { CalendarMonthGrid } from '@/shared/components/calendar/CalendarMonthGrid';
import { cn } from '@/shared/lib/utils';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SCHEDULE_START_HOUR = 9;
const SCHEDULE_END_HOUR = 22;

interface WeekLessonGridProps {
  weekDates: Date[];
  lessons: Lesson[];
  isLoading?: boolean;
}

interface MonthLessonGridProps {
  monthDates: (Date | null)[][];
  lessonsByDate: Record<string, Lesson[]>;
  isLoading?: boolean;
  className?: string;
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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

function getLessonTimeBounds(lesson: Lesson): { start: number; end: number } | null {
  const startDate = new Date(lesson.scheduledAt);
  if (Number.isNaN(startDate.getTime())) return null;
  const start = startDate.getHours() * 60 + startDate.getMinutes();
  const duration = lesson.duration > 0 ? lesson.duration : 60;
  const end = start + duration;
  return { start, end };
}

function lessonCardTone(status: Lesson['status']): string {
  if (status === 'COMPLETED') return 'border-green-200 bg-green-50';
  if (status === 'IN_PROGRESS') return 'border-amber-200 bg-amber-50';
  if (status === 'CANCELLED' || status === 'MISSED') {
    return 'border-slate-200 bg-slate-100';
  }
  return 'border-primary/15 bg-primary/5';
}

function LessonCard({
  lesson,
  variant = 'cell',
}: {
  lesson: Lesson;
  variant?: 'cell' | 'dialog';
}) {
  const compact = variant === 'cell';
  const teacherName = `${lesson.teacher?.user?.firstName ?? ''} ${lesson.teacher?.user?.lastName ?? ''}`.trim() || 'No teacher';
  const timeBounds = getLessonTimeBounds(lesson);
  const timeLabel = timeBounds
    ? `${formatMinutesToLabel(timeBounds.start)}-${formatMinutesToLabel(timeBounds.end)}`
    : formatTime(lesson.scheduledAt);

  return (
    <div
      className={`rounded-md border leading-tight ${lessonCardTone(lesson.status)} ${compact ? 'px-1.5 py-0.5 text-[9px] sm:px-1.5 sm:py-1 sm:text-[10px]' : 'px-2.5 py-2 text-sm'}`}
    >
      <div className="font-semibold text-slate-800 truncate" title={lesson.group?.name}>
        {lesson.group?.name ?? 'Unknown group'}
        {lesson.group?.level ? (
          <span className="text-slate-500 font-normal"> · {lesson.group.level}</span>
        ) : null}
      </div>
      <div className="text-slate-600 truncate" title={teacherName}>
        {teacherName}
      </div>
      <div className="text-slate-500 truncate font-medium">
        {timeLabel}
      </div>
    </div>
  );
}

export function WeekLessonGrid({ weekDates, lessons, isLoading }: WeekLessonGridProps) {
  const { slots, cells, totalLessons } = useMemo(() => {
    const groupedByDay = weekDates.map((date) => {
      const dayKey = formatDateKey(date);
      return lessons
        .filter((lesson) => lesson.scheduledAt.startsWith(dayKey))
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

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading schedule...</div>;
  }

  if (totalLessons === 0) {
    return (
      <div className="h-full p-10 text-center text-sm text-slate-500 flex items-center justify-center">
        No lessons available.
      </div>
    );
  }

  return (
    <div className="h-full">
      <table className="w-full h-full border-collapse table-fixed">
        <thead>
          <tr>
            <th className="w-16 border-b-2 border-r-2 border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold uppercase text-slate-500 text-left">
              Time
            </th>
            {DAY_LABELS.map((day) => (
              <th
                key={day}
                className="border-b-2 border-r-2 last:border-r-0 border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold uppercase text-slate-500 text-center"
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slots.map((slot) => (
            <tr key={slot} className="align-top">
              <td className="h-8 border-b-2 border-r-2 border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                {formatMinutesToLabel(slot)}
              </td>
              {DAY_LABELS.map((_, dayIdx) => {
                const key = `${dayIdx}|${slot}`;
                const items = (cells.get(key) ?? []).sort(
                  (a, b) =>
                    new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
                );
                return (
                  <td
                    key={key}
                    className="h-8 border-b-2 border-r-2 last:border-r-0 border-slate-200 px-0.5 py-0.5 align-top"
                  >
                    <div className="space-y-0.5">
                      {items.map((lesson) => (
                        <LessonCard key={lesson.id} lesson={lesson} />
                      ))}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MonthLessonGrid({
  monthDates,
  lessonsByDate,
  isLoading,
  className,
}: MonthLessonGridProps) {
  const totalInMonth = useMemo(
    () => Object.values(lessonsByDate).reduce((n, list) => n + list.length, 0),
    [lessonsByDate],
  );

  if (!isLoading && totalInMonth === 0) {
    return (
      <div
        className={cn(
          'flex h-full min-h-0 flex-1 flex-col items-center justify-center rounded-b-[inherit] p-10 text-center text-sm text-slate-500',
          className,
        )}
      >
        No lessons available.
      </div>
    );
  }

  return (
    <CalendarMonthGrid<Lesson>
      monthDates={monthDates}
      getLessonsForDay={(k) => lessonsByDate[k] ?? []}
      getLessonKey={(l) => l.id}
      getSortTime={(l) => new Date(l.scheduledAt).getTime()}
      renderLesson={({ lesson, variant }) => (
        <LessonCard lesson={lesson} variant={variant} />
      )}
      isLoading={isLoading}
      className={className}
    />
  );
}
