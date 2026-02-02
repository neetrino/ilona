'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useMyLessons, type Lesson } from '@/features/lessons';
import { cn } from '@/shared/lib/utils';

type ViewMode = 'week' | 'month';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM

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
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calculate date range
  const weekDates = getWeekDates(new Date(currentDate));
  const monthDates = getMonthDates(new Date(currentDate));
  
  const dateFrom = viewMode === 'week' ? weekDates[0] : new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const dateTo = viewMode === 'week' ? weekDates[6] : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  // Fetch lessons
  const { data: lessonsData, isLoading } = useMyLessons(
    dateFrom.toISOString(),
    dateTo.toISOString()
  );

  const lessons = lessonsData?.items || [];

  // Group lessons by date
  const lessonsByDate = lessons.reduce((acc, lesson) => {
    const date = new Date(lesson.scheduledAt).toISOString().split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(lesson);
    return acc;
  }, {} as Record<string, Lesson[]>);

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
      title="My Calendar"
      subtitle="View your teaching schedule."
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
            Today
          </button>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('week')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors',
              viewMode === 'week' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600'
            )}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors',
              viewMode === 'month' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600'
            )}
          >
            Month
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1">
          <StatusDot status="SCHEDULED" />
          <span className="text-slate-600">Scheduled</span>
        </div>
        <div className="flex items-center gap-1">
          <StatusDot status="IN_PROGRESS" />
          <span className="text-slate-600">In Progress</span>
        </div>
        <div className="flex items-center gap-1">
          <StatusDot status="COMPLETED" />
          <span className="text-slate-600">Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <StatusDot status="CANCELLED" />
          <span className="text-slate-600">Cancelled</span>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
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
                      <p className="text-xs text-slate-400 text-center py-4">No lessons</p>
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
    </DashboardLayout>
  );
}
