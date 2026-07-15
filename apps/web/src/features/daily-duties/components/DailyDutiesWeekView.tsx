import { formatScheduleDate } from '@/features/schedule/schedule-dates';
import type { Lesson } from '@/features/lessons';
import { useTranslations } from 'next-intl';
import {
  formatDailyDutiesLessonTime,
  getWeekLessonCardClass,
  isCalendarToday,
} from './daily-duties-display.util';
import { DailyDutiesLessonStatusUnderName } from '@/shared/lib/daily-duties/DailyDutiesLessonStatusBadge';
import { formatLessonGroupTeachersLabel } from '@/shared/lib/daily-duties/format-lesson-group-teachers';

interface DailyDutiesWeekViewProps {
  weekDates: Date[];
  lessonsByDate: Record<string, Lesson[]>;
  isLoading: boolean;
  isTeacherMode: boolean;
  hasActiveFilters: boolean;
  onLessonClick: (lessonId: string) => void;
}

export function DailyDutiesWeekView({
  weekDates,
  lessonsByDate,
  isLoading,
  isTeacherMode,
  hasActiveFilters,
  onLessonClick,
}: DailyDutiesWeekViewProps) {
  const t = useTranslations('dailyDuties');

  return (
    <div className="w-full min-w-0 overflow-x-auto rounded-[15px] border border-[rgba(14,14,16,0.07)] bg-white [-webkit-overflow-scrolling:touch]">
      <div className="min-w-[42rem]">
        <div className="grid grid-cols-7 border-b border-[rgba(14,14,16,0.07)]">
          {weekDates.map((date, i) => (
            <div
              key={i}
              className={`border-r border-[rgba(14,14,16,0.07)] p-3 text-center last:border-r-0 ${
                isCalendarToday(date) ? 'bg-blue-50' : ''
              }`}
            >
              <p className="text-xs text-[#8b8b90] uppercase">
                {date.toLocaleDateString('en-GB', { weekday: 'short' })}
              </p>
              <p
                className={`text-lg font-semibold ${
                  isCalendarToday(date) ? 'text-blue-600' : 'text-[#3b3b40]'
                }`}
              >
                {date.getDate()}
              </p>
            </div>
          ))}
        </div>

        <div className="grid min-h-[400px] grid-cols-7">
          {weekDates.map((date, i) => {
            const dateKey = formatScheduleDate(date);
            const dayLessons = lessonsByDate[dateKey] || [];

            return (
              <div
                key={i}
                className={`border-r border-[rgba(14,14,16,0.07)] p-2 last:border-r-0 ${
                  isCalendarToday(date) ? 'bg-blue-50/50' : ''
                }`}
              >
                {isLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-16 rounded-[15px] bg-[#f1f1f2]" />
                    <div className="h-16 rounded-[15px] bg-[#f1f1f2]" />
                  </div>
                ) : dayLessons.length === 0 ? (
                  <p className="py-4 text-center text-xs text-[#8b8b90]">
                    {hasActiveFilters
                      ? isTeacherMode
                        ? t('noOwnDutiesMatchFiltersShort')
                        : t('noLessonsMatchFiltersShort')
                      : isTeacherMode
                        ? t('noOwnDuties')
                        : t('noLessons')}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {dayLessons.map((lesson) => {
                      const teachersLabel = formatLessonGroupTeachersLabel(
                        lesson,
                        t('unknownTeacher'),
                      );

                      return (
                        <button
                          key={lesson.id}
                          type="button"
                          onClick={() => onLessonClick(lesson.id)}
                          className={`w-full rounded-[15px] border-l-4 p-2 text-left text-xs transition hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${getWeekLessonCardClass(lesson)}`}
                        >
                          <p className="truncate font-medium text-[#3b3b40]">
                            {formatDailyDutiesLessonTime(lesson.scheduledAt, lesson.duration)}
                          </p>
                          <p className="truncate text-[#3b3b40]">
                            {lesson.group?.name || t('lessonUnknown')}
                          </p>
                          <p className="truncate text-[#8b8b90]" title={teachersLabel}>
                            {teachersLabel}
                          </p>
                          <DailyDutiesLessonStatusUnderName lesson={lesson} />
                          {lesson.substituteTeacher?.user && (
                            <p
                              className="mt-0.5 truncate text-amber-800"
                              title={t('substituteTeacherTitle')}
                            >
                              {t('substituteShort')} {lesson.substituteTeacher.user.firstName}{' '}
                              {lesson.substituteTeacher.user.lastName}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
