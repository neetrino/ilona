'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { LessonListTable } from '@/shared/components/calendar/LessonListTable';
import { useLessons, type Lesson } from '@/features/lessons';
import { AddCourseForm } from '@/features/lessons/components/AddCourseForm';
import { EditLessonForm } from '@/features/lessons/components/EditLessonForm';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { useTranslations } from 'next-intl';

type ViewMode = 'week' | 'month' | 'list';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeekDates(date: Date): Date[] {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(date.setDate(diff));
  
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function getMonthDates(date: Date): (Date | null)[][] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const startDay = firstDay.getDay() || 7; // Monday = 1, Sunday = 7
  const totalDays = lastDay.getDate();
  
  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = [];
  
  // Fill empty days at start
  for (let i = 1; i < startDay; i++) {
    currentWeek.push(null);
  }
  
  // Fill actual days
  for (let day = 1; day <= totalDays; day++) {
    currentWeek.push(new Date(year, month, day));
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  
  // Fill empty days at end
  while (currentWeek.length > 0 && currentWeek.length < 7) {
    currentWeek.push(null);
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }
  
  return weeks;
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    SCHEDULED: 'bg-blue-500',
    IN_PROGRESS: 'bg-yellow-500',
    COMPLETED: 'bg-green-500',
    CANCELLED: 'bg-red-500',
    MISSED: 'bg-slate-400',
  };
  
  return <span className={cn('w-2 h-2 rounded-full inline-block', colors[status] || colors.SCHEDULED)} />;
}

function LessonBlock({ lesson }: { lesson: Lesson }) {
  const time = new Date(lesson.scheduledAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div className={cn(
      'p-2 rounded-lg text-xs mb-1 cursor-pointer transition-colors',
      lesson.status === 'COMPLETED' ? 'bg-green-100 hover:bg-green-200' :
      lesson.status === 'IN_PROGRESS' ? 'bg-yellow-100 hover:bg-yellow-200' :
      lesson.status === 'CANCELLED' ? 'bg-red-100 hover:bg-red-200' :
      'bg-blue-100 hover:bg-blue-200'
    )}>
      <div className="flex items-center gap-1 mb-1">
        <StatusDot status={lesson.status} />
        <span className="font-medium">{time}</span>
      </div>
      <p className="truncate font-medium">{lesson.group?.name}</p>
      {lesson.topic && <p className="truncate text-slate-500">{lesson.topic}</p>}
    </div>
  );
}

