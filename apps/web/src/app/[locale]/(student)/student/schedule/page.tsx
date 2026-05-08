'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useLessons } from '@/features/lessons';
import { useMyProfile } from '@/features/students';
import type { Student } from '@/features/students/types';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { ScheduleBoard } from '@/features/schedule/ScheduleBoard';
import { useScheduleViewMode } from '@/features/schedule/useScheduleViewMode';
import {
  formatScheduleDate,
  getMonthDates,
  getWeekDateRangeForApi,
  getWeekDates,
} from '@/features/schedule/schedule-dates';

function centersFromStudentProfile(profile: Student): { id: string; name: string }[] {
  const map = new Map<string, string>();
  if (profile.group?.center) {
    map.set(profile.group.center.id, profile.group.center.name);
  }
  if (profile.center?.id) {
    map.set(profile.center.id, profile.center.name);
  }
  return [...map.entries()].map(([id, name]) => ({ id, name }));
}

export default function StudentSchedulePage() {
  const t = useTranslations('nav');
  const { isHydrated, isAuthenticated, tokens } = useAuthStore();
  const isAuthReady = isHydrated && isAuthenticated && !!tokens?.accessToken;
  const { data: profile, isLoading: isProfileLoading } = useMyProfile(isAuthReady);

  const [centerId, setCenterId] = useState<string>('');
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

  const hasGroup = Boolean(profile?.groupId);

  const profileCenters = useMemo(
    () => (profile ? centersFromStudentProfile(profile) : []),
    [profile],
  );

  const effectiveCenterId = centerId || undefined;

  const { data: lessonsData, isLoading: isLessonsLoading } = useLessons(
    {
      groupIds: hasGroup && profile?.groupId ? [profile.groupId] : undefined,
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
      enabled: isAuthReady && hasGroup,
    },
  );

  const lessons = useMemo(
    () => (hasGroup ? (lessonsData?.items ?? []) : []),
    [hasGroup, lessonsData?.items],
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
        isLoading={!isAuthReady || isProfileLoading || (hasGroup && isLessonsLoading)}
        highlightPastLessonCards
        topBar={(
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end">
            {hasGroup ? (
              <div className="md:w-72">
                <label
                  htmlFor="schedule-center-student"
                  className="mb-1.5 block text-sm font-medium text-slate-600"
                >
                  Center
                </label>
                <select
                  id="schedule-center-student"
                  value={centerId}
                  onChange={(e) => setCenterId(e.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                >
                  <option value="">All centers</option>
                  {profileCenters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.id}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div className="flex-1 text-sm text-slate-500">
              {profile && !hasGroup
                ? 'You are not assigned to a class group yet. When you are, your schedule will appear here.'
                : `Showing 1 active group${
                    effectiveCenterId
                      ? ` in ${
                          profileCenters.find((c) => c.id === effectiveCenterId)?.name
                          ?? 'selected center'
                        }`
                      : ''
                  }.`}
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
