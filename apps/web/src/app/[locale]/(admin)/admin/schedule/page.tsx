'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useGroups } from '@/features/groups';
import { useCenters } from '@/features/centers';
import { useLessons } from '@/features/lessons';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { ScheduleBoard } from '@/features/schedule/ScheduleBoard';
import { useScheduleViewMode } from '@/features/schedule/useScheduleViewMode';
import {
  MultiSelectChipsDropdown,
  type MultiSelectChipsOption,
} from '@/shared/components/ui/multi-select-chips-dropdown';
import {
  formatScheduleDate,
  getMonthDates,
  getWeekDateRangeForApi,
  getWeekDates,
} from '@/features/schedule/schedule-dates';

function areSetsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) {
    return false;
  }
  for (const value of a) {
    if (!b.has(value)) {
      return false;
    }
  }
  return true;
}

export default function AdminSchedulePage() {
  const t = useTranslations('nav');
  const tAttendance = useTranslations('attendance');
  const { user } = useAuthStore();
  const managerCenterId =
    user?.role === 'MANAGER' ? user.managerCenterId : undefined;

  const [draftSelectedCenterIds, setDraftSelectedCenterIds] = useState<Set<string>>(
    new Set(),
  );
  const [appliedSelectedCenterIds, setAppliedSelectedCenterIds] = useState<Set<string>>(
    new Set(),
  );
  const { viewMode, setViewMode } = useScheduleViewMode();
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
  const centerOptions = useMemo<MultiSelectChipsOption[]>(
    () =>
      visibleCenters.map((center) => ({ id: center.id, label: center.name })),
    [visibleCenters],
  );

  const { data: groupsData, isLoading } = useGroups({
    isActive: true,
    take: 200,
    centerId: managerCenterId ?? undefined,
  });

  const groups = useMemo(() => {
    const allGroups = groupsData?.items ?? [];
    if (managerCenterId || appliedSelectedCenterIds.size === 0) {
      return allGroups;
    }
    return allGroups.filter((group) => appliedSelectedCenterIds.has(group.centerId));
  }, [appliedSelectedCenterIds, groupsData?.items, managerCenterId]);
  const groupIds = useMemo(() => groups.map((group) => group.id), [groups]);
  const filteredGroupIds = useMemo(() => new Set(groupIds), [groupIds]);

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
      centerId: managerCenterId ?? undefined,
      dateFrom: queryDateFrom,
      dateTo: queryDateTo,
      take: 500,
      sortBy: 'scheduledAt',
      sortOrder: 'asc',
    },
    { refetchInterval: 60000, refetchIntervalInBackground: false },
  );

  const lessons = useMemo(() => {
    const allLessons = lessonsData?.items ?? [];
    if (managerCenterId || appliedSelectedCenterIds.size === 0) {
      return allLessons;
    }
    return allLessons.filter((lesson) => filteredGroupIds.has(lesson.groupId));
  }, [
    appliedSelectedCenterIds.size,
    filteredGroupIds,
    lessonsData?.items,
    managerCenterId,
  ]);

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
  const hasPendingCenterSelection = useMemo(
    () => !areSetsEqual(draftSelectedCenterIds, appliedSelectedCenterIds),
    [appliedSelectedCenterIds, draftSelectedCenterIds],
  );
  const selectedCenterNames = useMemo(
    () =>
      visibleCenters
        .filter((center) => appliedSelectedCenterIds.has(center.id))
        .map((center) => center.name),
    [appliedSelectedCenterIds, visibleCenters],
  );
  const selectedCentersLabel = useMemo(() => {
    if (selectedCenterNames.length === 0) {
      return '';
    }
    if (selectedCenterNames.length === 1) {
      return selectedCenterNames[0];
    }
    return `${selectedCenterNames.length} selected centers`;
  }, [selectedCenterNames]);
  const centerFilterBlock = !managerCenterId ? (
    <div className="w-full md:w-[20rem]">
      {hasPendingCenterSelection && (
        <div className="mb-1.5 flex items-center justify-end">
          <button
            type="button"
            onClick={() =>
              setAppliedSelectedCenterIds(new Set(draftSelectedCenterIds))
            }
            className="text-[11px] font-semibold text-[#1010a3] transition-colors hover:text-[#0d0d85]"
          >
            Save
          </button>
        </div>
      )}
      <MultiSelectChipsDropdown
        options={centerOptions}
        selectedIds={draftSelectedCenterIds}
        onSelectionChange={setDraftSelectedCenterIds}
        placeholder={tAttendance('allCenters')}
        searchPlaceholder="Search centers..."
        emptyOptionsHint="No centers available"
        noResultsHint="No centers found"
        maxChipsHeightClassName="max-h-10"
        showSelectedChipsOnlyWhenOpen
        hideSelectedLabelsInTrigger
        className="w-full"
      />
    </div>
  ) : null;

  return (
    <DashboardLayout
      title={t('schedule')}
      subtitle={t('scheduleSubtitle')}
    >
      <div className="w-full min-w-0">
      <ScheduleBoard
        lessons={lessons}
        isLoading={isLoading || isLessonsLoading}
        highlightPastLessonCards
        headerCenterContent={centerFilterBlock}
        topBar={(
          <div className="mb-4 flex">
            <div className="flex-1 text-sm text-[#8b8b90]">
              Showing {groups.length} active group{groups.length !== 1 ? 's' : ''}
              {managerCenterId
                ? ` in ${
                    visibleCenters.find((c) => c.id === managerCenterId)?.name ??
                    'selected center'
                  }`
                : selectedCenterNames.length > 0
                ? ` in ${selectedCentersLabel}`
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
        hideMonthOnMobile
      />
      </div>
    </DashboardLayout>
  );
}
