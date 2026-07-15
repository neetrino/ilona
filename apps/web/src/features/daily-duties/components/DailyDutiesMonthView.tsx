import { CalendarMonthGrid } from '@/shared/components/calendar/CalendarMonthGrid';
import { cn } from '@/shared/lib/utils';
import type { Lesson } from '@/features/lessons';
import { useTranslations } from 'next-intl';
import { getLessonAssignedTeacherName } from '@/shared/lib/daily-duties/format-lesson-group-teachers';
import { formatDailyDutiesLessonTime } from './daily-duties-display.util';

interface DailyDutiesMonthViewProps {
  monthDates: (Date | null)[][];
  lessonsByDate: Record<string, Lesson[]>;
  isLoading: boolean;
  onLessonClick: (lessonId: string) => void;
}

export function DailyDutiesMonthView({
  monthDates,
  lessonsByDate,
  isLoading,
  onLessonClick,
}: DailyDutiesMonthViewProps) {
  const t = useTranslations('dailyDuties');

  return (
    <div className="w-full min-w-0 overflow-x-auto rounded-[15px] border border-[rgba(14,14,16,0.07)] bg-white [-webkit-overflow-scrolling:touch]">
      <div className="min-w-[36rem]">
        <CalendarMonthGrid<Lesson>
          monthDates={monthDates}
          getLessonsForDay={(k) => lessonsByDate[k] ?? []}
          getLessonKey={(l) => l.id}
          getSortTime={(l) => new Date(l.scheduledAt).getTime()}
          isLoading={isLoading}
          scrollAreaClassName="overflow-y-visible overscroll-auto"
          maxVisibleOverride={3}
          openDayDialogOnCellClick
          overflowLabel="count"
          renderLesson={({ lesson, variant }) => {
            const teacherName = getLessonAssignedTeacherName(lesson, t('unknownTeacher'));
            const isCell = variant === 'cell';

            return (
              <button
                type="button"
                onClick={() => onLessonClick(lesson.id)}
                title={`${formatDailyDutiesLessonTime(lesson.scheduledAt, lesson.duration)} · ${lesson.group?.name ?? t('lessonUnknown')} · ${teacherName}`}
                className={cn(
                  'w-full min-w-0 max-w-full rounded border border-blue-100/90 bg-blue-50/90 text-left text-[#3b3b40] transition hover:border-blue-200 hover:bg-blue-100/80',
                  isCell
                    ? 'space-y-0.5 px-1.5 py-0.5 text-[9px] leading-tight sm:px-2 sm:py-1 sm:text-[10px] sm:leading-tight'
                    : 'space-y-1 px-3 py-2.5 text-sm',
                )}
              >
                <span className="block font-medium">
                  {formatDailyDutiesLessonTime(lesson.scheduledAt, lesson.duration)}
                </span>
                <span className="block break-words">
                  {lesson.group?.name ?? t('lessonUnknown')}
                </span>
                <span className="block break-words text-[#8b8b90]">{teacherName}</span>
                {lesson.substituteTeacher?.user ? (
                  <span className="block break-words text-amber-800">
                    {t('substituteShort')} {lesson.substituteTeacher.user.firstName}{' '}
                    {lesson.substituteTeacher.user.lastName}
                  </span>
                ) : null}
              </button>
            );
          }}
        />
      </div>
    </div>
  );
}
