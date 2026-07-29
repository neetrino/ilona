'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { endOfZonedDay, getZonedParts, startOfZonedDay, toYmd } from '@ilona/types';
import { useLessons, type Lesson } from '@/features/lessons';
import { GroupIconDisplay } from '@/features/groups';
import { PublicAssetImage } from '@/shared/components/ui';
import { STUDENT_DASHBOARD_ASSETS } from '@/features/student-dashboard/assets';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { getAdminPortalBasePath } from '@/shared/lib/role-routes';
import { formatAppTime } from '@/shared/lib/app-timezone';

const PREVIEW_LIMIT = 8;

type LessonRowProps = {
  locale: string;
  basePath: string;
  lesson: Lesson;
  detailsLabel: string;
  noTeacherLabel: string;
};

type LessonHeaderProps = {
  title: string;
  subtitle: string;
};

function LessonHeader({ title, subtitle }: LessonHeaderProps) {
  return (
    <header className="mb-4 flex flex-wrap items-end justify-between gap-3 sm:mb-5">
      <div>
        <h2 className="text-[clamp(0.875rem,1.25vw,1rem)] font-semibold tracking-tight text-[#1010a3]">
          {title}
        </h2>
        <p className="mt-1 text-sm text-[#8b8b90]">{subtitle}</p>
      </div>
    </header>
  );
}

function LessonRow({
  locale,
  basePath,
  lesson,
  detailsLabel,
  noTeacherLabel,
}: LessonRowProps) {
  const parts = getZonedParts(new Date(lesson.scheduledAt));
  const dayLabel = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0),
  ).toLocaleDateString(locale, { weekday: 'short', timeZone: 'UTC' });
  const startLabel = formatAppTime(lesson.scheduledAt, locale);
  const endInstant = new Date(
    new Date(lesson.scheduledAt).getTime() + lesson.duration * 60_000,
  );
  const endLabel = formatAppTime(endInstant, locale);
  const teacher = lesson.substituteTeacher ?? lesson.teacher;
  const teacherName = teacher
    ? `${teacher.user.firstName} ${teacher.user.lastName}`
    : noTeacherLabel;
  const centerName = lesson.group.center?.name ?? '—';

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-[1.5rem] border border-[rgba(14,14,16,0.09)] bg-white p-3.5 sm:flex-nowrap sm:gap-4 sm:p-4">
      <div className="h-[4.25rem] w-[4.25rem] shrink-0 overflow-hidden rounded-[1rem] border border-[rgba(14,14,16,0.08)] bg-white">
        <div className="bg-gradient-to-r from-[#ff9330] via-[#ff5f5f] to-[#ff2e88] px-2 py-1 text-center text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-white">
          {dayLabel}
        </div>
        <p className="pt-1.5 text-center text-[1.625rem] font-bold leading-none tracking-[-0.02em] text-[#1010a3]">
          {parts.day}
        </p>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <GroupIconDisplay
            iconKey={null}
            size={18}
            className="shrink-0 text-[#8b8b90]"
          />
          <p className="truncate text-[1.125rem] font-semibold tracking-[-0.02em] text-[#1010a3]">
            {lesson.group.name}
          </p>
        </div>
        <p className="mt-1 text-sm text-[#8b8b90]">
          {teacherName} · {centerName} · {startLabel} — {endLabel}
        </p>
      </div>
      <Link
        href={`/${locale}${basePath}/schedule`}
        className="mt-1 inline-flex h-11 w-full items-center justify-between rounded-full bg-[#d9d9f4] pl-4 pr-1.5 text-sm font-semibold text-[#1010a3] transition-colors hover:bg-[#ccccf2] sm:ml-auto sm:mt-0 sm:w-auto sm:justify-start"
      >
        {detailsLabel}
        <span className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#1010d0]">
          <PublicAssetImage
            src={STUDENT_DASHBOARD_ASSETS.arrowHero}
            alt=""
            width={16}
            height={16}
            className="h-4 w-4"
          />
        </span>
      </Link>
    </li>
  );
}

export function BranchScheduleBlock({ centerId }: { centerId?: string }) {
  const t = useTranslations('dashboard');
  const { locale } = useParams<{ locale: string }>();
  const { user } = useAuthStore();
  const basePath = getAdminPortalBasePath(user?.role);

  const { dateFrom, dateTo } = useMemo(() => {
    const ymd = toYmd(new Date());
    return {
      dateFrom: startOfZonedDay(ymd).toISOString(),
      dateTo: endOfZonedDay(ymd).toISOString(),
    };
  }, []);

  const { data, isLoading } = useLessons({
    centerId,
    dateFrom,
    dateTo,
    take: 50,
    sortBy: 'scheduledAt',
    sortOrder: 'asc',
  });

  const todayLessons = useMemo(() => {
    return (data?.items ?? [])
      .filter((lesson) => lesson.status !== 'CANCELLED')
      .slice(0, PREVIEW_LIMIT);
  }, [data?.items]);

  return (
    <section className="rounded-[2rem] border border-[rgba(14,14,16,0.07)] bg-[#f5f5f7] p-5 shadow-[0_10px_30px_-24px_rgba(16,16,163,0.45)] sm:p-6">
      <LessonHeader
        title={t('branchSchedule')}
        subtitle={t('teacherStats.todayLessonsCaption')}
      />
      {isLoading ? (
        <p className="text-sm text-[#8b8b90]">{t('loading')}</p>
      ) : todayLessons.length === 0 ? (
        <p className="text-sm text-[#8b8b90]">{t('noLessonsToday')}</p>
      ) : (
        <ul className="space-y-3">
          {todayLessons.map((lesson) => (
            <LessonRow
              key={lesson.id}
              locale={locale}
              basePath={basePath}
              lesson={lesson}
              detailsLabel={t('viewSchedule')}
              noTeacherLabel={t('noTeacher')}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
