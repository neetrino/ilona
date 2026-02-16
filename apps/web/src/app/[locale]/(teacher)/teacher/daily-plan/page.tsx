'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import {
  useTodayLessons,
  useMyLessons,
  useStartLesson,
  useCompleteLesson,
  useMarkVocabularySent,
  type Lesson,
} from '@/features/lessons';
import { cn } from '@/shared/lib/utils';
import { getWeekStart, getWeekEnd, formatDateString, formatWeekRange } from '@/features/attendance/utils/dateUtils';

type ViewMode = 'today' | 'week';
type LessonStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'MISSED';

// Status badge component
function StatusBadge({ status }: { status: LessonStatus }) {
  const styles: Record<LessonStatus, { bg: string; text: string; label: string }> = {
    SCHEDULED: { bg: 'bg-primary/20', text: 'text-primary', label: 'Scheduled' },
    IN_PROGRESS: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'In Progress' },
    COMPLETED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
    CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
    MISSED: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Missed' },
  };

  const style = styles[status] || styles.SCHEDULED;

  return (
    <span className={cn('px-2 py-1 text-xs font-medium rounded-full', style.bg, style.text)}>
      {style.label}
    </span>
  );
}

// Lesson card component
function LessonCard({
  lesson,
  onStart,
  onComplete,
  onVocabulary,
  isStarting,
  isCompleting,
  isSendingVocabulary,
}: {
  lesson: Lesson;
  onStart: () => void;
  onComplete: () => void;
  onVocabulary: () => void;
  isStarting: boolean;
  isCompleting: boolean;
  isSendingVocabulary: boolean;
}) {
  const time = new Date(lesson.scheduledAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const canStart = lesson.status === 'SCHEDULED';
  const canComplete = lesson.status === 'IN_PROGRESS';
  const canSendVocabulary = lesson.status === 'COMPLETED' && !lesson.vocabularySent;
  const isActive = lesson.status === 'IN_PROGRESS';

  return (
    <div
      className={cn(
        'p-4 bg-white rounded-xl border transition-all',
        isActive ? 'border-yellow-300 ring-2 ring-yellow-100' : 'border-slate-200 hover:border-slate-300'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
            {time.split(':')[0]}
          </div>
          <div>
            <p className="font-semibold text-slate-800">{time}</p>
            <p className="text-sm text-slate-500">{lesson.duration} min</p>
          </div>
        </div>
        <StatusBadge status={lesson.status} />
      </div>

      <div className="mb-3">
        <h3 className="font-semibold text-slate-800 mb-1">{lesson.group?.name || 'Unknown Group'}</h3>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">
            {lesson.group?.level || 'N/A'}
          </span>
          <span>{lesson.group?._count?.students || 0} students</span>
        </div>
        {lesson.topic && (
          <p className="text-sm text-slate-600 mt-2">
            <span className="font-medium">Topic:</span> {lesson.topic}
          </p>
        )}
      </div>

      {/* Checklist for completed lessons */}
      {lesson.status === 'COMPLETED' && (
        <div className="mb-3 p-3 bg-slate-50 rounded-lg">
          <p className="text-xs font-medium text-slate-600 mb-2">Lesson Checklist</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              {lesson._count?.attendances ? (
                <span className="text-green-600">✓</span>
              ) : (
                <span className="text-red-500">✗</span>
              )}
              <span className={lesson._count?.attendances ? 'text-slate-700' : 'text-red-600'}>
                Attendance marked
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {lesson.vocabularySent ? (
                <span className="text-green-600">✓</span>
              ) : (
                <span className="text-red-500">✗</span>
              )}
              <span className={lesson.vocabularySent ? 'text-slate-700' : 'text-red-600'}>
                Vocabulary sent
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {canStart && (
          <button
            onClick={onStart}
            disabled={isStarting}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {isStarting ? 'Starting...' : 'Start Lesson'}
          </button>
        )}

        {canComplete && (
          <button
            onClick={onComplete}
            disabled={isCompleting}
            className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {isCompleting ? 'Completing...' : 'Complete Lesson'}
          </button>
        )}

        {canSendVocabulary && (
          <button
            onClick={onVocabulary}
            disabled={isSendingVocabulary}
            className="flex-1 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {isSendingVocabulary ? 'Sending...' : 'Send Vocabulary'}
          </button>
        )}

        {lesson.status === 'COMPLETED' && lesson.vocabularySent && (
          <div className="flex-1 px-4 py-2 bg-green-100 text-green-700 text-sm font-medium rounded-lg text-center">
            ✓ All Done
          </div>
        )}
      </div>
    </div>
  );
}

export default function TeacherDailyPlanPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Initialize view mode from URL query params, with fallback to 'today'
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const viewFromUrl = searchParams.get('view');
    if (viewFromUrl === 'week' || viewFromUrl === 'today') {
      return viewFromUrl;
    }
    return 'today'; // Default to today view
  });

  // Sync view mode from URL (for browser back/forward navigation)
  useEffect(() => {
    const viewFromUrl = searchParams.get('view');
    if (viewFromUrl === 'week' || viewFromUrl === 'today') {
      setViewMode(viewFromUrl);
    } else if (!viewFromUrl) {
      setViewMode('today');
    }
  }, [searchParams]);

  // Get current date for display and calculations
  // We use a fresh date on each render for display, but memoize week calculations
  const currentDate = useMemo(() => new Date(), []);
  
  // Memoize week date range calculations (stable for the session)
  const weekDateRange = useMemo(() => {
    const weekStart = getWeekStart(currentDate);
    const weekEnd = getWeekEnd(currentDate);
    return {
      start: weekStart,
      end: weekEnd,
      startStr: formatDateString(weekStart),
      endStr: formatDateString(weekEnd),
    };
  }, [currentDate]);
  
  // For display, use a fresh date to show current date
  const displayDate = new Date();

  // Update URL when view mode changes
  const updateViewModeInUrl = (mode: ViewMode) => {
    // Update state immediately for responsive UI
    setViewMode(mode);
    
    // Update URL to persist the selection
    const params = new URLSearchParams(searchParams.toString());
    if (mode === 'today') {
      // Remove 'view' param for default today view to keep URL clean
      params.delete('view');
    } else {
      params.set('view', mode);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  // Fetch data
  const { data: todayLessons = [], isLoading: isLoadingToday, error: errorToday, refetch: refetchToday } = useTodayLessons(viewMode === 'today');
  const { data: weekLessons, isLoading: isLoadingWeek, error: errorWeek, refetch: refetchWeek } = useMyLessons(
    weekDateRange.startStr,
    weekDateRange.endStr,
    viewMode === 'week'
  );

  // Mutations
  const startLesson = useStartLesson();
  const completeLesson = useCompleteLesson();
  const markVocabulary = useMarkVocabularySent();

  const isLoading = viewMode === 'today' ? isLoadingToday : isLoadingWeek;
  const error = viewMode === 'today' ? errorToday : errorWeek;
  const lessons = viewMode === 'today' 
    ? (Array.isArray(todayLessons) ? todayLessons : [])
    : (Array.isArray(weekLessons?.items) ? weekLessons.items : []);

  // Sort lessons by time
  const sortedLessons = [...lessons].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );

  // Group by date for week view
  const lessonsByDate = sortedLessons.reduce((acc, lesson) => {
    const date = new Date(lesson.scheduledAt).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(lesson);
    return acc;
  }, {} as Record<string, Lesson[]>);

  // Statistics
  const stats = {
    total: lessons.length,
    completed: lessons.filter((l) => l.status === 'COMPLETED').length,
    inProgress: lessons.filter((l) => l.status === 'IN_PROGRESS').length,
    scheduled: lessons.filter((l) => l.status === 'SCHEDULED').length,
    vocabularyPending: lessons.filter((l) => l.status === 'COMPLETED' && !l.vocabularySent).length,
  };

  return (
    <DashboardLayout
      title="Daily Plan"
      subtitle="Manage your lessons, mark attendance, and send vocabulary."
    >
      {/* View Toggle & Stats */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          {/* View Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => updateViewModeInUrl('today')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                viewMode === 'today'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Today
            </button>
            <button
              onClick={() => updateViewModeInUrl('week')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                viewMode === 'week'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              This Week
            </button>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-slate-600">{stats.scheduled} scheduled</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-slate-600">{stats.inProgress} in progress</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-slate-600">{stats.completed} completed</span>
            </div>
            {stats.vocabularyPending > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-red-100 rounded-full">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-red-700 font-medium">{stats.vocabularyPending} need vocabulary</span>
              </div>
            )}
          </div>
        </div>

        {/* Date Display */}
        <p className="text-slate-600">
          {viewMode === 'today'
            ? displayDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            : formatWeekRange(currentDate)}
        </p>
      </div>

      {/* Lessons */}
      {error ? (
        <div className="text-center py-12 bg-white rounded-xl border border-red-200">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Failed to load lessons</h3>
          <p className="text-sm text-slate-500 mb-4">
            {error instanceof Error ? error.message : 'An error occurred while loading your lessons.'}
          </p>
          <button
            onClick={() => {
              if (viewMode === 'today') {
                refetchToday();
              } else {
                refetchWeek();
              }
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      ) : isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-white rounded-xl border border-slate-200 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-slate-200 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-20 mb-2" />
                  <div className="h-3 bg-slate-200 rounded w-16" />
                </div>
              </div>
              <div className="h-4 bg-slate-200 rounded w-40 mb-2" />
              <div className="h-3 bg-slate-200 rounded w-24" />
            </div>
          ))}
        </div>
      ) : sortedLessons.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">No lessons {viewMode === 'today' ? 'today' : 'this week'}</h3>
          <p className="text-sm text-slate-500">Enjoy your free time!</p>
        </div>
      ) : viewMode === 'today' ? (
        <div className="space-y-4">
          {sortedLessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              onStart={() => startLesson.mutate(lesson.id)}
              onComplete={() => completeLesson.mutate({ id: lesson.id })}
              onVocabulary={() => markVocabulary.mutate(lesson.id)}
              isStarting={startLesson.isPending && startLesson.variables === lesson.id}
              isCompleting={completeLesson.isPending && completeLesson.variables?.id === lesson.id}
              isSendingVocabulary={markVocabulary.isPending && markVocabulary.variables === lesson.id}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(lessonsByDate).map(([date, dateLessons]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-slate-600 mb-3">{date}</h3>
              <div className="space-y-4">
                {dateLessons.map((lesson) => (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    onStart={() => startLesson.mutate(lesson.id)}
                    onComplete={() => completeLesson.mutate({ id: lesson.id })}
                    onVocabulary={() => markVocabulary.mutate(lesson.id)}
                    isStarting={startLesson.isPending && startLesson.variables === lesson.id}
                    isCompleting={completeLesson.isPending && completeLesson.variables?.id === lesson.id}
                    isSendingVocabulary={markVocabulary.isPending && markVocabulary.variables === lesson.id}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
