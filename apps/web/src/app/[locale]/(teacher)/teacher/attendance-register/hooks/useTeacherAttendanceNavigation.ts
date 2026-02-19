import { useState, useEffect } from 'react';
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

interface UseTeacherAttendanceNavigationProps {
  groups: Group[];
  todayLessons: Lesson[];
  hasUnsavedChanges: boolean;
  onGroupChange?: (groupId: string | null) => void;
}

export function useTeacherAttendanceNavigation({
  groups,
  todayLessons,
  hasUnsavedChanges,
  onGroupChange,
}: UseTeacherAttendanceNavigationProps) {
  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  
  // Date state
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedDayForMonthView, setSelectedDayForMonthView] = useState<string | null>(null);

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
        setSelectedGroupId(groupWithLesson.id);
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

  // Handle group change
  const handleGroupChange = (newGroupId: string | null) => {
    if (!confirmWithUnsavedChanges(
      'You have unsaved changes. Are you sure you want to switch groups? Your changes will be lost.'
    )) {
      return;
    }
    setSelectedGroupId(newGroupId);
    setSelectedDayForMonthView(null);
    onGroupChange?.(newGroupId);
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

  return {
    viewMode,
    currentDate,
    selectedGroupId,
    selectedDayForMonthView,
    isCurrentDateToday,
    setSelectedGroupId,
    goToToday,
    handleViewModeChange,
    handleDateChange,
    handleGroupChange,
    handlePrevious,
    handleNext,
    handleDaySelect,
  };
}

