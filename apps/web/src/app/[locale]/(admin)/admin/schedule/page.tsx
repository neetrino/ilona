'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useGroups } from '@/features/groups';
import { useCenters } from '@/features/centers';
import { useLessons } from '@/features/lessons';
import {
  MonthLessonGrid,
  WeekLessonGrid,
} from '@/features/schedule/ScheduleLessonViews';
import { useAuthStore } from '@/features/auth/store/auth.store';

type ScheduleViewMode = 'week' | 'month';

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getWeekDates(date: Date): Date[] {
  const current = new Date(date);
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(current.setDate(diff));
  return Array.from({ length: 7 }, (_, idx) => {
    const item = new Date(monday);
    item.setDate(monday.getDate() + idx);
    return item;
  });
}

function getMonthDates(date: Date): (Date | null)[][] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay() || 7;
  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = [];

  for (let i = 1; i < startDay; i += 1) currentWeek.push(null);
  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    currentWeek.push(new Date(year, month, day));
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  while (currentWeek.length > 0 && currentWeek.length < 7) currentWeek.push(null);
  if (currentWeek.length > 0) weeks.push(currentWeek);

  return weeks;
}

export default function AdminSchedulePage() {
  const t = useTranslations('nav');
  const { user } = useAuthStore();
  const managerCenterId =
    user?.role === 'MANAGER' ? user.managerCenterId : undefined;

  const [centerId, setCenterId] = useState<string>('');
  const [viewMode, setViewMode] = useState<ScheduleViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: centersData } = useCenters({ isActive: true });
  const allCenters = centersData?.items ?? [];
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

  const weekDates = useMemo(() => getWeekDates(new Date(currentDate)), [currentDate]);
  const monthDates = useMemo(() => getMonthDates(new Date(currentDate)), [currentDate]);

  const dateFrom = useMemo(() => {
    if (viewMode === 'month') {
      return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    }
    return weekDates[0];
  }, [currentDate, viewMode, weekDates]);

  const dateTo = useMemo(() => {
    if (viewMode === 'month') {
      return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }
    return new Date(weekDates[6].getTime() + 24 * 60 * 60 * 1000);
  }, [currentDate, viewMode, weekDates]);

  const { data: lessonsData, isLoading: isLessonsLoading } = useLessons(
    {
      groupIds: groupIds.length > 0 ? groupIds : undefined,
      dateFrom: formatDate(dateFrom),
      dateTo: formatDate(dateTo),
      take: 500,
      sortBy: 'scheduledAt',
      sortOrder: 'asc',
    },
    { refetchInterval: 60000, refetchIntervalInBackground: false },
  );

  const lessons = useMemo(() => lessonsData?.items ?? [], [lessonsData?.items]);

  const lessonsByDate = useMemo(() => {
    return lessons.reduce<Record<string, (typeof lessons)[number][]>>((acc, lesson) => {
      const key = lesson.scheduledAt.split('T')[0];
      if (!acc[key]) acc[key] = [];
      acc[key].push(lesson);
      return acc;
    }, {});
  }, [lessons]);

  const periodLabel = useMemo(() => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
    }
    return `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }, [currentDate, viewMode, weekDates]);

  const navigate = (direction: 'prev' | 'next') => {
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
      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
        {!managerCenterId && (
          <div className="md:w-72">
            <label
              htmlFor="schedule-center"
              className="block text-sm font-medium text-slate-600 mb-1.5"
            >
              Center
            </label>
            <select
              id="schedule-center"
              value={centerId}
              onChange={(e) => setCenterId(e.target.value)}
              className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                visibleCenters.find((c) => c.id === effectiveCenterId)?.name ??
                'selected center'
              }`
            : ''}
          .
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden h-[calc(100vh-260px)] flex flex-col">
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('prev')}
              className="h-9 w-9 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              aria-label="Previous period"
            >
              ←
            </button>
            <div className="text-sm font-semibold text-slate-800 min-w-[180px] text-center">
              {periodLabel}
            </div>
            <button
              type="button"
              onClick={() => navigate('next')}
              className="h-9 w-9 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              aria-label="Next period"
            >
              →
            </button>
            <button
              type="button"
              onClick={() => setCurrentDate(new Date())}
              className="ml-2 h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50"
            >
              Today
            </button>
          </div>

          {managerBranchName && (
            <div className="md:absolute md:left-1/2 md:-translate-x-1/2 flex justify-center">
              <span className="h-9 px-3 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 text-base font-medium text-slate-600 whitespace-nowrap">
                {managerBranchName}
              </span>
            </div>
          )}

          <div className="inline-flex items-center rounded-lg border border-slate-200 p-1 bg-slate-50">
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`h-8 px-3 rounded-md text-sm ${viewMode === 'week' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`h-8 px-3 rounded-md text-sm ${viewMode === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
            >
              Month
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          {viewMode === 'week' ? (
          <WeekLessonGrid
            weekDates={weekDates}
            lessons={lessons}
            isLoading={isLoading || isLessonsLoading}
          />
        ) : (
          <MonthLessonGrid
            monthDates={monthDates}
            lessonsByDate={lessonsByDate}
            isLoading={isLoading || isLessonsLoading}
          />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
