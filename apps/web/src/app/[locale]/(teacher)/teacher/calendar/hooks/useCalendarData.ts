import { useMemo } from 'react';
import { useLessons, type Lesson } from '@/features/lessons';
import { formatDate, getWeekDates, getMonthDates } from '../utils/calendar-utils';

type ViewMode = 'week' | 'month' | 'list';

interface UseCalendarDataProps {
  viewMode: ViewMode;
  currentDate: Date;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export function useCalendarData({ 
  viewMode, 
  currentDate, 
  sortBy, 
  sortOrder 
}: UseCalendarDataProps) {
  // Calculate date range
  const weekDates = useMemo(() => getWeekDates(new Date(currentDate)), [currentDate]);
  const monthDates = useMemo(() => getMonthDates(new Date(currentDate)), [currentDate]);
  
  // For list view, show lessons from today onwards (no past lessons by default)
  // For week view, show the week
  // For month view, show the month
  const dateFrom = useMemo(() => {
    if (viewMode === 'week') {
      return weekDates[0];
    } else if (viewMode === 'list') {
      // Start from today (beginning of today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    } else {
      return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    }
  }, [viewMode, weekDates, currentDate]);
  
  const dateTo = useMemo(() => {
    if (viewMode === 'week') {
      return new Date(weekDates[6].getTime() + 24 * 60 * 60 * 1000);
    } else if (viewMode === 'list') {
      // Show 3 months forward from today
      const today = new Date();
      today.setMonth(today.getMonth() + 3);
      today.setDate(1); // First day of the month
      return today;
    } else {
      return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }
  }, [viewMode, weekDates, currentDate]);

  // Fetch lessons. Poll every 60s only when tab is visible (no background spam).
  const { data: lessonsData, isLoading, refetch } = useLessons(
    {
      dateFrom: formatDate(dateFrom),
      dateTo: formatDate(dateTo),
      take: 100,
      sortBy: sortBy === 'scheduledAt' ? 'scheduledAt' : undefined,
      sortOrder: sortBy === 'scheduledAt' ? sortOrder : undefined,
    },
    { refetchInterval: 60000, refetchIntervalInBackground: false }
  );

  const lessons = useMemo(() => lessonsData?.items || [], [lessonsData?.items]);

  // Group lessons by date
  const lessonsByDate = useMemo(() => {
    const grouped: Record<string, Lesson[]> = {};
    lessons.forEach(lesson => {
      const dateKey = lesson.scheduledAt.split('T')[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(lesson);
    });
    return grouped;
  }, [lessons]);

  return {
    lessons,
    lessonsByDate,
    isLoading,
    refetch,
    weekDates,
    monthDates,
  };
}





