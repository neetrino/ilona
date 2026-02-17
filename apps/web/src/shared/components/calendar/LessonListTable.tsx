'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { ArrowUpDown, ArrowUp, ArrowDown, Pencil } from 'lucide-react';
import type { Lesson } from '@/features/lessons';
import { cn } from '@/shared/lib/utils';

interface LessonListTableProps {
  lessons: Lesson[];
  isLoading?: boolean;
  onBulkDelete?: (lessonIds: string[]) => void;
  onEdit?: (lessonId: string) => void;
  onDelete?: (lessonId: string) => void;
  onObligationClick?: (lessonId: string, obligation: 'absence' | 'feedback' | 'voice' | 'text') => void;
  hideTeacherColumn?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
}

const _statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
  SCHEDULED: { label: 'Scheduled', variant: 'info' },
  IN_PROGRESS: { label: 'In Progress', variant: 'warning' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'default' },
  MISSED: { label: 'Missed', variant: 'error' },
};

function formatTime(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString(locale === 'hy' ? 'hy-AM' : 'en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });
}

function formatDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale === 'hy' ? 'hy-AM' : 'en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric'
    // Year removed as per requirements
  });
}

/**
 * Determines if a lesson is past, today, or future based on its scheduled date.
 * Compares calendar dates (year, month, day) in the local timezone.
 * @param scheduledAt - ISO date string of the lesson
 * @returns 'past' | 'today' | 'future'
 */
