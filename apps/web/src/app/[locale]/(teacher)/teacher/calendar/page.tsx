'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { LessonListTable } from '@/shared/components/calendar/LessonListTable';
import { useLessons, useDeleteLessonsBulk, useCompleteLesson, type Lesson } from '@/features/lessons';
import { AddCourseForm } from '@/features/lessons/components/AddCourseForm';
import { EditLessonForm } from '@/features/lessons/components/EditLessonForm';
import { BulkDeleteConfirmationDialog } from '@/features/lessons/components/BulkDeleteConfirmationDialog';
import { CompleteLessonDialog } from '@/features/lessons/components/CompleteLessonDialog';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { useTranslations } from 'next-intl';
import { getErrorMessage } from '@/shared/lib/api';

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

function LessonBlock({ 
  lesson, 
  onComplete 
}: { 
  lesson: Lesson;
  onComplete?: (lessonId: string) => void;
}) {
  const time = new Date(lesson.scheduledAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const isCompleted = lesson.status === 'COMPLETED';

  return (
    <div className={cn(
      'p-2 rounded-lg text-xs mb-1 transition-colors group',
      isCompleted ? 'bg-green-100 hover:bg-green-200' :
      lesson.status === 'IN_PROGRESS' ? 'bg-yellow-100 hover:bg-yellow-200' :
      lesson.status === 'CANCELLED' ? 'bg-red-100 hover:bg-red-200' :
      'bg-blue-100 hover:bg-blue-200'
    )}>
      <div className="flex items-center justify-between gap-1 mb-1">
        <div className="flex items-center gap-1">
          <StatusDot status={lesson.status} />
          <span className="font-medium">{time}</span>
        </div>
        {onComplete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onComplete(lesson.id);
            }}
            disabled={isCompleted}
            className={cn(
              'opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded',
              isCompleted
                ? 'text-green-600 cursor-default opacity-100'
                : 'text-green-600 hover:text-green-700 hover:bg-green-200'
            )}
            title={isCompleted ? 'Lesson completed' : 'Mark as completed'}
            aria-label={isCompleted ? 'Lesson completed' : 'Mark lesson as completed'}
          >
            {isCompleted ? (
              <svg className="w-3.5 h-3.5 fill-current" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
        )}
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
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);
  const [bulkDeleteSuccess, setBulkDeleteSuccess] = useState(false);
  const [deletedCount, setDeletedCount] = useState<number>(0);
  const [completingLessonId, setCompletingLessonId] = useState<string | null>(null);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [completeSuccess, setCompleteSuccess] = useState(false);
  
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
  // Refetch every minute to update lock status and completion status
  const { data: lessonsData, isLoading, refetch } = useLessons({
    dateFrom: formatDate(dateFrom),
    dateTo: formatDate(dateTo),
    take: 100,
    sortBy: sortBy === 'scheduledAt' ? 'scheduledAt' : undefined,
    sortOrder: sortBy === 'scheduledAt' ? sortOrder : undefined,
  });

  // Bulk delete mutation
  const deleteLessonsBulk = useDeleteLessonsBulk();
  
  // Complete lesson mutation
  const completeLesson = useCompleteLesson();

  // Set up automatic refetch every minute for time-based updates (midnight lock, status changes)
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [refetch]);

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

  // Handle bulk delete click
  const handleBulkDeleteClick = (lessonIds: string[]) => {
    setSelectedLessonIds(lessonIds);
    setBulkDeleteError(null);
    setBulkDeleteSuccess(false);
    setIsBulkDeleteDialogOpen(true);
  };

  // Handle bulk delete confirmation
  const handleBulkDeleteConfirm = async () => {
    if (selectedLessonIds.length === 0) return;

    setBulkDeleteError(null);
    setBulkDeleteSuccess(false);

    const count = selectedLessonIds.length;
    try {
      await deleteLessonsBulk.mutateAsync(selectedLessonIds);
      setDeletedCount(count);
      setBulkDeleteSuccess(true);
      setIsBulkDeleteDialogOpen(false);
      setSelectedLessonIds([]);
      
      // Clear success message after a delay
      setTimeout(() => {
        setBulkDeleteSuccess(false);
        setDeletedCount(0);
      }, 3000);
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Failed to delete lessons. Please try again.');
      setBulkDeleteError(message);
    }
  };

  // Handle complete lesson click
  const handleCompleteClick = (lessonId: string) => {
    setCompletingLessonId(lessonId);
    setCompleteError(null);
    setCompleteSuccess(false);
    setIsCompleteDialogOpen(true);
  };

  // Handle complete lesson confirmation
  const handleCompleteConfirm = async () => {
    if (!completingLessonId) return;

    setCompleteError(null);
    setCompleteSuccess(false);

    try {
      await completeLesson.mutateAsync({ id: completingLessonId, data: undefined });
      // Force immediate refetch to update UI with lock states
      await refetch();
      setCompleteSuccess(true);
      setIsCompleteDialogOpen(false);
      setCompletingLessonId(null);
      
      // Clear success message after a delay
      setTimeout(() => {
        setCompleteSuccess(false);
      }, 3000);
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Failed to complete lesson. Please try again.');
      setCompleteError(message);
    }
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
            onComplete={handleCompleteClick}
            onObligationClick={(lessonId, obligation) => {
              router.push(`/teacher/calendar/${lessonId}?tab=${obligation}`);
            }}
            onBulkDelete={handleBulkDeleteClick}
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
          <BulkDeleteConfirmationDialog
            open={isBulkDeleteDialogOpen}
            onOpenChange={(open) => {
              setIsBulkDeleteDialogOpen(open);
              if (!open) {
                setBulkDeleteError(null);
                setBulkDeleteSuccess(false);
                setSelectedLessonIds([]);
              }
            }}
            onConfirm={handleBulkDeleteConfirm}
            lessonCount={selectedLessonIds.length}
            isLoading={deleteLessonsBulk.isPending}
            error={bulkDeleteError}
          />
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
                        <LessonBlock key={lesson.id} lesson={lesson} onComplete={handleCompleteClick} />
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
                          <LessonBlock key={lesson.id} lesson={lesson} onComplete={handleCompleteClick} />
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

      {/* Success/Error Messages */}
      {bulkDeleteSuccess && (
        <div className="fixed bottom-4 right-4 p-4 bg-green-50 border border-green-200 rounded-lg shadow-lg z-50">
          <p className="text-sm text-green-600 font-medium">
            {deletedCount > 0 
              ? `Deleted ${deletedCount} ${deletedCount === 1 ? 'lesson' : 'lessons'} successfully!`
              : 'Lessons deleted successfully!'}
          </p>
        </div>
      )}
      {bulkDeleteError && !isBulkDeleteDialogOpen && (
        <div className="fixed bottom-4 right-4 p-4 bg-red-50 border border-red-200 rounded-lg shadow-lg z-50">
          <p className="text-sm text-red-600 font-medium">{bulkDeleteError}</p>
        </div>
      )}

      {/* Complete Lesson Dialog */}
      <CompleteLessonDialog
        open={isCompleteDialogOpen}
        onOpenChange={(open) => {
          setIsCompleteDialogOpen(open);
          if (!open) {
            setCompletingLessonId(null);
            setCompleteError(null);
            setCompleteSuccess(false);
          }
        }}
        onConfirm={handleCompleteConfirm}
        lessonName={
          completingLessonId
            ? lessons.find((l) => l.id === completingLessonId)?.group?.name || undefined
            : undefined
        }
        isLoading={completeLesson.isPending}
        error={completeError}
      />

      {/* Complete Success Message */}
      {completeSuccess && (
        <div className="fixed bottom-4 right-4 p-4 bg-green-50 border border-green-200 rounded-lg shadow-lg z-50">
          <p className="text-sm text-green-600 font-medium">Lesson marked as completed successfully!</p>
        </div>
      )}
    </DashboardLayout>
  );
}
