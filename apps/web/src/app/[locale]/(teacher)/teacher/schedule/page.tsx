'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useLessons } from '@/features/lessons';
import { useMyGroups } from '@/features/groups/hooks/useGroups';
import type { Group } from '@/features/groups/types';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { ScheduleBoard } from '@/features/schedule/ScheduleBoard';
import { StudentFieldLabel, StudentSelect } from '@/features/student-ui';
import { useScheduleViewMode } from '@/features/schedule/useScheduleViewMode';
import {
  formatScheduleDate,
  getMonthDates,
  getWeekDateRangeForApi,
  getWeekDates,
} from '@/features/schedule/schedule-dates';

function uniqueCentersFromGroups(groups: Group[]): { id: string; name: string }[] {
  const map = new Map<string, string>();
  for (const g of groups) {
    const id = g.center?.id ?? g.centerId;
    if (!id) continue;
    const name = g.center?.name ?? '';
    if (!map.has(id) || !map.get(id)) {
      map.set(id, name);
    }
  }
  return [...map.entries()].map(([id, name]) => ({ id, name }));
}

export default function TeacherSchedulePage() {
  const t = useTranslations('nav');
  const { isHydrated, isAuthenticated, tokens } = useAuthStore();
  const isAuthReady = isHydrated && isAuthenticated && !!tokens?.accessToken;
  const { data: myGroups, isLoading: isGroupsLoading } = useMyGroups();
  const groupsList = useMemo(() => myGroups ?? [], [myGroups]);

  const [centerId, setCenterId] = useState<string>('');
  const { viewMode, setViewMode } = useScheduleViewMode();
  const [currentDate, setCurrentDate] = useState(new Date());

  const visibleCenters = useMemo(() => uniqueCentersFromGroups(groupsList), [groupsList]);

  const visibleGroups = useMemo(() => {
    if (!centerId) return groupsList;
    return groupsList.filter((g) => (g.center?.id ?? g.centerId) === centerId);
  }, [groupsList, centerId]);

  const groupIds = useMemo(() => visibleGroups.map((g) => g.id), [visibleGroups]);
  const effectiveCenterId = centerId || undefined;

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
    {
      refetchInterval: 60000,
      refetchIntervalInBackground: false,
      enabled: isAuthReady && groupIds.length > 0,
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
        variant="student"
        lessons={lessons}
        isLoading={!isAuthReady || isGroupsLoading || isLessonsLoading}
        highlightPastLessonCards
        topBar={(
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end">
            <div className="w-full md:max-w-xs">
              <StudentFieldLabel htmlFor="schedule-center-teacher">Center</StudentFieldLabel>
              <StudentSelect
                id="schedule-center-teacher"
                value={centerId}
                onChange={(e) => setCenterId(e.target.value)}
              >
                <option value="">All centers</option>
                {visibleCenters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.id}
                  </option>
                ))}
              </StudentSelect>
            </div>
            <div className="min-w-0 flex-1 text-sm text-[#8b8b90]">
              Showing {visibleGroups.length} active group{visibleGroups.length !== 1 ? 's' : ''}
              {effectiveCenterId
                ? ` in ${
                    visibleCenters.find((c) => c.id === effectiveCenterId)?.name
                    ?? 'selected center'
                  }`
                : ''}
              .
              {groupsList.length === 0
                ? ' Assign groups to see lessons in your schedule.'
                : ''}
            </div>
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
