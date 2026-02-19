'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/components/ui';
import { useQuery } from '@tanstack/react-query';
import { fetchLessonObligation, type LessonObligation } from '../api/finance.api';
import { Check, X } from 'lucide-react';

interface ObligationDetailsModalProps {
  lessonId: string | null;
  open: boolean;
  onClose: () => void;
}

export function ObligationDetailsModal({
  lessonId,
  open,
  onClose,
}: ObligationDetailsModalProps) {
  const {
    data: obligationData,
    isLoading,
    error,
  } = useQuery<LessonObligation>({
    queryKey: ['lesson-obligation', lessonId],
    queryFn: () => fetchLessonObligation(lessonId!),
    enabled: open && !!lessonId,
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Lesson Obligation Details</DialogTitle>
          <DialogDescription>
            View which actions are completed for this lesson
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 font-medium">
              Failed to load obligation details. Please try again.
            </p>
          </div>
        ) : obligationData ? (
          <div className="space-y-4">
            {/* Summary */}
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Completed Actions</span>
                <span className="text-lg font-semibold text-slate-800">
                  {obligationData.completedActionsCount}/{obligationData.totalActions}
                </span>
              </div>
            </div>

            {/* Action Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                <span className="text-sm font-medium text-slate-700">Absence</span>
                <div className="flex items-center gap-2">
                  {obligationData.absenceDone ? (
                    <>
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-sm text-green-600 font-medium">Done</span>
                    </>
                  ) : (
                    <>
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                        <X className="w-3 h-3 text-slate-400" />
                      </div>
                      <span className="text-sm text-slate-500">Not done</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                <span className="text-sm font-medium text-slate-700">Feedbacks</span>
                <div className="flex items-center gap-2">
                  {obligationData.feedbacksDone ? (
                    <>
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-sm text-green-600 font-medium">Done</span>
                    </>
                  ) : (
                    <>
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                        <X className="w-3 h-3 text-slate-400" />
                      </div>
                      <span className="text-sm text-slate-500">Not done</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                <span className="text-sm font-medium text-slate-700">Voice</span>
                <div className="flex items-center gap-2">
                  {obligationData.voiceDone ? (
                    <>
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-sm text-green-600 font-medium">Done</span>
                    </>
                  ) : (
                    <>
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                        <X className="w-3 h-3 text-slate-400" />
                      </div>
                      <span className="text-sm text-slate-500">Not done</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                <span className="text-sm font-medium text-slate-700">Text</span>
                <div className="flex items-center gap-2">
                  {obligationData.textDone ? (
                    <>
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-sm text-green-600 font-medium">Done</span>
                    </>
                  ) : (
                    <>
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                        <X className="w-3 h-3 text-slate-400" />
                      </div>
                      <span className="text-sm text-slate-500">Not done</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}



