import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
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

export function useAttendanceNavigation({
  groups,
  todayLessons,
  hasUnsavedChanges,
  onGroupChange,
}: UseAttendanceNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize view mode from URL query params, with fallback to 'day'
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const modeFromUrl = searchParams.get('viewMode');
    if (modeFromUrl === 'day' || modeFromUrl === 'week' || modeFromUrl === 'month') {
      return modeFromUrl;
    }
    return 'day';
  });

  // Date state
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Initialize selectedGroupIds from URL query params (support both single and multiple)
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(() => {
    const groupIdParam = searchParams.get('groupId');
    const groupIdsParam = searchParams.get('groupIds');
    if (groupIdsParam) {
      return groupIdsParam.split(',').filter(Boolean);
    }
    if (groupIdParam) {
      return [groupIdParam];
    }
    return [];
  });

  const [selectedDayForMonthView, setSelectedDayForMonthView] = useState<string | null>(null);

  // Update URL query params when selectedGroupIds changes
  const updateGroupIdsInUrl = (groupIds: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    // Remove old single groupId param for backward compatibility
    params.delete('groupId');
    if (groupIds.length > 0) {
      params.set('groupIds', groupIds.join(','));
    } else {
      params.delete('groupIds');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  // Update URL query params when viewMode changes
  const updateViewModeInUrl = (mode: ViewMode) => {
    const params = new URLSearchParams(searchParams.toString());
    if (mode !== 'day') {
      params.set('viewMode', mode);
    } else {
      params.delete('viewMode');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  // Sync selectedGroupIds from URL on mount or when URL changes
  useEffect(() => {
    const groupIdParam = searchParams.get('groupId');
    const groupIdsParam = searchParams.get('groupIds');
    let newGroupIds: string[] = [];
    if (groupIdsParam) {
      newGroupIds = groupIdsParam.split(',').filter(Boolean);
    } else if (groupIdParam) {
      newGroupIds = [groupIdParam];
    }
    setSelectedGroupIds((currentGroupIds) => {
      const currentStr = currentGroupIds.sort().join(',');
      const newStr = newGroupIds.sort().join(',');
      if (currentStr !== newStr) {
        return newGroupIds;
      }
      return currentGroupIds;
    });
  }, [searchParams]);

  // Sync viewMode from URL on mount or when URL changes
  useEffect(() => {
    const modeFromUrl = searchParams.get('viewMode');
    if (modeFromUrl === 'day' || modeFromUrl === 'week' || modeFromUrl === 'month') {
      setViewMode((currentMode) => {
        if (modeFromUrl !== currentMode) {
          return modeFromUrl;
        }
        return currentMode;
      });
    } else if (!modeFromUrl) {
      setViewMode((currentMode) => {
        if (currentMode !== 'day') {
          return 'day';
        }
        return currentMode;
      });
    }
  }, [searchParams]);

  // Confirmation helper
  const confirmWithUnsavedChanges = (message: string): boolean => {
    if (hasUnsavedChanges) {
      return window.confirm(message);
    }
    return true;
  };

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
    if (!confirmWithUnsavedChanges(
      'You have unsaved changes. Are you sure you want to switch view mode? Your changes will be lost.'
    )) {
      return;
    }
    setViewMode(newMode);
    updateViewModeInUrl(newMode);
    setSelectedDayForMonthView(null);
    if (newMode === 'day') {
      setCurrentDate(new Date());
    }
  };

  // Handle date change
  const handleDateChange = (newDate: string) => {
    if (!confirmWithUnsavedChanges(
      'You have unsaved changes. Are you sure you want to change the date? Your changes will be lost.'
    )) {
      return;
    }
    setCurrentDate(new Date(newDate));
    setSelectedDayForMonthView(null);
  };

  // Handle group change (single group - for backward compatibility)
  const handleGroupChange = (newGroupId: string | null) => {
    if (!confirmWithUnsavedChanges(
      'You have unsaved changes. Are you sure you want to switch groups? Your changes will be lost.'
    )) {
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
    if (!confirmWithUnsavedChanges(
      'You have unsaved changes. Are you sure you want to switch groups? Your changes will be lost.'
    )) {
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
    if (!confirmWithUnsavedChanges(
      'You have unsaved changes. Are you sure you want to navigate? Your changes will be lost.'
    )) {
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
    if (!confirmWithUnsavedChanges(
      'You have unsaved changes. Are you sure you want to navigate? Your changes will be lost.'
    )) {
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
    if (!confirmWithUnsavedChanges(
      'You have unsaved changes. Are you sure you want to select a different day? Your changes will be lost.'
    )) {
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

