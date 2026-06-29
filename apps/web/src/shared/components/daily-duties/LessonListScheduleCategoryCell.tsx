'use client';

import { Badge } from '@/shared/components/ui/badge';
import type { TeacherDailyDutiesRowCategory } from '@/shared/lib/daily-duties/teacher-daily-duties-list-order';

export type LessonListScheduleCategoryLabels = {
  upcoming: string;
  upcomingNext: string;
  today: string;
  completed: string;
  todayPastSlot: string;
};

export function LessonListScheduleCategoryCell({
  scheduleCategory,
  scheduleCategoryLabels,
  isPastInstant,
}: {
  scheduleCategory: TeacherDailyDutiesRowCategory;
  scheduleCategoryLabels: LessonListScheduleCategoryLabels;
  isPastInstant: boolean;
}) {
  return (
    <td className="px-3 py-3 align-middle text-center">
      <div className="flex min-h-[1.75rem] min-w-[7rem] flex-col items-center justify-center gap-1">
        {scheduleCategory === 'upcoming-next' && (
          <>
            <Badge variant="info" className="bg-sky-100 text-sky-800 border-sky-200 text-[10px] uppercase">
              {scheduleCategoryLabels.upcoming}
            </Badge>
            <Badge variant="default" className="text-[10px] bg-amber-50 text-amber-900 border-amber-200">
              {scheduleCategoryLabels.upcomingNext}
            </Badge>
          </>
        )}
        {scheduleCategory === 'upcoming-later' && (
          <Badge variant="info" className="bg-sky-100 text-sky-800 border-sky-200 text-[10px] uppercase">
            {scheduleCategoryLabels.upcoming}
          </Badge>
        )}
        {scheduleCategory === 'today' && (
          <>
            <Badge variant="info" className="bg-indigo-100 text-indigo-800 border-indigo-200 text-[10px] uppercase">
              {scheduleCategoryLabels.today}
            </Badge>
            {isPastInstant && (
              <span className="text-[10px] font-medium text-slate-500">{scheduleCategoryLabels.todayPastSlot}</span>
            )}
          </>
        )}
        {scheduleCategory === 'completed' && (
          <Badge variant="default" className="bg-slate-200 text-slate-800 border-slate-300 text-[10px] uppercase">
            {scheduleCategoryLabels.completed}
          </Badge>
        )}
      </div>
    </td>
  );
}
