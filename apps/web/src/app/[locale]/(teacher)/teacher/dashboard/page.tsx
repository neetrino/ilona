'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { addCalendarDays, endOfZonedDay, startOfZonedDay, toYmd } from '@ilona/types';
import { DashboardLayout } from '@/shared/components/layout';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useLessons, useStartLesson, useCompleteLesson } from '@/features/lessons';
import { useMyGroups } from '@/features/groups';
import { PlannedAbsencesStaffBlock } from '@/features/attendance';
import { NotesBlock } from '@/features/teacher-notes';
import {
  TeacherDashboardHero,
  TeacherDashboardStatCards,
  TeacherDutyActionCards,
  TeacherTodayLessonsCard,
} from '@/features/teacher-dashboard';
import {
  StudentBadge,
  StudentCard,
  StudentInnerCard,
  StudentSectionHeader,
} from '@/features/student-ui';
import { useIsIPad } from '@/shared/hooks/useIsIPad';

export default function TeacherDashboardPage() {
  const tDash = useTranslations('dashboard');
  const isIPad = useIsIPad();
  const [isDesktopUp, setIsDesktopUp] = useState(false);
  useAuthStore();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const sync = () => setIsDesktopUp(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener('change', sync);
    return () => mediaQuery.removeEventListener('change', sync);
  }, []);

  const { recentFrom, recentTo, todayYmd } = useMemo(() => {
    const today = toYmd(new Date());
    const weekAgo = addCalendarDays(today, -7);
    return {
      todayYmd: today,
      recentFrom: startOfZonedDay(weekAgo).toISOString(),
      recentTo: endOfZonedDay(today).toISOString(),
    };
  }, []);

  const { data: lessonsData, isLoading: isLoadingLessons } = useLessons({
    dateFrom: recentFrom,
    dateTo: recentTo,
    take: 100,
    sortBy: 'scheduledAt',
    sortOrder: 'asc',
  });

  const { data: groups = [] } = useMyGroups();
  const startLesson = useStartLesson();
  const completeLesson = useCompleteLesson();

  const recentLessons = useMemo(
    () => (lessonsData?.items ?? []).filter((l) => l.status !== 'CANCELLED'),
    [lessonsData?.items],
  );

  const todayLessons = useMemo(
    () =>
      recentLessons.filter((l) => {
        const ymd = toYmd(l.scheduledAt);
        return ymd === todayYmd;
      }),
    [recentLessons, todayYmd],
  );

  const totalStudents = groups.reduce((sum, g) => sum + (g._count?.students || 0), 0);
  const scheduledLessons = todayLessons.filter((l) => l.status === 'SCHEDULED').length;
  const completedLessons = todayLessons.filter((l) => l.status === 'COMPLETED').length;
  const vocabularySent = todayLessons.filter((l) => l.vocabularySent).length;
  const isIPadProLayout = isIPad && isDesktopUp;

  const handleStartLesson = async (id: string) => {
    try {
      await startLesson.mutateAsync(id);
    } catch (err) {
      console.error('Failed to start lesson:', err);
    }
  };

  const handleCompleteLesson = async (id: string) => {
    try {
      await completeLesson.mutateAsync({ id });
    } catch (err) {
      console.error('Failed to complete lesson:', err);
    }
  };

  return (
    <DashboardLayout title="" subtitle="">
      <div className="flex w-full min-w-0 flex-col gap-5 lg:gap-6">
        <TeacherDashboardHero />

        <TeacherDashboardStatCards
          isLoading={isLoadingLessons}
          todayLessonsCount={todayLessons.length}
          completedLessons={completedLessons}
          totalStudents={totalStudents}
          groupsCount={groups.length}
          scheduledLessons={scheduledLessons}
          vocabularySent={vocabularySent}
        />

        <div className="flex w-full min-w-0 flex-col gap-5 lg:gap-6">
          {isIPadProLayout && groups.length > 0 ? (
            <StudentCard>
              <StudentSectionHeader title={tDash('teacherStats.myGroups')} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {groups.slice(0, 6).map((group) => (
                  <StudentInnerCard key={group.id}>
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h4 className="font-medium text-[#1010a3]">{group.name}</h4>
                      {group.level ? (
                        <StudentBadge variant="info">{group.level}</StudentBadge>
                      ) : null}
                    </div>
                    <p className="text-sm text-[#8b8b90]">
                      {group._count?.students || 0} students · {group._count?.lessons || 0}{' '}
                      lessons
                    </p>
                    {group.center?.name ? (
                      <p className="mt-1 text-xs text-[#8b8b90]">{group.center.name}</p>
                    ) : null}
                  </StudentInnerCard>
                ))}
              </div>
            </StudentCard>
          ) : null}

          <div className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] xl:gap-6">
            <TeacherTodayLessonsCard
              className="h-full min-h-0"
              lessons={todayLessons}
              isLoading={isLoadingLessons}
              onStartLesson={handleStartLesson}
              onCompleteLesson={handleCompleteLesson}
              isStartPending={startLesson.isPending}
              isCompletePending={completeLesson.isPending}
            />
            <NotesBlock variant="dashboard" fillHeight className="h-full min-h-0" />
          </div>

          {!isIPadProLayout && groups.length > 0 ? (
            <StudentCard>
              <StudentSectionHeader title={tDash('teacherStats.myGroups')} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {groups.slice(0, 6).map((group) => (
                  <StudentInnerCard key={group.id}>
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h4 className="font-medium text-[#1010a3]">{group.name}</h4>
                      {group.level ? (
                        <StudentBadge variant="info">{group.level}</StudentBadge>
                      ) : null}
                    </div>
                    <p className="text-sm text-[#8b8b90]">
                      {group._count?.students || 0} students · {group._count?.lessons || 0}{' '}
                      lessons
                    </p>
                    {group.center?.name ? (
                      <p className="mt-1 text-xs text-[#8b8b90]">{group.center.name}</p>
                    ) : null}
                  </StudentInnerCard>
                ))}
              </div>
            </StudentCard>
          ) : null}

          <div className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] xl:gap-6">
            <TeacherDutyActionCards lessons={recentLessons} />
            <PlannedAbsencesStaffBlock fillHeight className="h-full min-h-0" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
