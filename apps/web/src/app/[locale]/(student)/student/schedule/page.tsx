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
import {
  StudentCard,
  StudentFieldLabel,
  StudentPageStack,
  StudentSelect,
} from '@/features/student-ui';

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
  const tAttendance = useTranslations('attendance');
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
      return currentDate.toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric',
      });
    }
    return `${weekDates[0].toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} - ${weekDates[6].toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}`;
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
      subtitle={t('scheduleSubtitle')}
    >
      <StudentPageStack>
        <ScheduleBoard
          variant="student"
          rectangularViewToggle
          lessons={lessons}
          isLoading={!isAuthReady || isProfileLoading || (hasGroup && isLessonsLoading)}
          highlightPastLessonCards
          topBar={(
            <StudentCard className="mb-0">
              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                {hasGroup ? (
                  <div className="w-full md:max-w-xs">
                    <StudentFieldLabel htmlFor="schedule-center-student">
                      Center
                    </StudentFieldLabel>
                    <StudentSelect
                      id="schedule-center-student"
                      value={centerId}
                      onChange={setCenterId}
                      placeholder={tAttendance('allCenters')}
                      allowClear
                      options={profileCenters.map((c) => ({
                        value: c.id,
                        label: c.name || c.id,
                      }))}
                    />
                  </div>
                ) : null}
                <p className="flex-1 text-sm text-[#8b8b90]">
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
                </p>
              </div>
            </StudentCard>
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
      </StudentPageStack>
    </DashboardLayout>
  );
}
