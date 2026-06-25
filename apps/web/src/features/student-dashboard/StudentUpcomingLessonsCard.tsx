'use client';

import { useMemo, useState } from 'react';
import { PublicAssetImage } from '@/shared/components/ui';
import { useLocale, useTranslations } from 'next-intl';
import { StudentAnimatedPillSwitcher } from '@/features/student-ui';
import type { StudentUpcomingLesson } from '@/features/students';
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

function formatLessonMeta(
  scheduledAt: string,
  locale: string,
  tCommon: (key: string) => string,
): string {
  const date = new Date(scheduledAt);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dayLabel = isSameLocalCalendarDay(date, today)
    ? tCommon('today')
    : isSameLocalCalendarDay(date, tomorrow)
      ? tCommon('tomorrow')
      : date.toLocaleDateString(locale, { weekday: 'short' });

  const start = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  const endDate = new Date(date.getTime() + 60 * 60 * 1000);
  const end = endDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  return `${dayLabel} · ${start} – ${end}`;
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
  const date = new Date(lesson.scheduledAt);
  const dayNum = date.getDate();
  const weekday = date.toLocaleDateString(locale, { weekday: 'short' });

  return (
    <div className="flex flex-col gap-3 rounded-[1.125rem] border border-[rgba(14,14,16,0.07)] bg-[#fafafa] p-4 sm:flex-row sm:items-center sm:gap-4">
      <div className="relative h-[4.625rem] w-[3.375rem] shrink-0">
        <PublicAssetImage
          src={STUDENT_DASHBOARD_ASSETS.calendarIcon}
          alt=""
          fill
          className="object-contain object-left"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2 text-center">
          <span className="text-[0.625rem] font-medium uppercase text-[#8b8b90]">{weekday}</span>
          <span className="text-lg font-bold leading-none text-[#1010a3]">{dayNum}</span>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold tracking-tight text-[#1010a3]">
          {lesson.topic?.trim() || tCommon('searchTypeLesson')}
        </p>
        <p className="mt-1 text-xs text-[#8b8b90]">
          {teacherName || '—'} · {formatLessonMeta(lesson.scheduledAt, locale, tCommon)}
        </p>
      </div>
      <button
        type="button"
        className="inline-flex h-10 shrink-0 items-center gap-1 rounded-full bg-[#d9d9f4] pl-4 pr-1 text-xs font-semibold text-[#1010a3]"
      >
        {detailsLabel}
        <span className="flex h-[1.8125rem] w-[1.8125rem] items-center justify-center rounded-[1.25rem] bg-[#1010a3]">
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
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
          size="md"
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
