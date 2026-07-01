import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import type { SearchParamUpdates } from '@/shared/lib/url-search-params';
import { useLocale } from 'next-intl';
import { useRouter } from '@/config/navigation';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { getAdminDailyDutiesBasePath, TEACHER_DAILY_DUTIES_BASE_PATH } from '@/shared/lib/role-routes';
import { readUrlSearchParam } from '@/shared/lib/url-search-params';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';
import {
  formatScheduleDate,
  getMonthDates,
  getWeekDateRangeForApi,
  getWeekDates,
  scheduleDateKeyFromIso,
} from '@/features/schedule/schedule-dates';
import {
  filterLessonsByLocalDateRange,
  getDailyDutiesListReferenceDate,
} from '@/shared/lib/daily-duties/teacher-daily-duties-list-order';
import { useLessons, useLessonStatistics, type Lesson } from '@/features/lessons';
import { useTeachers } from '@/features/teachers';
import type { LessonActionId } from '@/shared/lib/daily-duties/lesson-action-states';
import {
  DAILY_DUTIES_STATUS_FILTER_VALUES,
  filterLessonsByDailyDutiesStatuses,
  filterLessonsByDateAndStatuses,
} from '@/shared/lib/daily-duties/filter-by-daily-duties-status';
import type { DailyDutiesLessonStatus } from '@ilona/types';
import type { DailyDutiesMode, DailyDutiesViewMode, DailyDutiesLessonDetailTab } from './daily-duties.types';
import {
  ADD_LESSON_MODAL_QUERY_VALUE,
  DAILY_DUTIES_MODAL_QUERY_KEY,
  SUBSTITUTE_LESSON_ID_QUERY_KEY,
  SUBSTITUTE_LESSON_MODAL_QUERY_VALUE,
  buildDailyDutiesLessonDetailHref,
  formatDailyDutiesMonthParam,
  formatDailyDutiesWeekParam,
  isAddLessonModalOpen,
  parseDailyDutiesMonthParam,
  parseDailyDutiesWeekParam,
  readDailyDutiesTeacherIdsFromUrl,
  hasDailyDutiesTeacherFilterInUrl,
  readDailyDutiesStatusesFromUrl,
  hasDailyDutiesStatusFilterInUrl,
  readSubstituteLessonModalFromUrl,
  DAILY_DUTIES_FILTER_CLEARED_SENTINEL,
} from './daily-duties-url.util';