export default function TeacherCalendarPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('calendar');
  const tCommon = useTranslations('common');
  
  // Initialize view mode from URL query params, with fallback to 'list'
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const viewFromUrl = searchParams.get('view');
    if (viewFromUrl === 'week' || viewFromUrl === 'month' || viewFromUrl === 'list') {
      return viewFromUrl;
    }
    return 'list'; // Default to list view
  });
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('scheduledAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Update URL when view mode changes
  const updateViewModeInUrl = (mode: ViewMode) => {
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
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // Sync view mode from URL (for browser back/forward navigation)
  useEffect(() => {
    const viewFromUrl = searchParams.get('view');
    if (viewFromUrl === 'week' || viewFromUrl === 'month' || viewFromUrl === 'list') {
      setViewMode(viewFromUrl);
    } else if (!viewFromUrl) {
      setViewMode('list');
    }
  }, [searchParams]);

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
      return weekDates[6];
    } else if (viewMode === 'list') {
      // Show 3 months forward from today
      const today = new Date();
      today.setMonth(today.getMonth() + 3);
      today.setDate(0); // Last day of the month
      return today;
    } else {
      return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    }
  }, [viewMode, weekDates, currentDate]);

  // Format dates for API (use local date to avoid timezone shifts)
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Handle sorting
  const handleSort = (key: string) => {
    if (sortBy === key) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort column and default to ascending
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  // Fetch lessons using main endpoint (automatically scoped by backend for teachers)
  const { data: lessonsData, isLoading } = useLessons({
    dateFrom: formatDate(dateFrom),
    dateTo: formatDate(dateTo),
    take: 100,
    sortBy: sortBy === 'scheduledAt' ? 'scheduledAt' : undefined,
    sortOrder: sortBy === 'scheduledAt' ? sortOrder : undefined,
  });

  const lessons = lessonsData?.items || [];

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

  const goToToday = () => setCurrentDate(new Date());
  
  const navigate = (direction: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + direction * 7);
    } else {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    setCurrentDate(newDate);
  };

  const formatHeader = () => {
    if (viewMode === 'week') {
      return `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <DashboardLayout
      title={t('title') || 'My Calendar'}
      subtitle={t('subtitle') || 'View your teaching schedule.'}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-slate-800 min-w-[200px] text-center">
            {formatHeader()}
          </h2>
          <button
            onClick={() => navigate(1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={goToToday}
            className="ml-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('today') || 'Today'}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => updateViewModeInUrl('list')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600'
              )}
            >
              {t('list') || 'List'}
            </button>
            <button
              onClick={() => updateViewModeInUrl('week')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                viewMode === 'week' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600'
              )}
            >
              {t('week') || 'Week'}
            </button>
            <button
              onClick={() => updateViewModeInUrl('month')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                viewMode === 'month' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600'
              )}
            >
              {t('month') || 'Month'}
            </button>
          </div>
          {viewMode === 'list' && (
            <Button
              onClick={() => setIsAddCourseOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {t('addCourse') || 'Add Course'}
            </Button>
          )}
        </div>
      </div>

      {/* Legend */}
      {viewMode !== 'list' && (
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1">
            <StatusDot status="SCHEDULED" />
            <span className="text-slate-600">{t('scheduled') || 'Scheduled'}</span>
          </div>
          <div className="flex items-center gap-1">
            <StatusDot status="IN_PROGRESS" />
            <span className="text-slate-600">{t('inProgress') || 'In Progress'}</span>
          </div>
          <div className="flex items-center gap-1">
            <StatusDot status="COMPLETED" />
            <span className="text-slate-600">{t('completed') || 'Completed'}</span>
          </div>
          <div className="flex items-center gap-1">
            <StatusDot status="CANCELLED" />
            <span className="text-slate-600">{t('cancelled') || 'Cancelled'}</span>
          </div>
        </div>
      )}

      {/* Calendar */}
      {viewMode === 'list' ? (
        <>
          <LessonListTable
            lessons={lessons}
            isLoading={isLoading}
            onEdit={(lessonId) => setEditingLessonId(lessonId)}
            onObligationClick={(lessonId, obligation) => {
              router.push(`/teacher/calendar/${lessonId}?tab=${obligation}`);
            }}
            hideTeacherColumn={true}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
          <AddCourseForm
            open={isAddCourseOpen}
            onOpenChange={setIsAddCourseOpen}
          />
          {editingLessonId && (
            <EditLessonForm
              open={!!editingLessonId}
              onOpenChange={(open) => {
                if (!open) {
                  setEditingLessonId(null);
                }
              }}
              lessonId={editingLessonId}
            />
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">{tCommon('loading')}</div>
          ) : viewMode === 'week' ? (
          /* Week View */
          <div className="grid grid-cols-7 divide-x divide-slate-200">
            {weekDates.map((date, index) => {
              const dateKey = date.toISOString().split('T')[0];
              const dayLessons = lessonsByDate[dateKey] || [];
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <div key={index} className="min-h-[400px]">
                  <div className={cn(
                    'p-3 border-b border-slate-200 text-center',
                    isToday && 'bg-blue-50'
                  )}>
                    <p className="text-xs text-slate-500">{DAYS[index]}</p>
                    <p className={cn(
                      'text-lg font-semibold',
                      isToday ? 'text-blue-600' : 'text-slate-800'
                    )}>
                      {date.getDate()}
                    </p>
                  </div>
                  <div className={cn('p-2', isToday && 'bg-blue-50/50')}>
                    {dayLessons
                      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                      .map((lesson) => (
                        <LessonBlock key={lesson.id} lesson={lesson} />
                      ))}
                    {dayLessons.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-4">{t('noLessons') || 'No lessons'}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Month View */
          <div>
            <div className="grid grid-cols-7 border-b border-slate-200">
              {DAYS.map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-slate-600 bg-slate-50">
                  {day}
                </div>
              ))}
            </div>
            <div className="divide-y divide-slate-200">
              {monthDates.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 divide-x divide-slate-200">
                  {week.map((date, dayIndex) => {
                    if (!date) {
                      return <div key={dayIndex} className="min-h-[100px] bg-slate-50" />;
                    }
                    
                    const dateKey = date.toISOString().split('T')[0];
                    const dayLessons = lessonsByDate[dateKey] || [];
                    const isToday = date.toDateString() === new Date().toDateString();

                    return (
                      <div key={dayIndex} className={cn(
                        'min-h-[100px] p-1',
                        isToday && 'bg-blue-50'
                      )}>
                        <p className={cn(
                          'text-sm font-medium mb-1',
                          isToday ? 'text-blue-600' : 'text-slate-800'
                        )}>
                          {date.getDate()}
                        </p>
                        {dayLessons.slice(0, 2).map((lesson) => (
                          <div key={lesson.id} className={cn(
                            'text-xs p-1 rounded mb-0.5 truncate',
                            lesson.status === 'COMPLETED' ? 'bg-green-100' :
                            lesson.status === 'CANCELLED' ? 'bg-red-100' :
                            'bg-blue-100'
                          )}>
                            {new Date(lesson.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                            {' '}
                            {lesson.group?.name}
                          </div>
                        ))}
                        {dayLessons.length > 2 && (
                          <p className="text-xs text-slate-500">+{dayLessons.length - 2} more</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
