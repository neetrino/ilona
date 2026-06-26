'use client';

import { isToday } from '@/features/attendance/utils/dateUtils';
import type { Lesson } from '@/features/lessons';
import { useLocale, useTranslations } from 'next-intl';

interface WeekLessonTableProps {
  weekDates: Date[];
  lessons: Lesson[];
  weekRangeLabel: string;
}

function getDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function WeekLessonTable({ weekDates, lessons, weekRangeLabel }: WeekLessonTableProps) {
  const t = useTranslations('attendance');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const lessonsByDate = lessons.reduce<Record<string, Lesson[]>>((acc, lesson) => {
    const dateKey = lesson.scheduledAt.split('T')[0];
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(lesson);
    return acc;
  }, {});

  return (
    <div className="overflow-hidden rounded-2xl border border-[#dde2ee] bg-white">
      <div className="flex items-center justify-between border-b border-[#e6e9f2] bg-[#f9faff] px-5 py-4">
        <button type="button" className="inline-flex h-8 w-8 items-center justify-center text-[#1e2742]" aria-label={tCommon('previousWeek')}>
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M15 18l-6-6 6-6" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h3 className="text-[14px] font-semibold text-[#111a3b] md:text-[20px]">{weekRangeLabel}</h3>
        <button type="button" className="inline-flex h-8 w-8 items-center justify-center text-[#1e2742]" aria-label={tCommon('nextWeek')}>
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 18l6-6-6-6" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div>
        {weekDates.map((date) => {
          const dateKey = getDateKey(date);
          const dayLessons = lessonsByDate[dateKey] ?? [];
          const active = isToday(date);

          return (
            <div
              key={dateKey}
              className={`grid grid-cols-[92px_1fr_44px] items-center border-b border-[#e9edf5] last:border-b-0 ${
                active ? 'bg-[#f5f7ff]' : 'bg-white'
              }`}
            >
              <div className="border-r border-[#e9edf5] px-4 py-3 text-center">
                <p className={`text-[14px] font-semibold uppercase ${active ? 'text-[#1010a3]' : 'text-[#3f4658]'}`}>
                  {date.toLocaleDateString(locale, { weekday: 'short' })}
                </p>
                <p className={`mt-1 text-[28px] font-semibold leading-none ${active ? 'text-[#1010a3]' : 'text-[#172033]'}`}>
                  {date.getDate()}
                </p>
              </div>

              <div className="px-5 py-3">
                <p className="text-[15px] font-semibold text-[#4f5f7f]">
                  {date.toLocaleDateString(locale, { month: 'long' })}
                </p>
                <p className="mt-0.5 text-[16px] italic text-[#62739a]">
                  {dayLessons.length > 0 ? t('sessionsCount', { count: dayLessons.length }) : t('selectLessons')}
                </p>
              </div>

              <div className="flex justify-center">
                <svg className="h-5 w-5 text-[#1f2942]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 18l6-6-6-6" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