export function useDailyDutiesPage(mode: DailyDutiesMode) {
  const isTeacherMode = mode === 'teacher';
  const router = useRouter();
  const { searchParams, urlRevision, replaceParams, replaceAllParams } = useAppSearchUrl();
  const locale = useLocale();
  const { user } = useAuthStore();
  const portalBasePath = isTeacherMode
    ? TEACHER_DAILY_DUTIES_BASE_PATH
    : getAdminDailyDutiesBasePath(user?.role);

  const readViewModeFromUrl = useCallback((): DailyDutiesViewMode => {
    const viewFromUrl = readUrlSearchParam('view', searchParams, urlRevision);
    if (viewFromUrl === 'week' || viewFromUrl === 'month' || viewFromUrl === 'list') {
      return viewFromUrl;
    }
    return 'list';
  }, [searchParams, urlRevision]);

  const [pendingViewMode, setPendingViewMode] = useState<DailyDutiesViewMode | null>(null);
  const viewMode = pendingViewMode ?? readViewModeFromUrl();

  useEffect(() => {
    if (pendingViewMode === null) {
      return;
    }
    if (readViewModeFromUrl() === pendingViewMode) {
      setPendingViewMode(null);
    }
  }, [pendingViewMode, readViewModeFromUrl]);

  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<Set<string>>(new Set());
  const [selectedStatusIds, setSelectedStatusIds] = useState<Set<DailyDutiesLessonStatus>>(
    () => new Set(DAILY_DUTIES_STATUS_FILTER_VALUES),
  );

  const readAnchorDateFromUrl = useCallback((): Date => {
    const view = readViewModeFromUrl();
    if (view === 'month') {
      const parsedMonth = parseDailyDutiesMonthParam(
        readUrlSearchParam('month', searchParams, urlRevision),
      );
      if (parsedMonth) {
        return parsedMonth;
      }
    } else {
      const parsedWeek = parseDailyDutiesWeekParam(
        readUrlSearchParam('week', searchParams, urlRevision),
      );
      if (parsedWeek) {
        return parsedWeek;
      }
    }
    return new Date();
  }, [readViewModeFromUrl, searchParams, urlRevision]);

  const [currentDate, setCurrentDate] = useState(() => {
    if (typeof window === 'undefined') {
      return new Date();
    }
    const params = new URLSearchParams(window.location.search);
    return (
      parseDailyDutiesWeekParam(params.get('week')) ??
      parseDailyDutiesMonthParam(params.get('month')) ??
      new Date()
    );
  });
  const didSeedPeriodInUrlRef = useRef(false);
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(
    () => !isTeacherMode && isAddLessonModalOpen(searchParams),
  );
  const isAddLessonClosingRef = useRef(false);
  const initialSubstituteModal = readSubstituteLessonModalFromUrl(searchParams);
  const [substituteLessonId, setSubstituteLessonId] = useState<string | null>(initialSubstituteModal.lessonId);
  const [substituteLessonModalOpen, setSubstituteLessonModalOpen] = useState(initialSubstituteModal.open);
  const isSubstituteLessonClosingRef = useRef(false);

  const [lessonDetailSheetOpen, setLessonDetailSheetOpen] = useState(false);
  const [lessonDetailSheetId, setLessonDetailSheetId] = useState<string | null>(null);
  const [lessonDetailSheetTab, setLessonDetailSheetTab] = useState<DailyDutiesLessonDetailTab>('absence');

  const { data: teachersData, isLoading: isLoadingTeachers } = useTeachers(
    { status: 'ACTIVE', take: 100 },
    !isTeacherMode,
  );

  const teacherOptions = useMemo(() => {
    if (!teachersData?.items) return [];
    return teachersData.items.map((teacher) => ({
      id: teacher.id,
      label: `${teacher.user.firstName} ${teacher.user.lastName}`,
    }));
  }, [teachersData]);

  const updateViewModeInUrl = (nextMode: DailyDutiesViewMode) => {
    setPendingViewMode(nextMode);
    const updates: SearchParamUpdates = { view: nextMode === 'list' ? null : nextMode };
    if (nextMode === 'month') {
      updates.month = formatDailyDutiesMonthParam(currentDate);
      updates.week = null;
    } else {
      updates.week = formatDailyDutiesWeekParam(currentDate);
      updates.month = null;
    }
    replaceParams(updates);
  };

  const syncAnchorDateToUrl = useCallback(
    (date: Date, mode: DailyDutiesViewMode) => {
      if (mode === 'month') {
        replaceParams({
          month: formatDailyDutiesMonthParam(date),
          week: null,
        });
        return;
      }
      replaceParams({
        week: formatDailyDutiesWeekParam(date),
        month: null,
      });
    },
    [replaceParams],
  );

  useEffect(() => {
    setCurrentDate(readAnchorDateFromUrl());
  }, [readAnchorDateFromUrl]);

  useEffect(() => {
    if (didSeedPeriodInUrlRef.current) {
      return;
    }
    const view = readViewModeFromUrl();
    const hasWeek = Boolean(readUrlSearchParam('week', searchParams, urlRevision));
    const hasMonth = Boolean(readUrlSearchParam('month', searchParams, urlRevision));
    if ((view === 'month' && hasMonth) || (view !== 'month' && hasWeek)) {
      didSeedPeriodInUrlRef.current = true;
      return;
    }
    didSeedPeriodInUrlRef.current = true;
    syncAnchorDateToUrl(currentDate, view);
  }, [currentDate, readViewModeFromUrl, searchParams, syncAnchorDateToUrl, urlRevision]);

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
    if (hasDailyDutiesTeacherFilterInUrl(searchParams)) {
      setSelectedTeacherIds(new Set(readDailyDutiesTeacherIdsFromUrl(searchParams)));
    }

    if (hasDailyDutiesStatusFilterInUrl(searchParams)) {
      const validStatuses = new Set(DAILY_DUTIES_STATUS_FILTER_VALUES);
      const fromUrl = readDailyDutiesStatusesFromUrl(searchParams).filter(
        (status): status is DailyDutiesLessonStatus =>
          validStatuses.has(status as DailyDutiesLessonStatus),
      );
      setSelectedStatusIds(new Set(fromUrl));
    }

    if (!isTeacherMode && !isAddLessonClosingRef.current) {
      setIsAddLessonOpen(isAddLessonModalOpen(searchParams));
    }

    if (!isSubstituteLessonClosingRef.current) {
      const substituteFromUrl = readSubstituteLessonModalFromUrl(searchParams);
      setSubstituteLessonModalOpen(substituteFromUrl.open);
      setSubstituteLessonId(substituteFromUrl.lessonId);
    }
  }, [searchParams, urlRevision, isTeacherMode]);

  useEffect(() => {
    if (isTeacherMode || teacherOptions.length === 0) {
      return;
    }
    if (hasDailyDutiesTeacherFilterInUrl(searchParams)) {
      return;
    }
    setSelectedTeacherIds(new Set(teacherOptions.map((teacher) => teacher.id)));
  }, [isTeacherMode, searchParams, teacherOptions, urlRevision]);

  const updateAddLessonModalInUrl = useCallback(
    (open: boolean) => {
      replaceParams({
        [DAILY_DUTIES_MODAL_QUERY_KEY]: open ? ADD_LESSON_MODAL_QUERY_VALUE : null,
      });
    },
    [replaceParams],
  );

  const handleAddLessonOpenChange = useCallback(
    (open: boolean) => {
      if (isTeacherMode) {
        return;
      }

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
    [isTeacherMode, updateAddLessonModalInUrl],
  );

  const updateSubstituteLessonModalInUrl = useCallback(
    (open: boolean, lessonId: string | null) => {
      replaceParams({
        [DAILY_DUTIES_MODAL_QUERY_KEY]: open ? SUBSTITUTE_LESSON_MODAL_QUERY_VALUE : null,
        [SUBSTITUTE_LESSON_ID_QUERY_KEY]: open && lessonId ? lessonId : null,
      });
    },
    [replaceParams],
  );

  const handleSubstituteLessonOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        isSubstituteLessonClosingRef.current = false;
        setSubstituteLessonModalOpen(true);
        return;
      }

      isSubstituteLessonClosingRef.current = true;
      setSubstituteLessonModalOpen(false);
      setSubstituteLessonId(null);
      updateSubstituteLessonModalInUrl(false, null);
      setTimeout(() => {
        isSubstituteLessonClosingRef.current = false;
      }, 100);
    },
    [updateSubstituteLessonModalInUrl],
  );

  const handleAssignSubstitute = useCallback(
    (lessonId: string) => {
      isSubstituteLessonClosingRef.current = false;
      setSubstituteLessonId(lessonId);
      setSubstituteLessonModalOpen(true);
      updateSubstituteLessonModalInUrl(true, lessonId);
    },
    [updateSubstituteLessonModalInUrl],
  );

  const handleOpenLessonDetail = useCallback(
    (lessonId: string, tab?: string) => {
      router.push(
        buildDailyDutiesLessonDetailHref({
          locale,
          portalBasePath,
          lessonId,
          tab,
        }),
      );
    },
    [locale, portalBasePath, router],
  );

  const handleMobileLessonCardClick = useCallback(
    (lessonId: string, tab?: LessonActionId) => {
      setLessonDetailSheetId(lessonId);
      setLessonDetailSheetTab((tab ?? 'absence') as DailyDutiesLessonDetailTab);
      setLessonDetailSheetOpen(true);
    },
    [],
  );

  const handleLessonDetailSheetOpenChange = useCallback((open: boolean) => {
    setLessonDetailSheetOpen(open);
    if (!open) {
      setLessonDetailSheetId(null);
      setLessonDetailSheetTab('absence');
    }
  }, []);

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
  const { dateFrom: rangeFrom, dateTo: rangeTo } = useMemo(() => {
    if (viewMode === 'month') {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      return { dateFrom: formatScheduleDate(start), dateTo: formatScheduleDate(end) };
    }
    return getWeekDateRangeForApi(weekDates);
  }, [currentDate, viewMode, weekDates]);

  const teacherIdsArray = useMemo(() => {
    if (isTeacherMode || teacherOptions.length === 0) {
      return undefined;
    }
    if (selectedTeacherIds.size === 0) {
      return undefined;
    }
    if (selectedTeacherIds.size >= teacherOptions.length) {
      return undefined;
    }
    return Array.from(selectedTeacherIds);
  }, [isTeacherMode, selectedTeacherIds, teacherOptions.length]);

  const hasPartialTeacherFilter = useMemo(() => {
    if (isTeacherMode || teacherOptions.length === 0) {
      return false;
    }
    return selectedTeacherIds.size < teacherOptions.length;
  }, [isTeacherMode, selectedTeacherIds, teacherOptions.length]);

  const hasPartialStatusFilter = useMemo(() => {
    return selectedStatusIds.size < DAILY_DUTIES_STATUS_FILTER_VALUES.length;
  }, [selectedStatusIds]);

  const { data: lessonsData, isLoading, isFetching } = useLessons(
    {
      dateFrom: rangeFrom,
      dateTo: rangeTo,
      take: viewMode === 'month' ? 500 : 100,
      sortBy: sortBy === 'scheduledAt' ? 'scheduledAt' : undefined,
      sortOrder,
      search: searchQuery || undefined,
      teacherIds: isTeacherMode ? undefined : teacherIdsArray,
    },
    { refetchInterval: 60000, refetchIntervalInBackground: false },
  );

  const { data: stats } = useLessonStatistics();

  const lessons = useMemo(() => {
    const items = lessonsData?.items || [];
    if (
      !isTeacherMode &&
      selectedTeacherIds.size === 0 &&
      hasDailyDutiesTeacherFilterInUrl(searchParams)
    ) {
      return [];
    }
    return items;
  }, [lessonsData?.items, isTeacherMode, selectedTeacherIds.size, searchParams]);

  const lessonsByDate = useMemo(() => {
    const grouped: Record<string, Lesson[]> = {};
    for (const lesson of lessons) {
      const dateKey = scheduleDateKeyFromIso(lesson.scheduledAt);
      if (!dateKey) {
        continue;
      }
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(lesson);
    }
    for (const key of Object.keys(grouped)) {
      grouped[key].sort(
        (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      );
    }
    return grouped;
  }, [lessons]);

  const listViewLessons = useMemo(() => {
    if (viewMode !== 'list') {
      return filterLessonsByDailyDutiesStatuses(lessons, selectedStatusIds);
    }
    const ranged = filterLessonsByLocalDateRange(lessons, weekDates[0], weekDates[6]);
    return filterLessonsByDailyDutiesStatuses(ranged, selectedStatusIds);
  }, [lessons, viewMode, weekDates, selectedStatusIds]);

  const filteredLessonsByDate = useMemo(
    () => filterLessonsByDateAndStatuses(lessonsByDate, selectedStatusIds),
    [lessonsByDate, selectedStatusIds],
  );

  const listReferenceDate = useMemo(() => getDailyDutiesListReferenceDate(weekDates), [weekDates]);

  const isListLoading = isLoading || isFetching;

  const navigatePeriod = (direction: 'prev' | 'next') => {
    const delta = direction === 'next' ? 1 : -1;
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + delta);
    } else {
      newDate.setDate(newDate.getDate() + delta * 7);
    }
    setCurrentDate(newDate);
    syncAnchorDateToUrl(newDate, viewMode);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    syncAnchorDateToUrl(today, viewMode);
  };

  const weekHeader = `${weekDates[0].toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} - ${weekDates[6].toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  const monthHeader = currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      replaceParams({ q: value || null });
    },
    [replaceParams],
  );

  const handleTeacherChange = useCallback(
    (teacherIds: Set<string>) => {
      const allTeacherIds = new Set(teacherOptions.map((teacher) => teacher.id));
      const isAllSelected =
        teacherOptions.length > 0 && teacherIds.size >= teacherOptions.length;

      if (isAllSelected) {
        setSelectedTeacherIds(allTeacherIds);
        replaceAllParams((params) => {
          params.delete('teacherId');
          params.delete('teacherIds');
        });
        return;
      }

      if (teacherIds.size === 0) {
        setSelectedTeacherIds(new Set());
        replaceAllParams((params) => {
          params.delete('teacherId');
          params.delete('teacherIds');
          params.set('teacherIds', DAILY_DUTIES_FILTER_CLEARED_SENTINEL);
        });
        return;
      }

      setSelectedTeacherIds(teacherIds);
      replaceAllParams((params) => {
        params.delete('teacherId');
        params.delete('teacherIds');
        for (const id of teacherIds) {
          params.append('teacherIds', id);
        }
      });
    },
    [replaceAllParams, teacherOptions],
  );

  const handleStatusChange = useCallback(
    (statusIds: Set<string>) => {
      const allStatusIds = new Set(DAILY_DUTIES_STATUS_FILTER_VALUES);
      const nextStatuses = new Set(
        [...statusIds].filter((id): id is DailyDutiesLessonStatus =>
          allStatusIds.has(id as DailyDutiesLessonStatus),
        ),
      );
      const isAllSelected =
        nextStatuses.size >= DAILY_DUTIES_STATUS_FILTER_VALUES.length;

      if (isAllSelected) {
        setSelectedStatusIds(allStatusIds);
        replaceAllParams((params) => {
          params.delete('status');
          params.delete('statuses');
        });
        return;
      }

      if (nextStatuses.size === 0) {
        setSelectedStatusIds(new Set());
        replaceAllParams((params) => {
          params.delete('status');
          params.delete('statuses');
          params.set('statuses', DAILY_DUTIES_FILTER_CLEARED_SENTINEL);
        });
        return;
      }

      setSelectedStatusIds(nextStatuses);
      replaceAllParams((params) => {
        params.delete('status');
        params.delete('statuses');
        for (const id of nextStatuses) {
          params.append('statuses', id);
        }
      });
    },
    [replaceAllParams],
  );

  return {
    isTeacherMode,
    locale,
    portalBasePath,
    router,
    viewMode,
    updateViewModeInUrl,
    weekDates,
    monthDates,
    weekHeader,
    monthHeader,
    navigatePeriod,
    goToToday,
    stats,
    searchQuery,
    selectedTeacherIds,
    selectedStatusIds,
    teacherOptions,
    hasPartialTeacherFilter,
    hasPartialStatusFilter,
    isLoadingTeachers,
    handleSearchChange,
    handleTeacherChange,
    handleStatusChange,
    isLoading,
    isListLoading,
    lessons,
    listViewLessons,
    filteredLessonsByDate,
    listReferenceDate,
    sortBy,
    sortOrder,
    handleSort,
    handleAddLessonOpenChange,
    isAddLessonOpen,
    substituteLessonModalOpen,
    substituteLessonId,
    handleSubstituteLessonOpenChange,
    handleAssignSubstitute,
    lessonDetailSheetOpen,
    lessonDetailSheetId,
    lessonDetailSheetTab,
    handleLessonDetailSheetOpenChange,
    handleOpenLessonDetail,
    handleMobileLessonCardClick,
  };
}
