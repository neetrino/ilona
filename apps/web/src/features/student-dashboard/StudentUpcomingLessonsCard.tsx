'use client';

import { useMemo, useState } from 'react';
import { PublicAssetImage } from '@/shared/components/ui';
import { useLocale, useTranslations } from 'next-intl';
import { StudentAnimatedPillSwitcher } from '@/features/student-ui';
import type { StudentUpcomingLesson } from '@/features/students';
import { LessonListDateCell } from '@/shared/components/daily-duties/LessonListDateCell';
import { STUDENT_DASHBOARD_ASSETS } from './assets';

type FilterKey = 'today' | 'week' | 'month';

type StudentUpcomingLessonsCardProps = {
  lessons: StudentUpcomingLesson[];
  isLoading?: boolean;
};

function isSameLocalCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function filterLessons(lessons: StudentUpcomingLesson[], filter: FilterKey): StudentUpcomingLesson[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const endOfWeek = new Date(startOfToday);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  return lessons
    .filter((lesson) => {
      const date = new Date(lesson.scheduledAt);
      if (date.getTime() < now.getTime()) return false;
      if (filter === 'today') return isSameLocalCalendarDay(date, now);
      if (filter === 'week') return date >= startOfToday && date < endOfWeek;
      return date >= startOfToday && date <= endOfMonth;
    })
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 3);
}

function LessonRow({
  lesson,
  locale,
  tCommon,
  detailsLabel,
}: {
  lesson: StudentUpcomingLesson;
  locale: string;
  tCommon: (key: string) => string;
  detailsLabel: string;
}) {
  const teacherName = `${lesson.teacher?.user?.firstName ?? ''} ${lesson.teacher?.user?.lastName ?? ''}`.trim();

  return (
    <div className="flex flex-col gap-3 rounded-[1.125rem] border border-[rgba(14,14,16,0.07)] bg-[#fafafa] p-4 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_8px_22px_rgba(14,14,16,0.07)] sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="shrink-0 self-start origin-left scale-[0.92] sm:scale-[0.82]">
          <LessonListDateCell
            dateStr={lesson.scheduledAt}
            locale={locale}
            durationMinutes={lesson.duration}
          />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold tracking-tight text-[#1010a3] sm:text-sm">
              {lesson.topic?.trim() || tCommon('searchTypeLesson')}
            </p>
            <p className="mt-1 truncate text-[15px] font-medium leading-snug text-[#3b3b40]">
              {teacherName || '—'}
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-9 shrink-0 items-center gap-1 self-center rounded-full bg-[#d9d9f4] pl-3 pr-1 text-xs font-semibold text-[#1010a3] transition-colors hover:bg-[#c9c9ef] sm:hidden"
          >
            {detailsLabel}
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1010a3]">
              <PublicAssetImage
                src={STUDENT_DASHBOARD_ASSETS.arrowDetails}
                alt=""
                width={12}
                height={12}
              />
            </span>
          </button>
        </div>
      </div>
      <button
        type="button"
        className="hidden h-10 shrink-0 items-center justify-start gap-1 rounded-full bg-[#d9d9f4] pl-4 pr-1 text-xs font-semibold text-[#1010a3] transition-colors hover:bg-[#c9c9ef] sm:inline-flex"
      >
        {detailsLabel}
        <span className="flex h-[1.8125rem] w-[1.8125rem] shrink-0 items-center justify-center rounded-[1.25rem] bg-[#1010a3]">
          <PublicAssetImage src={STUDENT_DASHBOARD_ASSETS.arrowDetails} alt="" width={14} height={14} />
        </span>
      </button>
    </div>
  );
}

export function StudentUpcomingLessonsCard({
  lessons,
  isLoading,
}: StudentUpcomingLessonsCardProps) {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [filter, setFilter] = useState<FilterKey>('today');

  const filtered = useMemo(() => filterLessons(lessons, filter), [lessons, filter]);
  const weekCount = useMemo(() => filterLessons(lessons, 'week').length, [lessons]);

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'today', label: t('filters.today') },
    { key: 'week', label: t('filters.week') },
    { key: 'month', label: t('filters.month') },
  ];

  return (
    <section className="flex h-full min-h-0 flex-col rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-semibold tracking-tight text-[#1010a3]">
            {t('upcomingLessonsTitle')}
          </h3>
          <p className="mt-1 text-xs text-[#8b8b90]">
            {t('upcoming.scheduledCount', { count: weekCount })}
          </p>
        </div>
        <StudentAnimatedPillSwitcher
          options={filters.map(({ key, label }) => ({ value: key, label }))}
          value={filter}
          onChange={setFilter}
          shape="rectangular"
          size="md"
          className="w-full shrink-0 sm:w-auto"
        />
      </div>

      <div className="mt-5 min-h-0 flex-1 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[5.375rem] animate-pulse rounded-[1.125rem] bg-[#f6f6f7]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#8b8b90]">{t('noUpcomingLessons')}</p>
        ) : (
          filtered.map((lesson) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              locale={locale}
              tCommon={tCommon}
              detailsLabel={t('lessonDetails')}
            />
          ))
        )}
      </div>
    </section>
  );
}
