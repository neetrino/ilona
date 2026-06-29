import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from '@/config/navigation';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { getAdminPortalBasePath, TEACHER_DAILY_DUTIES_BASE_PATH } from '@/shared/lib/role-routes';
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
  getCalendarListReferenceDate,
} from '@/shared/lib/calendar/teacher-calendar-list-order';
import { useLessons, useLessonStatistics, type Lesson } from '@/features/lessons';
import { useTeachers } from '@/features/teachers';
import type { LessonActionId } from '@/shared/lib/calendar/lesson-action-states';
import type { PortalCalendarMode, PortalCalendarViewMode, PortalLessonDetailTab } from './portal-calendar.types';
import {
  ADD_LESSON_MODAL_QUERY_VALUE,
  CALENDAR_MODAL_QUERY_KEY,
  SUBSTITUTE_LESSON_ID_QUERY_KEY,
  SUBSTITUTE_LESSON_MODAL_QUERY_VALUE,
  isAddLessonModalOpen,
  readSubstituteLessonModalFromUrl,
} from './portal-calendar-url.util';

export function usePortalCalendarPage(mode: PortalCalendarMode) {
  const isTeacherMode = mode === 'teacher';
  const router = useRouter();
  const { searchParams, urlRevision, replaceParams } = useAppSearchUrl();
  const locale = useLocale();
  const { user } = useAuthStore();
  const portalBasePath = isTeacherMode
    ? TEACHER_DAILY_DUTIES_BASE_PATH
    : getAdminPortalBasePath(user?.role);

  const readViewModeFromUrl = useCallback((): PortalCalendarViewMode => {
    const viewFromUrl = readUrlSearchParam('view', searchParams, urlRevision);
    if (viewFromUrl === 'week' || viewFromUrl === 'month' || viewFromUrl === 'list') {
      return viewFromUrl;
    }
    return 'list';
  }, [searchParams, urlRevision]);

  const [pendingViewMode, setPendingViewMode] = useState<PortalCalendarViewMode | null>(null);
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
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');

  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(() => isAddLessonModalOpen(searchParams));
  const isAddLessonClosingRef = useRef(false);
  const initialSubstituteModal = readSubstituteLessonModalFromUrl(searchParams);
  const [substituteLessonId, setSubstituteLessonId] = useState<string | null>(initialSubstituteModal.lessonId);
  const [substituteLessonModalOpen, setSubstituteLessonModalOpen] = useState(initialSubstituteModal.open);
  const isSubstituteLessonClosingRef = useRef(false);

  const [lessonDetailSheetOpen, setLessonDetailSheetOpen] = useState(false);
  const [lessonDetailSheetId, setLessonDetailSheetId] = useState<string | null>(null);
  const [lessonDetailSheetTab, setLessonDetailSheetTab] = useState<PortalLessonDetailTab>('absence');

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

  const updateViewModeInUrl = (nextMode: PortalCalendarViewMode) => {
    setPendingViewMode(nextMode);
    replaceParams({ view: nextMode === 'list' ? null : nextMode });
  };

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

    if (!isSubstituteLessonClosingRef.current) {
      const substituteFromUrl = readSubstituteLessonModalFromUrl(searchParams);
      setSubstituteLessonModalOpen(substituteFromUrl.open);
      setSubstituteLessonId(substituteFromUrl.lessonId);
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

  const updateSubstituteLessonModalInUrl = useCallback(
    (open: boolean, lessonId: string | null) => {
      replaceParams({
        [CALENDAR_MODAL_QUERY_KEY]: open ? SUBSTITUTE_LESSON_MODAL_QUERY_VALUE : null,
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
      const query = tab ? `?tab=${tab}` : '';
      router.push(`/${locale}${portalBasePath}/calendar/${lessonId}${query}`);
    },
    [locale, portalBasePath, router],
  );

  const handleMobileLessonCardClick = useCallback(
    (lessonId: string, tab?: LessonActionId) => {
      setLessonDetailSheetId(lessonId);
      setLessonDetailSheetTab((tab ?? 'absence') as PortalLessonDetailTab);
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

  const { data: lessonsData, isLoading, isFetching } = useLessons(
    {
      dateFrom: rangeFrom,
      dateTo: rangeTo,
      take: viewMode === 'month' ? 500 : 100,
      sortBy: sortBy === 'scheduledAt' ? 'scheduledAt' : undefined,
      sortOrder,
      search: searchQuery || undefined,
      teacherId: isTeacherMode ? undefined : selectedTeacherId || undefined,
    },
    { refetchInterval: 60000, refetchIntervalInBackground: false },
  );

  const { data: stats } = useLessonStatistics();

  const lessons = useMemo(() => lessonsData?.items || [], [lessonsData?.items]);

  const listViewLessons = useMemo(() => {
    if (viewMode !== 'list') {
      return lessons;
    }
    return filterLessonsByLocalDateRange(lessons, weekDates[0], weekDates[6]);
  }, [lessons, viewMode, weekDates]);

  const listReferenceDate = useMemo(() => getCalendarListReferenceDate(weekDates), [weekDates]);

  const isListLoading = isLoading || isFetching;

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

  const navigatePeriod = (direction: 'prev' | 'next') => {
    const delta = direction === 'next' ? 1 : -1;
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + delta);
    } else {
      newDate.setDate(newDate.getDate() + delta * 7);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
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
    (teacherId: string) => {
      setSelectedTeacherId(teacherId);
      replaceParams({ teacherId: teacherId || null });
    },
    [replaceParams],
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
    selectedTeacherId,
    teacherOptions,
    isLoadingTeachers,
    handleSearchChange,
    handleTeacherChange,
    isLoading,
    isListLoading,
    lessons,
    listViewLessons,
    listReferenceDate,
    lessonsByDate,
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
