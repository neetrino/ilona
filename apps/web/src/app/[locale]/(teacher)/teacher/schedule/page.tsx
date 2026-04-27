'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useLessons } from '@/features/lessons';
import { useMyGroups } from '@/features/groups/hooks/useGroups';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { ScheduleBoard } from '@/features/schedule/ScheduleBoard';
import { useScheduleViewMode } from '@/features/schedule/useScheduleViewMode';
import {
  formatScheduleDate,
  getMonthDates,
  getWeekDateRangeForApi,
  getWeekDates,
} from '@/features/schedule/schedule-dates';

export default function TeacherSchedulePage() {
  const t = useTranslations('nav');
  const { isHydrated, isAuthenticated, tokens } = useAuthStore();
  const isAuthReady = isHydrated && isAuthenticated && !!tokens?.accessToken;
  const { data: myGroups, isLoading: isGroupsLoading } = useMyGroups();
  const groupsList = myGroups ?? [];

  const { viewMode, setViewMode } = useScheduleViewMode();
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekDates = useMemo(
    () => getWeekDates(new Date(currentDate)),
    [currentDate],
  );
  const monthDates = useMemo(
    () => getMonthDates(new Date(currentDate)),
    [currentDate],
  );

  const { dateFrom: queryDateFrom, dateTo: queryDateTo } = useMemo(() => {
    if (viewMode === 'month') {
      const from = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
      );
      const to = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1,
      );
      return { dateFrom: formatScheduleDate(from), dateTo: formatScheduleDate(to) };
    }
    return getWeekDateRangeForApi(weekDates);
  }, [currentDate, viewMode, weekDates]);

  const { data: lessonsData, isLoading: isLessonsLoading } = useLessons(
    {
      dateFrom: queryDateFrom,
      dateTo: queryDateTo,
      take: 500,
      sortBy: 'scheduledAt',
      sortOrder: 'asc',
    },
    {
      refetchInterval: 60000,
      refetchIntervalInBackground: false,
      enabled: isAuthReady,
    },
  );

  const lessons = useMemo(
    () => lessonsData?.items ?? [],
    [lessonsData?.items],
  );

  const periodLabel = useMemo(() => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
    }
    return `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }, [currentDate, viewMode, weekDates]);

  const onPeriodNavigate = (direction: 'prev' | 'next') => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() + (direction === 'next' ? 1 : -1));
    } else {
      next.setDate(next.getDate() + (direction === 'next' ? 7 : -7));
    }
    setCurrentDate(next);
  };

  return (
    <DashboardLayout
      title={t('schedule')}
      subtitle="Weekly and monthly schedule for upcoming lessons"
    >
      <ScheduleBoard
        lessons={lessons}
        isLoading={!isAuthReady || isGroupsLoading || isLessonsLoading}
        topBar={(
          <div className="mb-6 text-sm text-slate-500">
            Showing {groupsList.length} group{groupsList.length !== 1 ? 's' : ''}{' '}
            you teach{groupsList.length ? '.' : ' — assign groups to see lessons in your schedule.'}
          </div>
        )}
        managerBranchName={null}
        weekDates={weekDates}
        monthDates={monthDates}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        periodLabel={periodLabel}
        onPeriodNavigate={onPeriodNavigate}
        onGoToToday={() => setCurrentDate(new Date())}
      />
    </DashboardLayout>
  );
}
