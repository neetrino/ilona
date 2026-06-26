'use client';

import { useTranslations } from 'next-intl';
import { PortalDashboardStatCard } from '@/features/student-ui/PortalDashboardStatCard';
import { STUDENT_DASHBOARD_ASSETS } from '@/features/student-dashboard/assets';

type TeacherDashboardStatCardsProps = {
  todayLessonsCount: number;
  completedLessons: number;
  totalStudents: number;
  groupsCount: number;
  scheduledLessons: number;
  vocabularySent: number;
  isLoading?: boolean;
};

export function TeacherDashboardStatCards({
  todayLessonsCount,
  completedLessons,
  totalStudents,
  groupsCount,
  scheduledLessons,
  vocabularySent,
  isLoading,
}: TeacherDashboardStatCardsProps) {
  const t = useTranslations('dashboard');

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[10.75rem] animate-pulse rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white"
          />
        ))}
      </div>
    );
  }

  const completionPct =
    todayLessonsCount > 0 ? Math.round((completedLessons / todayLessonsCount) * 100) : 0;
  const vocabPct =
    todayLessonsCount > 0 ? Math.round((vocabularySent / todayLessonsCount) * 100) : 0;
  const pendingPct =
    todayLessonsCount > 0 ? Math.round((scheduledLessons / todayLessonsCount) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
      <PortalDashboardStatCard
        label={t('teacherStats.todayLessons')}
        valueNode={
          <>
            <span className="text-[2.375rem] font-bold leading-none tracking-[-0.03em] text-[#1010a3]">
              {todayLessonsCount}
            </span>
          </>
        }
        badge={
          completedLessons > 0 ? (
            <span className="rounded-full bg-[#e7f6ec] px-2 py-0.5 text-[0.6875rem] font-semibold text-[#0a7a3e]">
              {t('teacherStats.completed', { count: completedLessons })}
            </span>
          ) : null
        }
        caption={t('teacherStats.todayLessonsCaption')}
        progress={completionPct}
        iconSrc={STUDENT_DASHBOARD_ASSETS.iconBook}
        iconBg="bg-[#ddecff]"
      />
      <PortalDashboardStatCard
        label={t('teacherStats.students')}
        valueNode={
          <span className="text-[2.375rem] font-bold leading-none tracking-[-0.03em] text-[#1010a3]">
            {totalStudents}
          </span>
        }
        badge={
          <span className="rounded-full bg-[#d9d9f4] px-2 py-0.5 text-[0.6875rem] font-semibold text-[#1010a3]">
            {t('teacherStats.groups', { count: groupsCount })}
          </span>
        }
        caption={t('teacherStats.studentsCaption')}
        progress={Math.min(100, groupsCount * 20)}
        iconSrc={STUDENT_DASHBOARD_ASSETS.iconAttendance}
        iconBg="bg-[#dffc76]"
      />
      <PortalDashboardStatCard
        label={t('teacherStats.pending')}
        valueNode={
          <span className="text-[2.375rem] font-bold leading-none tracking-[-0.03em] text-[#1010a3]">
            {scheduledLessons}
          </span>
        }
        badge={
          scheduledLessons > 0 ? (
            <span className="rounded-full bg-[#fff0d6] px-2 py-0.5 text-[0.6875rem] font-semibold text-[#8b4a00]">
              {t('teacherStats.upcoming')}
            </span>
          ) : (
            <span className="rounded-full bg-[#e7f6ec] px-2 py-0.5 text-[0.6875rem] font-semibold text-[#0a7a3e]">
              {t('teacherStats.allDone')}
            </span>
          )
        }
        caption={t('teacherStats.pendingCaption')}
        progress={pendingPct}
        iconSrc={STUDENT_DASHBOARD_ASSETS.iconPending}
        iconBg="bg-[#fff0d6]"
      />
      <PortalDashboardStatCard
        label={t('teacherStats.vocabulary')}
        valueNode={
          <>
            <span className="text-[2.375rem] font-bold leading-none tracking-[-0.03em] text-[#1010a3]">
              {vocabularySent}
            </span>
            <span className="text-sm font-medium text-[#8b8b90]">/ {todayLessonsCount}</span>
          </>
        }
        badge={
          vocabPct < 100 && todayLessonsCount > 0 ? (
            <span className="rounded-full bg-[#fff0d6] px-2 py-0.5 text-[0.6875rem] font-semibold text-[#8b4a00]">
              {t('teacherStats.sendNow')}
            </span>
          ) : null
        }
        caption={t('teacherStats.vocabularyCaption')}
        progress={vocabPct}
        iconSrc={STUDENT_DASHBOARD_ASSETS.iconCard}
        iconBg="bg-[#ffeb8c]"
      />
    </div>
  );
}
