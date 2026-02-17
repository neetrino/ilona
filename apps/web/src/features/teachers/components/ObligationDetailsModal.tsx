'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui';
import { fetchTeacherObligation, type TeacherObligationDetails } from '../api/teachers.api';
import { cn } from '@/shared/lib/utils';

interface ObligationDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId: string | null;
  teacherName?: string;
}

export function ObligationDetailsModal({
  open,
  onOpenChange,
  teacherId,
  teacherName,
}: ObligationDetailsModalProps) {
  const {
    data: obligationData,
    isLoading,
    error,
  } = useQuery<TeacherObligationDetails>({
    queryKey: ['teacher-obligation', teacherId],
    queryFn: () => fetchTeacherObligation(teacherId!),
    enabled: !!teacherId && open,
  });

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Obligation Details</DialogTitle>
          <DialogDescription>
            {teacherName ? `Required actions for ${teacherName}` : 'Required actions completion status'}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500">Loading obligation details...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 font-medium">Failed to load obligation details</p>
            <p className="text-xs text-red-500 mt-1">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
          </div>
        )}

        {!isLoading && !error && obligationData && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Completion Status</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">
                    {obligationData.completed}/{obligationData.total}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">
                    {obligationData.items.filter(item => item.done).length} of {obligationData.total} actions completed
                  </p>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Required Actions
              </h3>
              <div className="space-y-2">
                {obligationData.items.map((item) => (
                  <div
                    key={item.key}
                    className={cn(
                      'flex items-start gap-3 p-4 rounded-lg border transition-colors',
                      item.done
                        ? 'bg-green-50 border-green-200'
                        : 'bg-amber-50 border-amber-200'
                    )}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {item.done ? (
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-amber-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={cn(
                            'font-medium',
                            item.done ? 'text-green-800' : 'text-amber-800'
                          )}
                        >
                          {item.label}
                        </p>
                        <span
                          className={cn(
                            'text-xs font-medium px-2 py-1 rounded',
                            item.done
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          )}
                        >
                          {item.completedCount}/{item.totalCount}
                        </span>
                      </div>
                      {item.doneAt && (
                        <p className="text-xs text-slate-500 mt-1">
                          Last completed: {formatDate(item.doneAt)}
                        </p>
                      )}
                      {!item.done && item.totalCount > 0 && (
                        <p className="text-xs text-amber-600 mt-1">
                          Missing in {item.totalCount - item.completedCount} lesson{item.totalCount - item.completedCount !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Info note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                <strong>Note:</strong> Actions are considered completed if done in at least 80% of lessons.
                The completion count shows how many lessons have this action completed.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

