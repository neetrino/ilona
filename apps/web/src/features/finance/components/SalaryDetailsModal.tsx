'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useLocale, useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { cn, formatCurrency } from '@/shared/lib/utils';
import { PortalFormSheetDragHandle } from '@/shared/components/ui/portal-form-sheet-drag-handle';
import { PortalFormSheetScrollArea } from '@/shared/components/ui/portal-form-sheet-scroll-area';
import { PortalSheetPortal } from '@/shared/components/ui/portal-sheet-portal';
import { usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import {
  PORTAL_FORM_SHEET_CLOSE_BUTTON_CLASS,
  PORTAL_FORM_SHEET_HEADER_CLASS,
  portalFormSheetContentClass,
} from '@/shared/lib/portal-form-sheet-classes';
import { useSalary } from '../hooks/useFinance';

interface SalaryDetailsModalProps {
  salaryId: string | null;
  open: boolean;
  onClose: () => void;
}

function formatSalaryMonth(
  month: number | Date | string,
  locale: string,
  year?: number,
): string {
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
}

export function SalaryDetailsModal({ salaryId, open, onClose }: SalaryDetailsModalProps) {
  const t = useTranslations('finance');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [isDialogOpen, setIsDialogOpen] = useState(open);
  const { data: salary, isLoading } = useSalary(salaryId || '', !!salaryId && open);

  useEffect(() => {
    setIsDialogOpen(open);
  }, [open]);

  const requestClose = useCallback(() => {
    setIsDialogOpen(false);
    onClose();
  }, [onClose]);

  const { dragStyle, dragHandleProps, scrollContentProps, resetDrag } = usePortalSheetDrag({
    enabled: true,
    onClose: requestClose,
  });

  useEffect(() => {
    if (!open) {
      resetDrag();
    }
  }, [open, resetDrag]);

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

  const obligationsInfo =
    salary?.obligationsInfo ||
    (salary?.notes
      ? (() => {
          try {
            return JSON.parse(salary.notes);
          } catch {
            return null;
          }
        })()
      : null);

  const actionBreakdown =
    (salary as { actionBreakdown?: Record<string, { required?: number; completed?: number }> })
      ?.actionBreakdown || null;

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
    <DialogPrimitive.Root open={isDialogOpen} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
      <PortalSheetPortal
        open={isDialogOpen}
        dragStyle={dragStyle}
        sheetContentRef={scrollContentProps.ref}
        contentClassName={portalFormSheetContentClass('2xl')}
        contentProps={{ 'aria-describedby': undefined }}
      >
        <PortalFormSheetDragHandle dragHandleProps={dragHandleProps} />

        <DialogPrimitive.Title className="sr-only">{t('salaryDetailsTitle')}</DialogPrimitive.Title>

        <div className={PORTAL_FORM_SHEET_HEADER_CLASS}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="break-words text-lg font-semibold text-[#3b3b40]">{t('salaryDetailsTitle')}</h2>
              {salary ? (
                <p className="mt-1 text-sm text-[#8b8b90]">
                  {fullName} · {formatSalaryMonth(salary.month, locale, salary.year)}
                </p>
              ) : null}
            </div>
            <DialogPrimitive.Close
              className={PORTAL_FORM_SHEET_CLOSE_BUTTON_CLASS}
              aria-label={tCommon('close')}
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>
        </div>

        <PortalFormSheetScrollArea>
          {!salaryId ? (
            <div className="py-12 text-center text-slate-500">{t('salaryNotFound')}</div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            </div>
          ) : salary ? (
            <div className="space-y-6">
              <div className="rounded-lg bg-slate-50 p-4">
                <h3 className="mb-2 font-semibold text-slate-800">{t('teacher')}</h3>
                <p className="text-slate-700">{fullName}</p>
                <p className="text-sm text-slate-500">{salary.teacher?.user?.email}</p>
              </div>

              <div>
                <h3 className="mb-2 font-semibold text-slate-800">{t('period')}</h3>
                <p className="text-slate-700">{formatSalaryMonth(salary.month, locale, salary.year)}</p>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-slate-800">{t('salaryBreakdownSection')}</h3>
                <div className="space-y-2 rounded-lg bg-slate-50 p-4">
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
                  <div className="flex justify-between border-t border-slate-200 pt-2">
                    <span className="font-semibold text-slate-800">{t('netAmountLabel')}</span>
                    <span className="font-bold text-slate-900">{formatCurrency(salary.netAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-slate-800">{t('obligationsSection')}</h3>
                <div className="rounded-lg bg-slate-50 p-4">
                  <div className="mb-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-slate-600">{t('completionSummary')}</span>
                      <span className="text-lg font-bold text-slate-800">
                        {completedCount}/{totalCount || 5}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {requiredActions.map((action) => {
                      let isCompleted = false;
                      let completed = 0;
                      let required = 0;

                      if (actionBreakdown?.[action.key]) {
                        const actionData = actionBreakdown[action.key];
                        completed = actionData.completed || 0;
                        required = actionData.required || 0;
                        isCompleted = completed === required && required > 0;
                      }

                      return (
                        <div
                          key={action.key}
                          className={cn(
                            'flex items-center justify-between rounded-lg border p-3',
                            isCompleted ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white',
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {isCompleted ? (
                              <svg
                                className="h-5 w-5 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="h-5 w-5 text-slate-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            )}
                            <span
                              className={cn(
                                'text-sm',
                                isCompleted ? 'font-medium text-green-800' : 'text-slate-600',
                              )}
                            >
                              {action.label}
                            </span>
                          </div>
                          {actionBreakdown?.[action.key] ? (
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
                <h3 className="mb-2 font-semibold text-slate-800">{t('status')}</h3>
                <div className="inline-block">
                  {salary.status === 'PAID' ? (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                      {t('paid')}
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
                      {t('pending')}
                    </span>
                  )}
                </div>
                {salary.paidAt ? (
                  <p className="mt-1 text-sm text-slate-500">
                    {t('paidOnDate', {
                      date: new Date(salary.paidAt).toLocaleDateString(locale, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }),
                    })}
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500">{t('salaryNotFound')}</div>
          )}
        </PortalFormSheetScrollArea>
      </PortalSheetPortal>
    </DialogPrimitive.Root>
  );
}