function getLessonDateStatus(scheduledAt: string): 'past' | 'today' | 'future' {
  const lessonDate = new Date(scheduledAt);
  const today = new Date();
  
  // Compare calendar dates (year, month, day) by resetting time to midnight
  const lessonDateOnly = new Date(lessonDate.getFullYear(), lessonDate.getMonth(), lessonDate.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  if (lessonDateOnly < todayOnly) {
    return 'past';
  } else if (lessonDateOnly.getTime() === todayOnly.getTime()) {
    return 'today';
  } else {
    return 'future';
  }
}

function StatusIndicator({
  completed,
  onClick,
  label,
  count,
}: {
  completed: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center min-w-[32px] h-6 px-1.5 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
        completed
          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
      )}
      title={label}
      aria-label={`${label}: ${completed ? 'Completed' : 'Not completed'}${count !== undefined ? ` (${count})` : ''}`}
    >
      {completed ? (
        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      {count !== undefined && count > 0 && (
        <span className={cn(
          'ml-1 text-xs font-medium',
          completed ? 'text-emerald-700' : 'text-slate-500'
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

export function LessonListTable({
  lessons,
  isLoading = false,
  onBulkDelete,
  onEdit,
  onDelete,
  onObligationClick,
  hideTeacherColumn = false,
  sortBy,
  sortOrder,
  onSort,
}: LessonListTableProps) {
  const router = useRouter();
  const locale = useLocale();
  const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set());

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLessons(new Set(lessons.map((l) => l.id)));
    } else {
      setSelectedLessons(new Set());
    }
  };

  const handleSelectLesson = (lessonId: string, checked: boolean) => {
    const newSelected = new Set(selectedLessons);
    if (checked) {
      newSelected.add(lessonId);
    } else {
      newSelected.delete(lessonId);
    }
    setSelectedLessons(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedLessons.size > 0 && onBulkDelete) {
      onBulkDelete(Array.from(selectedLessons));
      setSelectedLessons(new Set());
    }
  };

  const handleView = (lessonId: string) => {
    // Get current path and navigate to detail page
    // Check if we're in admin or teacher route
    const currentPath = window.location.pathname;
    if (currentPath.includes('/admin/')) {
      router.push(`/admin/calendar/${lessonId}`);
    } else if (currentPath.includes('/teacher/')) {
      router.push(`/teacher/calendar/${lessonId}`);
    } else {
      router.push(`/calendar/${lessonId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <p className="text-slate-500">No lessons found</p>
      </div>
    );
  }

  const allSelected = lessons.length > 0 && selectedLessons.size === lessons.length;
  const someSelected = selectedLessons.size > 0 && selectedLessons.size < lessons.length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Bulk Actions */}
      {selectedLessons.size > 0 && (
        <div className="px-6 py-3 bg-blue-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">
            {selectedLessons.size} lesson{selectedLessons.size !== 1 ? 's' : ''} selected
          </span>
          {onBulkDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
            >
              Delete Selected
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={handleSelectAll}
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Lesson Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                {onSort ? (
                  <button
                    type="button"
                    onClick={() => onSort('scheduledAt')}
                    className={cn(
                      'flex items-center gap-1.5 w-full text-left text-xs font-semibold uppercase hover:bg-slate-50 rounded-md px-0 py-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1',
                      sortBy === 'scheduledAt' && 'text-slate-700'
                    )}
                    aria-label={
                      sortBy !== 'scheduledAt'
                        ? 'Sort by Date & Time'
                        : sortOrder === 'asc'
                        ? 'Sorted by Date & Time ascending. Click to sort descending.'
                        : 'Sorted by Date & Time descending. Click to sort ascending.'
                    }
                  >
                    <span>Date & Time</span>
                    <span className="flex-shrink-0">
                      {sortBy === 'scheduledAt' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                      )}
                    </span>
                  </button>
                ) : (
                  'Date & Time'
                )}
              </th>
              {!hideTeacherColumn && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Teacher</th>
              )}
              <th className="px-2 py-3 text-center text-xs font-semibold text-slate-600 uppercase w-[100px]">Absence</th>
              <th className="px-2 py-3 text-center text-xs font-semibold text-slate-600 uppercase w-[100px]">Feedbacks</th>
              <th className="px-2 py-3 text-center text-xs font-semibold text-slate-600 uppercase w-[100px]">Voice</th>
              <th className="px-2 py-3 text-center text-xs font-semibold text-slate-600 uppercase w-[100px]">Text</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lessons.map((lesson) => {
              const teacherName = lesson.teacher?.user
                ? `${lesson.teacher.user.firstName} ${lesson.teacher.user.lastName}`
                : 'Unknown';
              
              const dateStatus = getLessonDateStatus(lesson.scheduledAt);
              const rowClassName = cn(
                'transition-colors',
                dateStatus === 'today' && 'bg-green-50 hover:bg-green-100',
                dateStatus === 'past' && 'bg-slate-50 hover:bg-slate-100',
                dateStatus === 'future' && 'hover:bg-slate-50'
              );

              return (
                <tr key={lesson.id} className={rowClassName}>
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={selectedLessons.has(lesson.id)}
                      onCheckedChange={(checked) => handleSelectLesson(lesson.id, checked === true)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold text-slate-800">{lesson.group?.name || 'Unknown Group'}</p>
                      {lesson.topic && (
                        <p className="text-sm text-slate-500">{lesson.topic}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{formatDate(lesson.scheduledAt, locale)}</p>
                      <p className="text-sm text-slate-600">{formatTime(lesson.scheduledAt, locale)}</p>
                    </div>
                  </td>
                  {!hideTeacherColumn && (
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-700">{teacherName}</p>
                    </td>
                  )}
                  <td className="px-2 py-3 text-center align-middle">
                    <div className="flex items-center justify-center">
                      <StatusIndicator
                        completed={lesson.absenceMarked || false}
                        onClick={() => onObligationClick?.(lesson.id, 'absence')}
                        label="Absence"
                      />
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center align-middle">
                    <div className="flex items-center justify-center">
                      <StatusIndicator
                        completed={lesson.feedbacksCompleted || false}
                        onClick={() => onObligationClick?.(lesson.id, 'feedback')}
                        label="Feedbacks"
                        count={lesson._count?.feedbacks}
                      />
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center align-middle">
                    <div className="flex items-center justify-center">
                      <StatusIndicator
                        completed={lesson.voiceSent || false}
                        onClick={() => onObligationClick?.(lesson.id, 'voice')}
                        label="Voice"
                      />
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center align-middle">
                    <div className="flex items-center justify-center">
                      <StatusIndicator
                        completed={lesson.textSent || false}
                        onClick={() => onObligationClick?.(lesson.id, 'text')}
                        label="Text"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(lesson.id)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Button>
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(lesson.id)}
                          className="text-slate-600 hover:text-slate-700"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(lesson.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

