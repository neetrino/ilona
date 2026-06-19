import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { readUrlSearchParam, replaceAppSearchUrl } from '@/shared/lib/url-search-params';
import {
  getPreviousWeek,
  getNextWeek,
  getPreviousMonth,
  getNextMonth,
  isToday,
  formatDateString,
  type ViewMode,
} from '@/features/attendance/utils/dateUtils';
import type { Group } from '@/features/groups';
import type { Lesson } from '@/features/lessons';

interface UseAttendanceNavigationProps {
  groups: Group[];
  todayLessons: Lesson[];
  hasUnsavedChanges: boolean;
  onGroupChange?: (groupId: string | null) => void;
}

const getDefaultViewMode = (): ViewMode => {
  if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1366px)').matches) {
    return 'day';
  }
  return 'week';
};

export function useAttendanceNavigation({
  groups,
  todayLessons,
  hasUnsavedChanges,
  onGroupChange,
}: UseAttendanceNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('attendance');
  const [urlRevision, setUrlRevision] = useState(0);

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

  const readViewModeFromUrl = useCallback((): ViewMode => {
    const modeFromUrl = readUrlSearchParam('viewMode', searchParams);
    if (modeFromUrl === 'day' || modeFromUrl === 'week' || modeFromUrl === 'month') {
      return modeFromUrl;
    }
    return getDefaultViewMode();
  }, [searchParams, urlRevision]);

  const [pendingViewMode, setPendingViewMode] = useState<ViewMode | null>(null);
  const viewMode = pendingViewMode ?? readViewModeFromUrl();

  useEffect(() => {
    if (pendingViewMode === null) {
      return;
    }
    if (readViewModeFromUrl() === pendingViewMode) {
      setPendingViewMode(null);
    }
  }, [pendingViewMode, readViewModeFromUrl]);

  // Date state
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Initialize selectedGroupIds from URL query params (support both single and multiple)
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(() => {
    const groupIdsParam = readUrlSearchParam('groupIds', searchParams);
    const groupIdParam = readUrlSearchParam('groupId', searchParams);
    if (groupIdsParam) {
      return groupIdsParam.split(',').filter(Boolean);
    }
    if (groupIdParam) {
      return [groupIdParam];
    }
    return [];
  });

  const [selectedDayForMonthView, setSelectedDayForMonthView] = useState<string | null>(null);

  const updateGroupIdsInUrl = (groupIds: string[]) => {
    replaceParams({
      groupId: null,
      groupIds: groupIds.length > 0 ? groupIds.join(',') : null,
    });
  };

  const updateViewModeInUrl = (mode: ViewMode) => {
    setPendingViewMode(mode);
    replaceParams({ viewMode: mode === 'week' ? null : mode });
  };

  // Sync selectedGroupIds from URL on mount or when URL changes
  useEffect(() => {
    const groupIdsParam = readUrlSearchParam('groupIds', searchParams);
    const groupIdParam = readUrlSearchParam('groupId', searchParams);
    let newGroupIds: string[] = [];
    if (groupIdsParam) {
      newGroupIds = groupIdsParam.split(',').filter(Boolean);
    } else if (groupIdParam) {
      newGroupIds = [groupIdParam];
    }
    setSelectedGroupIds((currentGroupIds) => {
      const currentStr = [...currentGroupIds].sort().join(',');
      const newStr = [...newGroupIds].sort().join(',');
      if (currentStr !== newStr) {
        return newGroupIds;
      }
      return currentGroupIds;
    });
  }, [searchParams, urlRevision]);

  // Confirmation helper
  const confirmWithUnsavedChanges = (message: string): boolean => {
    if (hasUnsavedChanges) {
      return window.confirm(message);
    }
    return true;
  };

  const confirmWithAction = (actionKey: 'switchViewMode' | 'changeDate' | 'switchGroups' | 'navigate' | 'selectDifferentDay') =>
    confirmWithUnsavedChanges(t('unsavedChangesWarning', { action: t(actionKey) }));

  // Helper function to go back to today
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDayForMonthView(null);
    if (todayLessons.length > 0 && groups.length > 0) {
      const groupWithLesson = groups.find((group) =>
        todayLessons.some((lesson) => lesson.groupId === group.id)
      );
      if (groupWithLesson) {
        const newGroupIds = [groupWithLesson.id];
        setSelectedGroupIds(newGroupIds);
        updateGroupIdsInUrl(newGroupIds);
        onGroupChange?.(groupWithLesson.id);
      }
    }
  };

  // Check if current date is today (for day view)
  const isCurrentDateToday = viewMode === 'day' && isToday(currentDate);

  // Handle view mode change
  const handleViewModeChange = (newMode: ViewMode) => {
    if (!confirmWithAction('switchViewMode')) {
      return;
    }
    updateViewModeInUrl(newMode);
    setSelectedDayForMonthView(null);
    if (newMode === 'day') {
      setCurrentDate(new Date());
    }
  };

  // Handle date change
  const handleDateChange = (newDate: string) => {
    if (!confirmWithAction('changeDate')) {
      return;
    }
    setCurrentDate(new Date(newDate));
    setSelectedDayForMonthView(null);
  };

  // Handle group change (single group - for backward compatibility)
  const handleGroupChange = (newGroupId: string | null) => {
    if (!confirmWithAction('switchGroups')) {
      return;
    }
    const newGroupIds = newGroupId ? [newGroupId] : [];
    setSelectedGroupIds(newGroupIds);
    updateGroupIdsInUrl(newGroupIds);
    setSelectedDayForMonthView(null);
    onGroupChange?.(newGroupId);
  };

  // Handle multiple groups change
  const handleGroupsChange = (newGroupIds: string[]) => {
    if (!confirmWithAction('switchGroups')) {
      return;
    }
    setSelectedGroupIds(newGroupIds);
    updateGroupIdsInUrl(newGroupIds);
    setSelectedDayForMonthView(null);
    // For backward compatibility, call onGroupChange with first group or null
    onGroupChange?.(newGroupIds.length > 0 ? newGroupIds[0] : null);
  };

  // Navigation handlers
  const handlePrevious = () => {
    if (!confirmWithAction('navigate')) {
      return;
    }
    if (viewMode === 'week') {
      setCurrentDate(getPreviousWeek(currentDate));
    } else if (viewMode === 'month') {
      setCurrentDate(getPreviousMonth(currentDate));
      setSelectedDayForMonthView(null);
    }
  };

  const handleNext = () => {
    if (!confirmWithAction('navigate')) {
      return;
    }
    if (viewMode === 'week') {
      setCurrentDate(getNextWeek(currentDate));
    } else if (viewMode === 'month') {
      setCurrentDate(getNextMonth(currentDate));
      setSelectedDayForMonthView(null);
    }
  };

  // Handle day selection in month view
  const handleDaySelect = (date: Date) => {
    if (!confirmWithAction('selectDifferentDay')) {
      return;
    }
    const dateStr = formatDateString(date);
    setSelectedDayForMonthView(dateStr);
  };

  // Backward compatibility: selectedGroupId returns first selected group or null
  const selectedGroupId = selectedGroupIds.length > 0 ? selectedGroupIds[0] : null;

  // Backward compatibility wrapper for updateGroupIdInUrl
  const updateGroupIdInUrl = (groupId: string | null) => {
    const groupIds = groupId ? [groupId] : [];
    updateGroupIdsInUrl(groupIds);
  };

  return {
    viewMode,
    currentDate,
    selectedGroupId, // For backward compatibility
    selectedGroupIds, // New multi-select support
    selectedDayForMonthView,
    isCurrentDateToday,
    setSelectedGroupId: (id: string | null) => handleGroupChange(id), // For backward compatibility
    updateGroupIdInUrl, // For backward compatibility
    goToToday,
    handleViewModeChange,
    handleDateChange,
    handleGroupChange, // For backward compatibility
    handleGroupsChange, // New multi-select support
    handlePrevious,
    handleNext,
    handleDaySelect,
  };
}

