'use client';

import { portalPageStackClass } from '@/shared/lib/portal-theme';
import { useState, useMemo, useEffect, useCallback, startTransition, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { StatCard, Button } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { LessonListTable } from '@/shared/components/calendar/LessonListTable';
import {
  useLessons,
  useLessonStatistics,
  useDeleteLesson,
  useDeleteLessonsBulk,
  AddLessonForm,
  type Lesson,
  type LessonStatus,
} from '@/features/lessons';
import { BulkDeleteConfirmationDialog } from '@/features/lessons/components/BulkDeleteConfirmationDialog';
import { getErrorMessage } from '@/shared/lib/api';
import { CalendarMonthGrid } from '@/shared/components/calendar/CalendarMonthGrid';
import { useTeachers } from '@/features/teachers';
import { CalendarFilters } from './components/CalendarFilters';
import { SubstituteLessonModal } from './components/SubstituteLessonModal';
import { useLocale, useTranslations } from 'next-intl';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { getAdminPortalBasePath } from '@/shared/lib/role-routes';
import { readUrlSearchParam, replaceAppSearchUrl } from '@/shared/lib/url-search-params';
import { usePopstateUrlSync } from '@/shared/hooks/useAppSearchUrl';

// Helper to get week dates
function getWeekDates(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay() + 1); // Monday
  
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function getMonthDates(date: Date): (Date | null)[][] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();

  const weeks: (Date | null)[][] = [];
  let day = 1;

  while (day <= totalDays) {
    const week: (Date | null)[] = [];
    for (let i = 0; i < 7; i += 1) {
      if ((weeks.length === 0 && i < firstWeekday) || day > totalDays) {
        week.push(null);
      } else {
        week.push(new Date(year, month, day));
        day += 1;
      }
    }
    weeks.push(week);
  }

  return weeks;
}

// Helper to format time
function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// Helper to format date
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/** YYYY-MM-DD in local calendar (matches teacher list window / schedule grid). */
function formatLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Status badge config
const _statusConfig: Record<LessonStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
  SCHEDULED: { label: 'Scheduled', variant: 'info' },
  IN_PROGRESS: { label: 'In Progress', variant: 'warning' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'default' },
  MISSED: { label: 'Missed', variant: 'error' },
};

const CALENDAR_MODAL_QUERY_KEY = 'modal';
const ADD_LESSON_MODAL_QUERY_VALUE = 'add-lesson';

function isAddLessonModalOpen(searchParams: URLSearchParams): boolean {
  return readUrlSearchParam(CALENDAR_MODAL_QUERY_KEY, searchParams) === ADD_LESSON_MODAL_QUERY_VALUE;
}

