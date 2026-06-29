'use client';

import type { Lesson } from '@/features/lessons';
import { formatScheduleDate } from '@/features/schedule/schedule-dates';
import { cn } from '@/shared/lib/utils';
import { studentScheduleTable } from '@/features/student-ui/tokens';
import { ScheduleLessonCard } from './ScheduleLessonCard';
import { formatMinutesToLabel, formatWeekdayLabel } from './schedule-lesson-views.util';
import type { ScheduleUiVariant } from './schedule-lesson-views.types';

interface WeekLessonGridDesktopTableProps {
  weekDates: Date[];
  slots: number[];
  cells: Map<string, Lesson[]>;
  highlightPastLessonCards: boolean;
  referenceTime: Date;
  theme: ScheduleUiVariant;
  forceMobileLayout: boolean;
}

export function WeekLessonGridDesktopTable({
  weekDates,
  slots,
  cells,
  highlightPastLessonCards,
  referenceTime,
  theme,
  forceMobileLayout,
}: WeekLessonGridDesktopTableProps) {
  const isStudent = theme === 'student';

  return (
    <div className={cn('hidden', forceMobileLayout ? 'min-[769px]:block' : 'sm:block')}>
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
                  <div className="text-[9px] font-medium normal-case">{date.getDate()}</div>
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
                    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
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
                          <ScheduleLessonCard
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
  );
}
