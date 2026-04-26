'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { StatCard, Button } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { LessonListTable } from '@/shared/components/calendar/LessonListTable';
import { useLessons, useLessonStatistics, useCancelLesson, AddLessonForm, type Lesson, type LessonStatus } from '@/features/lessons';
import { useTeachers } from '@/features/teachers';
import { CalendarFilters } from './components/CalendarFilters';

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

function isAddLessonModalInSearchParams(params: URLSearchParams): boolean {
  return params.get(CALENDAR_MODAL_QUERY_KEY) === ADD_LESSON_MODAL_QUERY_VALUE;
}

export default function CalendarPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Initialize view mode from URL query params, with fallback to 'list'
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'list'>(() => {
    const viewFromUrl = searchParams.get('view');
    if (viewFromUrl === 'week' || viewFromUrl === 'month' || viewFromUrl === 'list') {
      return viewFromUrl;
    }
    return 'list'; // Default to list view
  });
  
  // Initialize sort state from URL query params
  const [sortBy, setSortBy] = useState<string | undefined>(() => {
    return searchParams.get('sortBy') || undefined;
  });
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>(() => {
    const order = searchParams.get('sortOrder');
    if (order === 'asc' || order === 'desc') {
      return order;
    }
    return undefined;
  });

  // Initialize filter state from URL query params
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    return searchParams.get('q') || '';
  });
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(() => {
    return searchParams.get('teacherId') || '';
  });
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(() =>
    isAddLessonModalInSearchParams(searchParams)
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
    // Update state immediately for responsive UI
    setViewMode(mode);
    
    // Update URL to persist the selection
    const params = new URLSearchParams(searchParams.toString());
    if (mode === 'list') {
      // Remove 'view' param for default list view to keep URL clean
      params.delete('view');
    } else {
      params.set('view', mode);
    }
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl);
  };
  
  // Sync view mode from URL (for browser back/forward navigation)
  useEffect(() => {
    const viewFromUrl = searchParams.get('view');
    if (viewFromUrl === 'week' || viewFromUrl === 'month' || viewFromUrl === 'list') {
      setViewMode(viewFromUrl);
    } else if (!viewFromUrl) {
      setViewMode('list');
    }
    
    // Sync sort state from URL
    const sortByFromUrl = searchParams.get('sortBy');
    const sortOrderFromUrl = searchParams.get('sortOrder');
    setSortBy(sortByFromUrl || undefined);
    if (sortOrderFromUrl === 'asc' || sortOrderFromUrl === 'desc') {
      setSortOrder(sortOrderFromUrl);
    } else {
      setSortOrder(undefined);
    }

    // Sync filter state from URL
    setSearchQuery(searchParams.get('q') || '');
    setSelectedTeacherId(searchParams.get('teacherId') || '');

    setIsAddLessonOpen(isAddLessonModalInSearchParams(searchParams));
  }, [searchParams]);

  const updateAddLessonModalInUrl = useCallback(
    (open: boolean) => {
      const params = new URLSearchParams(searchParams.toString());
      if (open) {
        params.set(CALENDAR_MODAL_QUERY_KEY, ADD_LESSON_MODAL_QUERY_VALUE);
      } else {
        params.delete(CALENDAR_MODAL_QUERY_KEY);
      }
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const handleAddLessonOpenChange = useCallback(
    (open: boolean) => {
      setIsAddLessonOpen(open);
      updateAddLessonModalInUrl(open);
    },
    [updateAddLessonModalInUrl]
  );
  
  // Handle sort toggle
  const handleSort = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (sortBy === key && sortOrder) {
      // Toggle order if already sorting by this column
      const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      setSortOrder(newOrder);
      params.set('sortBy', key);
      params.set('sortOrder', newOrder);
    } else {
      // Start sorting by this column (default to ascending)
      setSortBy(key);
      setSortOrder('asc');
      params.set('sortBy', key);
      params.set('sortOrder', 'asc');
    }
    
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl);
  };
  
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);
  const monthDates = useMemo(() => getMonthDates(currentDate), [currentDate]);
  const { rangeFrom, rangeTo } = useMemo(() => {
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
      take: 100,
      sortBy: sortBy === 'scheduledAt' ? 'scheduledAt' : undefined,
      sortOrder: sortOrder,
      search: searchQuery || undefined,
      teacherId: selectedTeacherId || undefined,
    },
    { refetchInterval: 60000, refetchIntervalInBackground: false }
  );

  // Fetch statistics
  const { data: stats } = useLessonStatistics();

  // Cancel mutation
  const cancelLesson = useCancelLesson();

  const lessons = useMemo(() => lessonsData?.items || [], [lessonsData?.items]);

  // Group lessons by date
  const lessonsByDate = useMemo(() => {
    const grouped: Record<string, Lesson[]> = {};
    weekDates.forEach(date => {
      grouped[formatDate(date)] = [];
    });
    
    lessons.forEach(lesson => {
      const dateKey = lesson.scheduledAt.split('T')[0];
      if (grouped[dateKey]) {
        grouped[dateKey].push(lesson);
      }
    });

    // Sort by time
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => 
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      );
    });

    return grouped;
  }, [lessons, weekDates]);

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

  // Handle cancel
  const handleCancel = async (id: string) => {
    if (confirm('Are you sure you want to cancel this lesson?')) {
      try {
        await cancelLesson.mutateAsync({ id });
      } catch (err) {
        console.error('Failed to cancel lesson:', err);
      }
    }
  };

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
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('q', value);
    } else {
      params.delete('q');
    }
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl);
  }, [searchParams, pathname, router]);

  const handleTeacherChange = useCallback((teacherId: string) => {
    setSelectedTeacherId(teacherId);
    const params = new URLSearchParams(searchParams.toString());
    if (teacherId) {
      params.set('teacherId', teacherId);
    } else {
      params.delete('teacherId');
    }
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl);
  }, [searchParams, pathname, router]);

  return (
    <DashboardLayout 
      title="Lesson Calendar" 
      subtitle="Schedule and manage lessons across all groups."
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <StatCard
            title="Total Lessons"
            value={stats?.total || 0}
          />
          <StatCard
            title="Completed"
            value={stats?.completed || 0}
            change={{ value: `${stats?.completionRate || 0}%`, type: 'positive' }}
          />
          <StatCard
            title="Scheduled"
            value={stats?.scheduled || 0}
            change={{ value: 'Upcoming', type: 'neutral' }}
          />
          <StatCard
            title="In Progress"
            value={stats?.inProgress || 0}
            change={{ value: 'Live now', type: 'warning' }}
          />
          <StatCard
            title="Cancelled/Missed"
            value={(stats?.cancelled || 0) + (stats?.missed || 0)}
          />
        </div>

        {/* Calendar Controls */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-4">
            <button
              onClick={goToPreviousWeek}
              className="p-2 rounded-lg hover:bg-slate-100"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-slate-800">
              {viewMode === 'month' ? monthHeader : weekHeader}
            </h2>
            <button
              onClick={goToNextWeek}
              className="p-2 rounded-lg hover:bg-slate-100"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              Today
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border-2 border-slate-300 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => updateViewModeInUrl('list')}
                className={cn(
                  'px-4 py-2 text-sm font-semibold rounded-md transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  viewMode === 'list'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-slate-700 hover:bg-slate-100'
                )}
                aria-pressed={viewMode === 'list'}
              >
                List
              </button>
              <button
                type="button"
                onClick={() => updateViewModeInUrl('week')}
                className={cn(
                  'px-4 py-2 text-sm font-semibold rounded-md transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  viewMode === 'week'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-slate-700 hover:bg-slate-100'
                )}
                aria-pressed={viewMode === 'week'}
              >
                Week
              </button>
              <button
                type="button"
                onClick={() => updateViewModeInUrl('month')}
                className={cn(
                  'px-4 py-2 text-sm font-semibold rounded-md transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  viewMode === 'month'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-slate-700 hover:bg-slate-100'
                )}
                aria-pressed={viewMode === 'month'}
              >
                Month
              </button>
            </div>
            <Button
              type="button"
              variant="default"
              onClick={() => handleAddLessonOpenChange(true)}
              className="font-semibold shadow-sm"
            >
              + Add Lesson
            </Button>
          </div>
        </div>

        {/* Week View */}
        {viewMode === 'week' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-slate-200">
              {weekDates.map((date, i) => (
                <div 
                  key={i}
                  className={`p-3 text-center border-r last:border-r-0 border-slate-200 ${
                    isToday(date) ? 'bg-blue-50' : ''
                  }`}
                >
                  <p className="text-xs text-slate-500 uppercase">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                  <p className={`text-lg font-semibold ${
                    isToday(date) ? 'text-blue-600' : 'text-slate-800'
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
                    className={`p-2 border-r last:border-r-0 border-slate-200 ${
                      isToday(date) ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    {isLoading ? (
                      <div className="animate-pulse space-y-2">
                        <div className="h-16 bg-slate-200 rounded-lg" />
                        <div className="h-16 bg-slate-200 rounded-lg" />
                      </div>
                    ) : dayLessons.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">
                        {searchQuery || selectedTeacherId ? 'No lessons match filters' : 'No lessons'}
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
                              return 'bg-slate-100 border-slate-400';
                            }
                            return 'bg-blue-50 border-blue-500';
                          };

                          return (
                            <div 
                              key={lesson.id}
                              className={`p-2 rounded-lg text-xs border-l-4 ${getLessonColor()}`}
                            >
                              <p className="font-medium text-slate-800 truncate">
                                {formatTime(lesson.scheduledAt)}
                              </p>
                              <p className="text-slate-600 truncate">
                                {lesson.group?.name || 'Unknown'}
                              </p>
                              <p className="text-slate-500 truncate">
                                {lesson.topic || 'No topic'}
                              </p>
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
        )}

        {viewMode === 'month' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-7 border-b border-slate-200">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-slate-600 bg-slate-50">
                  {day}
                </div>
              ))}
            </div>
            <div className="divide-y divide-slate-200">
              {monthDates.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 divide-x divide-slate-200">
                  {week.map((date, dayIndex) => {
                    if (!date) return <div key={dayIndex} className="min-h-[120px] bg-slate-50" />;
                    const dateKey = formatDate(date);
                    const dayLessons = lessonsByDate[dateKey] || [];
                    return (
                      <div key={dayIndex} className="min-h-[120px] p-2">
                        <p className="mb-1 text-sm font-medium text-slate-700">{date.getDate()}</p>
                        <div className="space-y-1">
                          {dayLessons.slice(0, 2).map((lesson) => (
                            <button
                              key={lesson.id}
                              type="button"
                              onClick={() => router.push(`/admin/calendar/${lesson.id}`)}
                              className="w-full rounded border border-blue-100 bg-blue-50 px-2 py-1 text-left text-xs text-slate-700 hover:bg-blue-100"
                            >
                              {formatTime(lesson.scheduledAt)} · {lesson.group?.name || 'Unknown'}
                            </button>
                          ))}
                          {dayLessons.length > 2 && (
                            <p className="text-xs text-slate-500">+{dayLessons.length - 2} more</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <>
            {isLoading ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8">
                <div className="animate-pulse space-y-4">
                  <div className="h-12 bg-slate-200 rounded-lg" />
                  <div className="h-12 bg-slate-200 rounded-lg" />
                  <div className="h-12 bg-slate-200 rounded-lg" />
                </div>
              </div>
            ) : lessons.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <p className="text-slate-500">
                  {searchQuery || selectedTeacherId ? 'No lessons match the current filters' : 'No lessons found'}
                </p>
              </div>
            ) : (
              <LessonListTable
                lessons={lessons}
                isLoading={isLoading}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                onObligationClick={(lessonId, obligation) => {
                  router.push(`/admin/calendar/${lessonId}?tab=${obligation}`);
                }}
                onDelete={(lessonId) => {
                  if (confirm('Are you sure you want to delete this lesson?')) {
                    handleCancel(lessonId);
                  }
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
    </DashboardLayout>
  );
}
