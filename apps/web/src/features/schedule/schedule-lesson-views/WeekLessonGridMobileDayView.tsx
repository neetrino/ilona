'use client';

import { Clock3 } from 'lucide-react';
import type { Lesson } from '@/features/lessons';
import { formatScheduleDate, isLessonStartStrictlyInFuture } from '@/features/schedule/schedule-dates';
import { cn } from '@/shared/lib/utils';
import { formatScheduleTime, formatWeekdayShort } from './schedule-lesson-views.util';
import { ScheduleLessonTeachersLine } from './ScheduleLessonTeachersLine';

interface WeekLessonGridMobileDayViewProps {
  weekDates: Date[];
  selectedDayIndex: number;
  selectedDate: Date;
  selectedDayLessons: Lesson[];
  referenceTime: Date;
  forceMobileLayout: boolean;
  onSelectDay: (index: number) => void;
}

export function WeekLessonGridMobileDayView({
  weekDates,
  selectedDayIndex,
  selectedDate,
  selectedDayLessons,
  referenceTime,
  forceMobileLayout,
  onSelectDay,
}: WeekLessonGridMobileDayViewProps) {
  return (
    <div className={cn(forceMobileLayout ? 'min-[769px]:hidden' : 'sm:hidden')}>
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
                onClick={() => onSelectDay(idx)}
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
              const startLabel = formatScheduleTime(lesson.scheduledAt);
              const endDate = new Date(
                startDate.getTime() + (lesson.duration > 0 ? lesson.duration : 60) * 60000,
              );
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
              return (
                <div key={lesson.id} className="relative pl-[5.25rem]">
                  <div className="absolute left-0 top-1 text-[1.05rem] font-semibold text-[#6b7280]">
                    {startLabel}
                  </div>
                  <div className="absolute left-[4.05rem] top-0 h-full border-l border-dashed border-[rgba(14,14,16,0.12)]" />
                  <span
                    className={cn('absolute left-[3.72rem] top-2.5 h-2.5 w-2.5 rounded-full', dotColorClass)}
                  />
                  <article className={cn('ml-3 rounded-2xl border px-4 py-3', cardToneClass)}>
                    <div className="min-w-0">
                      <p className="break-words text-lg font-semibold tracking-[-0.01em] text-[#1f2937]">
                        {lesson.group?.name ?? 'Unknown group'}
                        {lesson.group?.level ? (
                          <span className="font-medium text-[#64748b]"> · {lesson.group.level}</span>
                        ) : null}
                      </p>
                      <ScheduleLessonTeachersLine
                        lesson={lesson}
                        className="mt-0.5 text-[1rem]"
                      />
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
  );
}
