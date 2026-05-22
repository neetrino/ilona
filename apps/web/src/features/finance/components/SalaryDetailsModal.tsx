'use client';

import { useEffect, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { cn, formatCurrency } from '@/shared/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui';
import { useSalary } from '../hooks/useFinance';

interface SalaryDetailsModalProps {
  salaryId: string | null;
  open: boolean;
  onClose: () => void;
}

export function SalaryDetailsModal({ salaryId, open, onClose }: SalaryDetailsModalProps) {
  const t = useTranslations('finance');
  const locale = useLocale();
  const { data: salary, isLoading } = useSalary(salaryId || '', !!salaryId && open);

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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  const requiredActions = useMemo(
    () => [
      { key: 'absenceMarked', label: t('actionAbsenceMarked') },
      { key: 'feedbacksCompleted', label: t('actionFeedbacksCompleted') },
      { key: 'voiceSent', label: t('actionVoiceSent') },
      { key: 'textSent', label: t('actionTextSent') },
      { key: 'dailyPlan', label: t('actionDailyPlan') },
    ],
    [t],
  );

  if (!open || !salaryId) return null;

  const formatMonth = (month: number | Date | string, year?: number) => {
    let date: Date;
    if (month instanceof Date) {
      date = month;
    } else if (typeof month === 'string') {
      date = new Date(month);
    } else if (year !== undefined) {
      date = new Date(year, month - 1);
    } else {
      date = new Date(month);
    }
    return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  };

  const obligationsInfo = salary?.obligationsInfo || (salary?.notes ? (() => {
    try {
      return JSON.parse(salary.notes);
    } catch {
      return null;
    }
  })() : null);

  const actionBreakdown = (salary as { actionBreakdown?: Record<string, { required?: number; completed?: number }> })?.actionBreakdown || null;

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
  const fullName = `${firstName} ${lastName}`.trim() || t('unknownTeacher');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('salaryDetailsTitle')}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : salary ? (
          <div className="space-y-6">
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-semibold text-slate-800 mb-2">{t('teacher')}</h3>
              <p className="text-slate-700">{fullName}</p>
              <p className="text-sm text-slate-500">{salary.teacher?.user?.email}</p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-800 mb-2">{t('period')}</h3>
              <p className="text-slate-700">
                {formatMonth(salary.month, salary.year)}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-slate-800">{t('salaryBreakdownSection')}</h3>
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">{t('lessonsCountLabel')}</span>
                  <span className="font-medium text-slate-800">{salary.lessonsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">{t('grossAmountLabel')}</span>
                  <span className="font-medium text-slate-800">{formatCurrency(salary.grossAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">{t('totalDeductionsLabelModal')}</span>
                  <span className="font-medium text-red-600">-{formatCurrency(salary.totalDeductions)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="font-semibold text-slate-800">{t('netAmountLabel')}</span>
                  <span className="font-bold text-slate-900">{formatCurrency(salary.netAmount)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-slate-800">{t('obligationsSection')}</h3>
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-600">{t('completionSummary')}</span>
                    <span className="font-bold text-lg text-slate-800">
                      {completedCount}/{totalCount || 5}
                    </span>
                  </div>
                </div>

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

            <div>
              <h3 className="font-semibold text-slate-800 mb-2">{t('status')}</h3>
              <div className="inline-block">
                {salary.status === 'PAID' ? (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    {t('paid')}
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                    {t('pending')}
                  </span>
                )}
              </div>
              {salary.paidAt && (
                <p className="text-sm text-slate-500 mt-1">
                  {t('paidOnDate', {
                    date: new Date(salary.paidAt).toLocaleDateString(locale, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }),
                  })}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            {t('salaryNotFound')}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
