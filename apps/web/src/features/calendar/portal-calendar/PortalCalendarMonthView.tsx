import { CalendarMonthGrid } from '@/shared/components/calendar/CalendarMonthGrid';
import { cn } from '@/shared/lib/utils';
import type { Lesson } from '@/features/lessons';
import { useLocale, useTranslations } from 'next-intl';
import { formatCalendarLessonTime } from './portal-calendar-display.util';

interface PortalCalendarMonthViewProps {
  monthDates: (Date | null)[][];
  lessonsByDate: Record<string, Lesson[]>;
  isLoading: boolean;
  portalBasePath: string;
  router: { push: (href: string) => void };
}

export function PortalCalendarMonthView({
  monthDates,
  lessonsByDate,
  isLoading,
  portalBasePath,
  router,
}: PortalCalendarMonthViewProps) {
  const t = useTranslations('calendar');
  const locale = useLocale();

  return (
    <div className="w-full min-w-0 overflow-x-auto rounded-xl border border-[rgba(14,14,16,0.07)] bg-white [-webkit-overflow-scrolling:touch]">
      <div className="min-w-[36rem]">
        <div className="h-[min(70vh,720px)] min-h-0 overflow-hidden">
          <CalendarMonthGrid<Lesson>
            monthDates={monthDates}
            getLessonsForDay={(k) => lessonsByDate[k] ?? []}
            getLessonKey={(l) => l.id}
            getSortTime={(l) => new Date(l.scheduledAt).getTime()}
            isLoading={isLoading}
            renderLesson={({ lesson, variant }) => (
              <button
                type="button"
                onClick={() => router.push(`/${locale}${portalBasePath}/calendar/${lesson.id}`)}
                className={cn(
                  'w-full min-w-0 max-w-full truncate rounded border border-blue-100/90 bg-blue-50/90 text-left text-[#3b3b40] transition hover:border-blue-200 hover:bg-blue-100/80',
                  variant === 'cell'
                    ? 'px-1.5 py-0.5 text-[9px] leading-tight sm:px-2 sm:py-1 sm:text-[10px] sm:leading-tight'
                    : 'px-3 py-2.5 text-sm',
                )}
              >
                {formatCalendarLessonTime(lesson.scheduledAt)} · {lesson.group?.name ?? t('lessonUnknown')}
                {lesson.substituteTeacher?.user
                  ? ` · ${t('substituteShort')} ${lesson.substituteTeacher.user.firstName[0]}.`
                  : ''}
              </button>
            )}
          />
        </div>
      </div>
    </div>
  );
}
