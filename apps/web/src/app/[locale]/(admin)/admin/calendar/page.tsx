'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { StatCard, Badge, Button } from '@/shared/components/ui';
import { useLessons, useLessonStatistics, useCancelLesson, type Lesson, type LessonStatus } from '@/features/lessons';

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
const statusConfig: Record<LessonStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
  SCHEDULED: { label: 'Scheduled', variant: 'info' },
  IN_PROGRESS: { label: 'In Progress', variant: 'warning' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'default' },
  MISSED: { label: 'Missed', variant: 'error' },
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'list'>('week');
  
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);
  const dateFrom = formatDate(weekDates[0]);
  const dateTo = formatDate(weekDates[6]);

  // Fetch lessons for the week
  const { 
    data: lessonsData, 
    isLoading 
  } = useLessons({ 
    dateFrom,
    dateTo: formatDate(new Date(weekDates[6].getTime() + 24 * 60 * 60 * 1000)),
    take: 100,
  });

  // Fetch statistics
  const { data: stats } = useLessonStatistics();

  // Cancel mutation
  const cancelLesson = useCancelLesson();

  const lessons = lessonsData?.items || [];

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

  // Week header
  const weekHeader = `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <DashboardLayout 
      title="Lesson Calendar" 
      subtitle="Schedule and manage lessons across all groups."
    >
      <div className="space-y-6">
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
            <h2 className="text-lg font-semibold text-slate-800">{weekHeader}</h2>
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                viewMode === 'week' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                viewMode === 'list' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              List
            </button>
            <Button className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
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
                      <p className="text-xs text-slate-400 text-center py-4">No lessons</p>
                    ) : (
                      <div className="space-y-2">
                        {dayLessons.map(lesson => (
                          <div 
                            key={lesson.id}
                            className={`p-2 rounded-lg text-xs border-l-4 ${
                              lesson.status === 'COMPLETED' 
                                ? 'bg-green-50 border-green-500'
                                : lesson.status === 'IN_PROGRESS'
                                ? 'bg-amber-50 border-amber-500'
                                : lesson.status === 'CANCELLED' || lesson.status === 'MISSED'
                                ? 'bg-slate-100 border-slate-400'
                                : 'bg-blue-50 border-blue-500'
                            }`}
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
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="divide-y divide-slate-200">
              {isLoading ? (
                <div className="p-6 animate-pulse space-y-4">
                  <div className="h-12 bg-slate-200 rounded-lg" />
                  <div className="h-12 bg-slate-200 rounded-lg" />
                  <div className="h-12 bg-slate-200 rounded-lg" />
                </div>
              ) : lessons.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-slate-500">No lessons scheduled for this week</p>
                </div>
              ) : (
                lessons.map(lesson => {
                  const teacherName = lesson.teacher?.user 
                    ? `${lesson.teacher.user.firstName} ${lesson.teacher.user.lastName}`
                    : 'Unknown';
                  
                  return (
                    <div key={lesson.id} className="p-4 flex items-center gap-4 hover:bg-slate-50">
                      <div className="w-24 text-center">
                        <p className="text-sm font-medium text-slate-800">
                          {new Date(lesson.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-lg font-bold text-blue-600">
                          {formatTime(lesson.scheduledAt)}
                        </p>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-800">
                            {lesson.group?.name || 'Unknown Group'}
                          </h3>
                          <Badge variant={statusConfig[lesson.status].variant}>
                            {statusConfig[lesson.status].label}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">{lesson.topic || 'No topic specified'}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Teacher: {teacherName} • Duration: {lesson.duration} min • 
                          {lesson.group?.level && ` Level: ${lesson.group.level}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-blue-600 font-medium">
                          View
                        </Button>
                        {lesson.status === 'SCHEDULED' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 font-medium"
                            onClick={() => handleCancel(lesson.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-50 rounded-xl">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 mb-2">Recurring Schedule</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Set up recurring lessons for groups with automatic scheduling.
                </p>
                <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                  Create Recurring
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-50 rounded-xl">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 mb-2">Attendance Tracking</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Mark attendance for completed lessons and track student participation.
                </p>
                <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                  Open Attendance
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
