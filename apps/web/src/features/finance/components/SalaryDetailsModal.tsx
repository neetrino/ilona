'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui';
import { useSalary } from '../hooks/useFinance';
import type { SalaryRecord } from '../types';

interface SalaryDetailsModalProps {
  salaryId: string | null;
  open: boolean;
  onClose: () => void;
}

export function SalaryDetailsModal({ salaryId, open, onClose }: SalaryDetailsModalProps) {
  const t = useTranslations('finance');
  const { data: salary, isLoading } = useSalary(salaryId || '', !!salaryId && open);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  if (!open || !salaryId) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('hy-AM', {
      style: 'currency',
      currency: 'AMD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatMonth = (month: number | Date | string, year?: number) => {
    let date: Date;
    if (month instanceof Date) {
      date = month;
    } else if (typeof month === 'string') {
      date = new Date(month);
    } else if (year !== undefined) {
      date = new Date(year, month - 1);
    } else {
      // Fallback: try to parse as Date string
      date = new Date(month);
    }
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Parse obligations info
  const obligationsInfo = salary?.obligationsInfo || (salary?.notes ? (() => {
    try {
      return JSON.parse(salary.notes);
    } catch {
      return null;
    }
  })() : null);

  // Get action breakdown from salary details
  const actionBreakdown = (salary as any)?.actionBreakdown || null;

  // Define the 4 required actions
  const requiredActions = [
    { key: 'absenceMarked', label: 'Absence Marked' },
    { key: 'feedbacksCompleted', label: 'Feedbacks Completed' },
    { key: 'voiceSent', label: 'Voice Sent' },
    { key: 'textSent', label: 'Text Sent' },
  ];

  // Calculate completion from action breakdown if available
  let completedCount = 0;
  let totalCount = 0;
  if (actionBreakdown) {
    requiredActions.forEach((action) => {
      const actionData = actionBreakdown[action.key];
      if (actionData) {
        totalCount += actionData.required || 0;
        completedCount += actionData.completed || 0;
      }
    });
  } else if (obligationsInfo) {
    completedCount = obligationsInfo.completed || 0;
    totalCount = obligationsInfo.required || 0;
  }

  const firstName = salary?.teacher?.user?.firstName || '';
  const lastName = salary?.teacher?.user?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Unknown';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Salary Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : salary ? (
          <div className="space-y-6">
            {/* Teacher Info */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-semibold text-slate-800 mb-2">Teacher</h3>
              <p className="text-slate-700">{fullName}</p>
              <p className="text-sm text-slate-500">{salary.teacher?.user?.email}</p>
            </div>

            {/* Period */}
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">Period</h3>
              <p className="text-slate-700">
                {formatMonth(
                  (salary as any).month instanceof Date 
                    ? (salary as any).month 
                    : typeof (salary as any).month === 'string'
                    ? (salary as any).month
                    : salary.month,
                  (salary as any).year
                )}
              </p>
            </div>

            {/* Salary Breakdown */}
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-800">Salary Breakdown</h3>
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Lessons Count:</span>
                  <span className="font-medium text-slate-800">{salary.lessonsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Gross Amount:</span>
                  <span className="font-medium text-slate-800">{formatCurrency(salary.grossAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Deductions:</span>
                  <span className="font-medium text-red-600">-{formatCurrency(salary.totalDeductions)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="font-semibold text-slate-800">Net Amount:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(salary.netAmount)}</span>
                </div>
              </div>
            </div>

            {/* Obligations Section */}
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-800">Obligations</h3>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-600">Completion Summary:</span>
                    <span className="font-bold text-lg text-slate-800">
                      {completedCount}/{totalCount || 4}
                    </span>
                  </div>
                </div>

                {/* Action Breakdown */}
                <div className="space-y-2">
                  {requiredActions.map((action) => {
                    let isCompleted = false;
                    let completed = 0;
                    let required = 0;

                    if (actionBreakdown && actionBreakdown[action.key]) {
                      const actionData = actionBreakdown[action.key];
                      completed = actionData.completed || 0;
                      required = actionData.required || 0;
                      isCompleted = completed === required && required > 0;
                    } else {
                      // Fallback: if we have obligationsInfo, we can't determine individual actions
                      // So we show them as unknown
                      isCompleted = false;
                    }

                    return (
                      <div
                        key={action.key}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-lg border',
                          isCompleted
                            ? 'bg-green-50 border-green-200'
                            : 'bg-white border-slate-200'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {isCompleted ? (
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                          <span className={cn('text-sm', isCompleted ? 'text-green-800 font-medium' : 'text-slate-600')}>
                            {action.label}
                          </span>
                        </div>
                        {actionBreakdown && actionBreakdown[action.key] ? (
                          <span className="text-sm text-slate-500">
                            {completed}/{required}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">Status</h3>
              <div className="inline-block">
                {salary.status === 'PAID' ? (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Paid
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                    Pending
                  </span>
                )}
              </div>
              {salary.paidAt && (
                <p className="text-sm text-slate-500 mt-1">
                  Paid on: {new Date(salary.paidAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            Salary record not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