export default function CalendarPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('calendar');
  const tLessons = useTranslations('lessons');
  const locale = useLocale();
  const { user } = useAuthStore();
  const portalBasePath = getAdminPortalBasePath(user?.role);
  const [urlRevision, setUrlRevision] = useState(0);
  usePopstateUrlSync(setUrlRevision);

  const replaceParams = useCallback(
    (updates: Record<string, string | number | null | undefined>) => {
      replaceAppSearchUrl({
        router,
        pathname,
        updates,
        scroll: false,
        onReplaced: () => setUrlRevision((revision) => revision + 1),
      });
    },
    [pathname, router],
  );

  const readViewModeFromUrl = useCallback((): 'week' | 'month' | 'list' => {
    const viewFromUrl = readUrlSearchParam('view', searchParams, urlRevision);
    if (viewFromUrl === 'week' || viewFromUrl === 'month' || viewFromUrl === 'list') {
      return viewFromUrl;
    }
    return 'list';
  }, [searchParams, urlRevision]);

  const [pendingViewMode, setPendingViewMode] = useState<'week' | 'month' | 'list' | null>(null);
  const viewMode = pendingViewMode ?? readViewModeFromUrl();

  useEffect(() => {
    if (pendingViewMode === null) {
      return;
    }
    if (readViewModeFromUrl() === pendingViewMode) {
      setPendingViewMode(null);
    }
  }, [pendingViewMode, readViewModeFromUrl]);
  
  // Initialize sort/filter state from URL (synced via effect for back/forward)
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(() => isAddLessonModalOpen(searchParams));
  const isAddLessonClosingRef = useRef(false);
  const [substituteLessonId, setSubstituteLessonId] = useState<string | null>(null);
  const [substituteLessonModalOpen, setSubstituteLessonModalOpen] = useState(false);

  const [pendingBulkDeleteIds, setPendingBulkDeleteIds] = useState<string[]>([]);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);

  const [pendingSingleDeleteId, setPendingSingleDeleteId] = useState<string | null>(null);
  const [isSingleDeleteDialogOpen, setIsSingleDeleteDialogOpen] = useState(false);
  const [singleDeleteError, setSingleDeleteError] = useState<string | null>(null);

  const [deleteNotice, setDeleteNotice] = useState<{ variant: 'success' | 'error'; text: string } | null>(
    null,
  );

  // Fetch teachers for dropdown
  const { data: teachersData, isLoading: isLoadingTeachers } = useTeachers({ 
    status: 'ACTIVE', 
    take: 100 
  });

  // Prepare teacher options
  const teacherOptions = useMemo(() => {
    if (!teachersData?.items) return [];
    return teachersData.items.map(teacher => ({
      id: teacher.id,
      label: `${teacher.user.firstName} ${teacher.user.lastName}`,
    }));
  }, [teachersData]);

  // Update URL when view mode changes
  const updateViewModeInUrl = (mode: 'week' | 'month' | 'list') => {
    setPendingViewMode(mode);
    replaceParams({ view: mode === 'list' ? null : mode });
  };
  
  // Sync filter/sort/modal state from URL (browser back/forward and client replace)
  useEffect(() => {
    const sortByFromUrl = readUrlSearchParam('sortBy', searchParams, urlRevision);
    const sortOrderFromUrl = readUrlSearchParam('sortOrder', searchParams, urlRevision);
    setSortBy(sortByFromUrl || undefined);
    if (sortOrderFromUrl === 'asc' || sortOrderFromUrl === 'desc') {
      setSortOrder(sortOrderFromUrl);
    } else {
      setSortOrder(undefined);
    }

    setSearchQuery(readUrlSearchParam('q', searchParams, urlRevision) || '');
    setSelectedTeacherId(readUrlSearchParam('teacherId', searchParams, urlRevision) || '');

    if (!isAddLessonClosingRef.current) {
      setIsAddLessonOpen(isAddLessonModalOpen(searchParams));
    }
  }, [searchParams, urlRevision]);

  const updateAddLessonModalInUrl = useCallback(
    (open: boolean) => {
      replaceParams({
        [CALENDAR_MODAL_QUERY_KEY]: open ? ADD_LESSON_MODAL_QUERY_VALUE : null,
      });
    },
    [replaceParams],
  );

  const handleAddLessonOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        isAddLessonClosingRef.current = false;
        setIsAddLessonOpen(true);
        updateAddLessonModalInUrl(true);
      } else {
        isAddLessonClosingRef.current = true;
        setIsAddLessonOpen(false);
        updateAddLessonModalInUrl(false);
        setTimeout(() => {
          isAddLessonClosingRef.current = false;
        }, 100);
      }
    },
    [updateAddLessonModalInUrl],
  );
  
  // Handle sort toggle
  const handleSort = (key: string) => {
    if (sortBy === key && sortOrder) {
      const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      setSortOrder(newOrder);
      replaceParams({ sortBy: key, sortOrder: newOrder });
    } else {
      setSortBy(key);
      setSortOrder('asc');
      replaceParams({ sortBy: key, sortOrder: 'asc' });
    }
  };
  
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);
  const monthDates = useMemo(() => getMonthDates(currentDate), [currentDate]);
  const { rangeFrom, rangeTo } = useMemo(() => {
    if (viewMode === 'list') {
      const from = new Date();
      from.setMonth(from.getMonth() - 3);
      from.setHours(0, 0, 0, 0);
      const to = new Date();
      to.setMonth(to.getMonth() + 3);
      to.setDate(1);
      return { rangeFrom: formatLocalDateKey(from), rangeTo: formatLocalDateKey(to) };
    }
    if (viewMode === 'month') {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      return { rangeFrom: formatDate(start), rangeTo: formatDate(end) };
    }
    return {
      rangeFrom: formatDate(weekDates[0]),
      rangeTo: formatDate(new Date(weekDates[6].getTime() + 24 * 60 * 60 * 1000)),
    };
  }, [currentDate, viewMode, weekDates]);

  // Fetch lessons for the week. Poll every 60s only when tab is visible (no background spam).
  const {
    data: lessonsData,
    isLoading,
    refetch: _refetch,
  } = useLessons(
    {
      dateFrom: rangeFrom,
      dateTo: rangeTo,
      take: viewMode === 'list' ? 250 : viewMode === 'month' ? 500 : 100,
      sortBy: sortBy === 'scheduledAt' ? 'scheduledAt' : undefined,
      sortOrder: sortOrder,
      search: searchQuery || undefined,
      teacherId: selectedTeacherId || undefined,
    },
    { refetchInterval: 60000, refetchIntervalInBackground: false }
  );

  // Fetch statistics
  const { data: stats } = useLessonStatistics();

  const deleteLesson = useDeleteLesson();
  const deleteLessonsBulk = useDeleteLessonsBulk();

  const lessons = useMemo(() => lessonsData?.items || [], [lessonsData?.items]);

  // Group lessons by date (all days in the fetched range, not only the current week)
  const lessonsByDate = useMemo(() => {
    const grouped: Record<string, Lesson[]> = {};
    for (const lesson of lessons) {
      const dateKey = lesson.scheduledAt.split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(lesson);
    }
    for (const key of Object.keys(grouped)) {
      grouped[key].sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      );
    }
    return grouped;
  }, [lessons]);

  // Navigation
  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const showDeleteNotice = useCallback((variant: 'success' | 'error', text: string) => {
    setDeleteNotice({ variant, text });
    window.setTimeout(() => {
      startTransition(() => setDeleteNotice(null));
    }, 4000);
  }, []);

  const handleBulkDeleteClick = useCallback((lessonIds: string[]) => {
    const unique = [...new Set(lessonIds)];
    if (unique.length === 0) return;
    setBulkDeleteError(null);
    setPendingBulkDeleteIds(unique);
    setIsBulkDeleteDialogOpen(true);
  }, []);

  const handleBulkDeleteDialogOpenChange = useCallback((open: boolean) => {
    setIsBulkDeleteDialogOpen(open);
    if (!open) {
      setBulkDeleteError(null);
      setPendingBulkDeleteIds([]);
    }
  }, []);

  const handleBulkDeleteConfirm = useCallback(async () => {
    if (pendingBulkDeleteIds.length === 0 || deleteLessonsBulk.isPending) return;
    setBulkDeleteError(null);
    try {
      await deleteLessonsBulk.mutateAsync(pendingBulkDeleteIds);
      const n = pendingBulkDeleteIds.length;
      setIsBulkDeleteDialogOpen(false);
      setPendingBulkDeleteIds([]);
      showDeleteNotice(
        'success',
        n === 1 ? t('lessonDeletedSuccess') : t('lessonsDeletedSuccess', { count: n }),
      );
    } catch (err: unknown) {
      setBulkDeleteError(getErrorMessage(err, t('failedDeleteLessons')));
    }
  }, [deleteLessonsBulk, pendingBulkDeleteIds, showDeleteNotice, t]);

  const handleSingleDeleteClick = useCallback((lessonId: string) => {
    setSingleDeleteError(null);
    setPendingSingleDeleteId(lessonId);
    setIsSingleDeleteDialogOpen(true);
  }, []);

  const handleSingleDeleteDialogOpenChange = useCallback((open: boolean) => {
    setIsSingleDeleteDialogOpen(open);
    if (!open) {
      setSingleDeleteError(null);
      setPendingSingleDeleteId(null);
    }
  }, []);

  const handleSingleDeleteConfirm = useCallback(async () => {
    if (!pendingSingleDeleteId || deleteLesson.isPending) return;
    setSingleDeleteError(null);
    try {
      await deleteLesson.mutateAsync(pendingSingleDeleteId);
      setIsSingleDeleteDialogOpen(false);
      setPendingSingleDeleteId(null);
      showDeleteNotice('success', t('lessonDeletedSuccess'));
    } catch (err: unknown) {
      setSingleDeleteError(getErrorMessage(err, t('failedDeleteLesson')));
    }
  }, [deleteLesson, pendingSingleDeleteId, showDeleteNotice, t]);

  const singleDeleteLesson = pendingSingleDeleteId
    ? lessons.find((l) => l.id === pendingSingleDeleteId)
    : undefined;

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Week/month header
  const weekHeader = `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  const monthHeader = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Handle filter changes and update URL - memoized to prevent infinite loops
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    replaceParams({ q: value || null });
  }, [replaceParams]);

  const handleTeacherChange = useCallback((teacherId: string) => {
    setSelectedTeacherId(teacherId);
    replaceParams({ teacherId: teacherId || null });
  }, [replaceParams]);

  return (
    <DashboardLayout 
      title={t('adminTitle')} 
      subtitle={t('adminSubtitle')}
    >
      <div className={portalPageStackClass}>
        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-[rgba(14,14,16,0.07)]">
          <CalendarFilters
            searchQuery={searchQuery}
            selectedTeacherId={selectedTeacherId}
            teacherOptions={teacherOptions}
            isLoadingTeachers={isLoadingTeachers}
            onSearchChange={handleSearchChange}
            onTeacherChange={handleTeacherChange}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid w-full min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
          <StatCard
            title={t('statsTotalLessons')}
            value={stats?.total || 0}
          />
          <StatCard
            title={t('statsCompleted')}
            value={stats?.completed || 0}
            change={{ value: t('statsCompletionRate', { value: stats?.completionRate || 0 }), type: 'positive' }}
          />
          <StatCard
            title={t('statsScheduled')}
            value={stats?.scheduled || 0}
            change={{ value: t('statsUpcoming'), type: 'neutral' }}
          />
          <StatCard
            title={t('statsInProgress')}
            value={stats?.inProgress || 0}
            change={{ value: t('statsLiveNow'), type: 'warning' }}
          />
          <StatCard
            title={t('statsCancelledMissed')}
            value={`${stats?.cancelled || 0}/${stats?.missed || 0}`}
            className="col-span-2 sm:col-span-1"
          />
        </div>

        {/* Calendar Controls */}
        <div className="flex w-full min-w-0 flex-col gap-3 rounded-xl border border-[rgba(14,14,16,0.07)] bg-white p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="w-full min-w-0 space-y-2 sm:w-auto sm:flex sm:min-w-0 sm:flex-wrap sm:items-center sm:gap-4 sm:space-y-0">
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:contents">
              <button
                onClick={goToPreviousWeek}
                className="p-2 rounded-lg hover:bg-[#f6f6f7]"
              >
                <svg className="w-5 h-5 text-[#3b3b40]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-center text-lg font-semibold text-[#3b3b40] sm:text-left">
                {viewMode === 'month' ? monthHeader : weekHeader}
              </h2>
              <button
                onClick={goToNextWeek}
                className="justify-self-end p-2 rounded-lg hover:bg-[#f6f6f7]"
              >
                <svg className="w-5 h-5 text-[#3b3b40]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg sm:ml-0"
            >
              {t('today')}
            </button>
          </div>

          <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
            <div className="relative inline-flex flex-1 rounded-lg border-2 border-[rgba(14,14,16,0.12)] bg-white p-1 shadow-sm sm:w-[276px] sm:flex-none">
              <span
                className={cn(
                  'pointer-events-none absolute bottom-1 left-1 top-1 z-0 rounded-md bg-[#1010a3] shadow-sm transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                  viewMode === 'list'
                    ? locale === 'hy'
                      ? 'w-[calc(50%-0.125rem)] sm:w-[calc(33.333%-0.166rem)] translate-x-0'
                      : 'w-[calc(50%-0.125rem)] sm:w-[calc(33.333%-0.166rem)] translate-x-0'
                    : viewMode === 'week'
                      ? locale === 'hy'
                        ? 'w-[calc(50%-0.125rem)] sm:w-[calc(33.333%-0.166rem)] translate-x-full sm:translate-x-[100%]'
                        : 'w-[calc(50%-0.125rem)] sm:w-[calc(33.333%-0.166rem)] translate-x-full sm:translate-x-[100%]'
                      : 'hidden sm:block sm:w-[calc(33.333%-0.166rem)] sm:translate-x-[200%]'
                )}
              />
              <button
                type="button"
                onClick={() => updateViewModeInUrl('list')}
                className={cn(
                  'relative z-10 flex-1 py-2 text-center font-semibold rounded-md transition-colors',
                  locale === 'hy' ? 'px-3 text-xs sm:px-4 sm:text-sm' : 'px-4 text-sm',
                  'focus:outline-none',
                  viewMode === 'list' ? 'text-white' : 'text-[#3b3b40] hover:bg-[#f6f6f7]'
                )}
                aria-pressed={viewMode === 'list'}
              >
                {t('list')}
              </button>
              <button
                type="button"
                onClick={() => updateViewModeInUrl('week')}
                className={cn(
                  'relative z-10 flex-1 py-2 text-center font-semibold rounded-md transition-colors',
                  locale === 'hy' ? 'px-3 text-xs sm:px-4 sm:text-sm' : 'px-4 text-sm',
                  'focus:outline-none',
                  viewMode === 'week' ? 'text-white' : 'text-[#3b3b40] hover:bg-[#f6f6f7]'
                )}
                aria-pressed={viewMode === 'week'}
              >
                {t('week')}
              </button>
              <button
                type="button"
                onClick={() => updateViewModeInUrl('month')}
                className={cn(
                  'relative z-10 hidden flex-1 px-4 py-2 text-center text-sm font-semibold rounded-md transition-colors sm:inline-flex sm:justify-center',
                  'focus:outline-none',
                  viewMode === 'month' ? 'text-white' : 'text-[#3b3b40] hover:bg-[#f6f6f7]'
                )}
                aria-pressed={viewMode === 'month'}
              >
                {t('month')}
              </button>
            </div>
            <Button
              type="button"
              variant="default"
              onClick={() => handleAddLessonOpenChange(true)}
              className={cn(
                'whitespace-nowrap font-semibold shadow-sm',
                locale === 'hy' ? 'px-3 text-sm sm:px-4' : 'px-4 text-sm',
              )}
            >
              + {tLessons('addLesson')}
            </Button>
          </div>
        </div>

        {/* Week View */}
        {viewMode === 'week' && (
          <div className="w-full min-w-0 overflow-x-auto rounded-xl border border-[rgba(14,14,16,0.07)] bg-white [-webkit-overflow-scrolling:touch]">
            <div className="min-w-[42rem]">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-[rgba(14,14,16,0.07)]">
              {weekDates.map((date, i) => (
                <div 
                  key={i}
                  className={`p-3 text-center border-r last:border-r-0 border-[rgba(14,14,16,0.07)] ${
                    isToday(date) ? 'bg-blue-50' : ''
                  }`}
                >
                  <p className="text-xs text-[#8b8b90] uppercase">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                  <p className={`text-lg font-semibold ${
                    isToday(date) ? 'text-blue-600' : 'text-[#3b3b40]'
                  }`}>
                    {date.getDate()}
                  </p>
                </div>
              ))}
            </div>

            {/* Lessons Grid */}
            <div className="grid grid-cols-7 min-h-[400px]">
              {weekDates.map((date, i) => {
                const dateKey = formatDate(date);
                const dayLessons = lessonsByDate[dateKey] || [];
                
                return (
                  <div 
                    key={i}
                    className={`p-2 border-r last:border-r-0 border-[rgba(14,14,16,0.07)] ${
                      isToday(date) ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    {isLoading ? (
                      <div className="animate-pulse space-y-2">
                        <div className="h-16 bg-[#f1f1f2] rounded-lg" />
                        <div className="h-16 bg-[#f1f1f2] rounded-lg" />
                      </div>
                    ) : dayLessons.length === 0 ? (
                      <p className="text-xs text-[#8b8b90] text-center py-4">
                        {searchQuery || selectedTeacherId ? t('noLessonsMatchFiltersShort') : t('noLessons')}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {dayLessons.map(lesson => {
                          // Determine color based on completionStatus for past lessons
                          const getLessonColor = () => {
                            if (lesson.completionStatus === 'DONE') {
                              return 'bg-green-50 border-green-500';
                            } else if (lesson.completionStatus === 'IN_PROCESS') {
                              return 'bg-yellow-50 border-yellow-500';
                            }
                            // Future lessons or no completion status - use status-based colors
                            if (lesson.status === 'COMPLETED') {
                              return 'bg-green-50 border-green-500';
                            } else if (lesson.status === 'IN_PROGRESS') {
                              return 'bg-amber-50 border-amber-500';
                            } else if (lesson.status === 'CANCELLED' || lesson.status === 'MISSED') {
                              return 'bg-[#f6f6f7] border-[rgba(14,14,16,0.18)]';
                            }
                            return 'bg-blue-50 border-blue-500';
                          };

                          return (
                            <div 
                              key={lesson.id}
                              className={`p-2 rounded-lg text-xs border-l-4 ${getLessonColor()}`}
                            >
                              <p className="font-medium text-[#3b3b40] truncate">
                                {formatTime(lesson.scheduledAt)}
                              </p>
                              <p className="text-[#3b3b40] truncate">
                                {lesson.group?.name || t('lessonUnknown')}
                              </p>
                              {lesson.substituteTeacher?.user && (
                                <p className="text-amber-800 truncate mt-0.5" title={t('substituteTeacherTitle')}>
                                  {t('substituteShort')} {lesson.substituteTeacher.user.firstName}{' '}
                                  {lesson.substituteTeacher.user.lastName}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            </div>
          </div>
        )}

        {viewMode === 'month' && (
          <div className="w-full min-w-0 overflow-x-auto rounded-xl border border-[rgba(14,14,16,0.07)] bg-white [-webkit-overflow-scrolling:touch]">
          <div className="min-w-[36rem]">
          <div className="h-[min(70vh,720px)] min-h-0 overflow-hidden">
            <CalendarMonthGrid<Lesson>
              monthDates={monthDates}
              getLessonsForDay={(k) => lessonsByDate[k] ?? []}
              getLessonKey={(l) => l.id}
              getSortTime={(l) => new Date(l.scheduledAt).getTime()}
              isLoading={isLoading}
              renderLesson={({ lesson, variant }) => (
                <button
                  type="button"
                  onClick={() => router.push(`/${locale}${portalBasePath}/calendar/${lesson.id}`)}
                  className={cn(
                    'w-full min-w-0 max-w-full truncate rounded border border-blue-100/90 bg-blue-50/90 text-left text-[#3b3b40] transition hover:border-blue-200 hover:bg-blue-100/80',
                    variant === 'cell'
                      ? 'px-1.5 py-0.5 text-[9px] leading-tight sm:px-2 sm:py-1 sm:text-[10px] sm:leading-tight'
                      : 'px-3 py-2.5 text-sm',
                  )}
                >
                  {formatTime(lesson.scheduledAt)} · {lesson.group?.name ?? t('lessonUnknown')}
                  {lesson.substituteTeacher?.user
                    ? ` · ${t('substituteShort')} ${lesson.substituteTeacher.user.firstName[0]}.`
                    : ''}
                </button>
              )}
            />
          </div>
          </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <>
            {isLoading ? (
              <div className="bg-white rounded-xl border border-[rgba(14,14,16,0.07)] p-8">
                <div className="animate-pulse space-y-4">
                  <div className="h-12 bg-[#f1f1f2] rounded-lg" />
                  <div className="h-12 bg-[#f1f1f2] rounded-lg" />
                  <div className="h-12 bg-[#f1f1f2] rounded-lg" />
                </div>
              </div>
            ) : lessons.length === 0 ? (
              <div className="bg-white rounded-xl border border-[rgba(14,14,16,0.07)] p-8 text-center">
                <p className="text-[#8b8b90]">
                  {searchQuery || selectedTeacherId ? t('noLessonsMatchFilters') : t('noLessonsFound')}
                </p>
              </div>
            ) : (
              <LessonListTable
                lessons={lessons}
                isLoading={isLoading}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                sectionedCalendarList
                showScheduleColumn={false}
                useMobileCards
                onBulkDelete={handleBulkDeleteClick}
                onObligationClick={(lessonId, obligation) => {
                  router.push(`/${locale}${portalBasePath}/calendar/${lessonId}?tab=${obligation}`);
                }}
                onDelete={handleSingleDeleteClick}
                onAssignSubstitute={(lessonId) => {
                  setSubstituteLessonId(lessonId);
                  setSubstituteLessonModalOpen(true);
                }}
              />
            )}
          </>
        )}
      </div>

      {/* Add Lesson Dialog */}
      <AddLessonForm 
        open={isAddLessonOpen} 
        onOpenChange={handleAddLessonOpenChange}
      />

      <SubstituteLessonModal
        open={substituteLessonModalOpen}
        onOpenChange={(open) => {
          setSubstituteLessonModalOpen(open);
          if (!open) setSubstituteLessonId(null);
        }}
        lessonId={substituteLessonId}
        teacherOptions={teacherOptions}
      />

      <BulkDeleteConfirmationDialog
        open={isBulkDeleteDialogOpen}
        onOpenChange={handleBulkDeleteDialogOpenChange}
        onConfirm={handleBulkDeleteConfirm}
        lessonCount={pendingBulkDeleteIds.length}
        isLoading={deleteLessonsBulk.isPending}
        error={bulkDeleteError}
      />

      <BulkDeleteConfirmationDialog
        open={isSingleDeleteDialogOpen}
        onOpenChange={handleSingleDeleteDialogOpenChange}
        onConfirm={handleSingleDeleteConfirm}
        lessonCount={1}
        isLoading={deleteLesson.isPending}
        error={singleDeleteError}
        title={t('deleteThisLessonTitle')}
        description={
          singleDeleteLesson ? (
            t('deleteLessonPermanentFor', {
              group: singleDeleteLesson.group?.name ?? t('unknownGroup'),
              datetime: new Date(singleDeleteLesson.scheduledAt).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              }),
            })
          ) : (
            t('deleteLessonPermanent')
          )
        }
      />

      {deleteNotice && (
        <div
          className={cn(
            'fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border p-4 shadow-lg',
            deleteNotice.variant === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800',
          )}
          role="status"
        >
          <p className="text-sm font-medium">{deleteNotice.text}</p>
        </div>
      )}
    </DashboardLayout>
  );
}
