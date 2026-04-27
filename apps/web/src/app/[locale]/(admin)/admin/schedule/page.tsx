'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useGroups } from '@/features/groups';
import { useCenters } from '@/features/centers';
import { useLessons } from '@/features/lessons';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { ScheduleBoard } from '@/features/schedule/ScheduleBoard';
import {
  formatScheduleDate,
  getMonthDates,
  getWeekDateRangeForApi,
  getWeekDates,
  type ScheduleViewMode,
} from '@/features/schedule/schedule-dates';

export default function AdminSchedulePage() {
  const t = useTranslations('nav');
  const { user } = useAuthStore();
  const managerCenterId =
    user?.role === 'MANAGER' ? user.managerCenterId : undefined;

  const [centerId, setCenterId] = useState<string>('');
  const [viewMode, setViewMode] = useState<ScheduleViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: centersData } = useCenters({ isActive: true });
  const allCenters = useMemo(
    () => centersData?.items ?? [],
    [centersData?.items],
  );
  const visibleCenters = managerCenterId
    ? allCenters.filter((c) => c.id === managerCenterId)
    : allCenters;
  const managerBranchName = useMemo(() => {
    if (user?.role !== 'MANAGER' || !managerCenterId) {
      return null;
    }
    return allCenters.find((center) => center.id === managerCenterId)?.name ?? null;
  }, [allCenters, managerCenterId, user?.role]);

  const effectiveCenterId = managerCenterId ?? (centerId || undefined);

  const { data: groupsData, isLoading } = useGroups({
    isActive: true,
    take: 200,
    centerId: effectiveCenterId,
  });

  const groups = useMemo(() => groupsData?.items ?? [], [groupsData?.items]);
  const groupIds = useMemo(() => groups.map((group) => group.id), [groups]);

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
      groupIds: groupIds.length > 0 ? groupIds : undefined,
      centerId: effectiveCenterId,
      dateFrom: queryDateFrom,
      dateTo: queryDateTo,
      take: 500,
      sortBy: 'scheduledAt',
      sortOrder: 'asc',
    },
    { refetchInterval: 60000, refetchIntervalInBackground: false },
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
        isLoading={isLoading || isLessonsLoading}
        topBar={(
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end">
            {!managerCenterId && (
              <div className="md:w-72">
                <label
                  htmlFor="schedule-center"
                  className="mb-1.5 block text-sm font-medium text-slate-600"
                >
                  Center
                </label>
                <select
                  id="schedule-center"
                  value={centerId}
                  onChange={(e) => setCenterId(e.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                >
                  <option value="">All centers</option>
                  {visibleCenters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex-1 text-sm text-slate-500">
              Showing {groups.length} active group{groups.length !== 1 ? 's' : ''}
              {effectiveCenterId
                ? ` in ${
                    visibleCenters.find((c) => c.id === effectiveCenterId)
                      ?.name ?? 'selected center'
                  }`
                : ''}
              .
            </div>
          </div>
        )}
        managerBranchName={managerBranchName}
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
