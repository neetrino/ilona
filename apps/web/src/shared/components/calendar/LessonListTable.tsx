'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Checkbox } from '@/shared/components/ui/checkbox';
import type { Lesson } from '@/features/lessons';
import { cn } from '@/shared/lib/utils';

interface LessonListTableProps {
  lessons: Lesson[];
  isLoading?: boolean;
  onBulkDelete?: (lessonIds: string[]) => void;
  onEdit?: (lessonId: string) => void;
  onDelete?: (lessonId: string) => void;
  onObligationClick?: (lessonId: string, obligation: 'absence' | 'feedback' | 'voice' | 'text') => void;
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
  SCHEDULED: { label: 'Scheduled', variant: 'info' },
  IN_PROGRESS: { label: 'In Progress', variant: 'warning' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'default' },
  MISSED: { label: 'Missed', variant: 'error' },
};

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
}

function ObligationButton({
  completed,
  onClick,
  label,
}: {
  completed: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-8 h-8 rounded-md border-2 flex items-center justify-center transition-colors',
        completed
          ? 'bg-green-50 border-green-500 text-green-600'
          : 'bg-slate-50 border-slate-300 text-slate-400 hover:border-slate-400'
      )}
      title={label}
    >
      {completed ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
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
}: LessonListTableProps) {
  const router = useRouter();
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
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date & Time</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Teacher</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Absence</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Feedbacks</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Voice</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Text</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lessons.map((lesson) => {
              const teacherName = lesson.teacher?.user
                ? `${lesson.teacher.user.firstName} ${lesson.teacher.user.lastName}`
                : 'Unknown';

              return (
                <tr key={lesson.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={selectedLessons.has(lesson.id)}
                      onCheckedChange={(checked) => handleSelectLesson(lesson.id, checked as boolean)}
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
                      <p className="text-sm font-medium text-slate-800">{formatDate(lesson.scheduledAt)}</p>
                      <p className="text-sm text-slate-600">{formatTime(lesson.scheduledAt)}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-slate-700">{teacherName}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ObligationButton
                      completed={lesson.absenceMarked || false}
                      onClick={() => onObligationClick?.(lesson.id, 'absence')}
                      label="Absence"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ObligationButton
                      completed={lesson.feedbacksCompleted || false}
                      onClick={() => onObligationClick?.(lesson.id, 'feedback')}
                      label="Feedbacks"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ObligationButton
                      completed={lesson.voiceSent || false}
                      onClick={() => onObligationClick?.(lesson.id, 'voice')}
                      label="Voice"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ObligationButton
                      completed={lesson.textSent || false}
                      onClick={() => onObligationClick?.(lesson.id, 'text')}
                      label="Text"
                    />
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
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
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

