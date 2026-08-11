'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Wallet } from 'lucide-react';
import type { SalaryBreakdown } from '@/features/finance/types';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/shared/components/ui';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';
import { studentTableHeadClass } from '@/features/student-ui';
import { cn, formatCurrency } from '@/shared/lib/utils';
import { formatMonthFromSalary } from './teacher-salary.utils';

type TeacherSalaryBreakdownSheetProps = {
  month: string | null;
  breakdown: SalaryBreakdown | undefined;
  isLoading: boolean;
  onClose: () => void;
};

function monthLabel(month: string, locale: string, fallback: string): string {
  return formatMonthFromSalary(
    {
      year: parseInt(month.slice(0, 4), 10),
      month: parseInt(month.slice(5, 7), 10),
    },
    locale,
    fallback,
  );
}

export function TeacherSalaryBreakdownSheet({
  month,
  breakdown,
  isLoading,
  onClose,
}: TeacherSalaryBreakdownSheetProps) {
  const t = useTranslations('finance');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const open = !!month;

  const totals = useMemo(() => {
    const lessons = breakdown?.lessons ?? [];
    return {
      gross: lessons.reduce((sum, lesson) => sum + lesson.salary, 0),
      deductions: lessons.reduce((sum, lesson) => sum + lesson.deduction, 0),
      net: lessons.reduce((sum, lesson) => sum + lesson.total, 0),
    };
  }, [breakdown?.lessons]);

  const titleMonth = month ? monthLabel(month, locale, t('unknownMonth')) : '';

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        variant="portal"
        stackOpen={open}
        className="bg-[#f8f9fb]"
        aria-describedby={undefined}
      >
        <div className="-mx-4 -mt-4 mb-5 border-b border-[rgba(14,14,16,0.07)] bg-white px-4 py-5 tablet:-mx-6 tablet:-mt-6 tablet:px-6 tablet:py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.875rem] border border-[rgba(14,14,16,0.08)] bg-[#ececff] text-[#1010a3]">
              <Wallet className="h-5 w-5" strokeWidth={2.25} aria-hidden />
            </div>
            <div className="min-w-0 flex-1 pr-8">
              <DialogTitle className="text-left text-lg font-semibold tracking-tight text-[#1010a3] sm:text-xl">
                {t('breakdownTitle')}
              </DialogTitle>
              <p className="mt-1.5 text-sm text-[#8b8b90]">
                {titleMonth
                  ? `${titleMonth} · ${t('salaryBreakdownSubtitle')}`
                  : t('salaryBreakdownSubtitle')}
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="md" />
          </div>
        ) : breakdown?.lessons && breakdown.lessons.length > 0 ? (
          <div className="space-y-4 pb-2">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[rgba(14,14,16,0.07)] bg-white px-4 py-3">
                <p className="text-xs font-medium text-[#8b8b90]">{t('earnings')}</p>
                <p className="mt-1 text-base font-semibold text-[#3b3b40]">
                  {formatCurrency(totals.gross)}
                </p>
              </div>
              <div className="rounded-2xl border border-[rgba(14,14,16,0.07)] bg-white px-4 py-3">
                <p className="text-xs font-medium text-[#8b8b90]">{t('deductions')}</p>
                <p className="mt-1 text-base font-semibold text-red-600">
                  −{formatCurrency(totals.deductions)}
                </p>
              </div>
              <div className="rounded-2xl border border-[rgba(14,14,16,0.07)] bg-white px-4 py-3">
                <p className="text-xs font-medium text-[#8b8b90]">{t('netTotal')}</p>
                <p className="mt-1 text-base font-semibold text-[#1010a3]">
                  {formatCurrency(totals.net)}
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[rgba(14,14,16,0.07)] bg-white">
              <div className="min-w-0 overflow-x-auto">
                <table className="w-full min-w-[40rem] text-sm">
                  <thead className={cn(studentTableHeadClass, 'border-b border-[rgba(14,14,16,0.07)]')}>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#8b8b90]">
                        {t('lessonColumn')}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#8b8b90]">
                        {tCommon('date')}
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[#8b8b90]">
                        {t('obligation')}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#8b8b90]">
                        {t('lessonSalary')}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#8b8b90]">
                        {t('lessonDeduction')}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#8b8b90]">
                        {t('rowTotal')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(14,14,16,0.07)]">
                    {breakdown.lessons.map((lesson) => (
                      <tr key={lesson.lessonId} className="transition-colors hover:bg-[#fafafa]/60">
                        <td className="px-4 py-3 align-middle font-medium text-[#1010a3]">
                          <div className="min-w-0">
                            <p className="truncate">{lesson.lessonName}</p>
                            {lesson.groupName ? (
                              <p className="mt-0.5 truncate text-xs font-normal text-[#8b8b90]">
                                {lesson.groupName}
                              </p>
                            ) : null}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 align-middle text-[#8b8b90]">
                          {lesson.lessonDate
                            ? new Date(lesson.lessonDate).toLocaleDateString(locale, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>
                        <td className="px-4 py-3 align-middle text-center text-[#3b3b40]">
                          {lesson.obligationCompleted}/{lesson.obligationTotal}
                        </td>
                        <td className="px-4 py-3 align-middle text-right text-[#3b3b40]">
                          {formatCurrency(lesson.salary)}
                        </td>
                        <td className="px-4 py-3 align-middle text-right text-red-600">
                          −{formatCurrency(lesson.deduction)}
                        </td>
                        <td className="px-4 py-3 align-middle text-right font-medium text-[#1010a3]">
                          {formatCurrency(lesson.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <p className="py-12 text-center text-sm text-[#8b8b90]">{t('breakdownNoLessons')}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
