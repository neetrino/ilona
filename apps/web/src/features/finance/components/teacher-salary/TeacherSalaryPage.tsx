'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useMySalaries, useMySalarySummary, useMyDeductions, useMySalaryBreakdown } from '@/features/finance';
import { useMyLessons } from '@/features/lessons';
import { cn, formatCurrency } from '@/shared/lib/utils';
import { Eye } from 'lucide-react';
import {
  DatePickerInput,
  SegmentedControl,
} from '@/shared/components/ui';
import { studentCardHoverClass } from '@/features/student-ui';
import { TeacherSalaryBreakdownSheet } from './TeacherSalaryBreakdownSheet';
import { TeacherSalaryStatusBadge } from './TeacherSalaryStatusBadge';
import {
  capitalizeLabel,
  computeRange,
  formatMonthFromSalary,
  getMonthString,
  toInputDate,
  toIsoEndOfDay,
  toIsoStartOfDay,
  type PeriodPreset,
} from './teacher-salary.utils';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';

const PERIOD_PRESET_KEYS = {
  day: 'periodDay',
  week: 'periodWeek',
  month: 'periodMonth',
  custom: 'periodCustom',
} as const satisfies Record<PeriodPreset, string>;

const PERIOD_PRESETS: PeriodPreset[] = ['day', 'week', 'month', 'custom'];

export function TeacherSalaryPage() {
  const t = useTranslations('finance');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const statusLabels = useMemo(
    () => ({
      pending: t('pending'),
      processing: t('processing'),
      paid: t('paid'),
      cancelled: t('cancelled'),
    }),
    [t],
  );
  const [breakdownMonth, setBreakdownMonth] = useState<string | null>(null);
  const [preset, setPreset] = useState<PeriodPreset>('month');
  const initialRange = useMemo(() => computeRange('month'), []);
  const [customFrom, setCustomFrom] = useState<string>(toInputDate(initialRange.from));
  const [customTo, setCustomTo] = useState<string>(toInputDate(initialRange.to));

  const handlePresetChange = (value: string) => {
    const nextPreset = value as PeriodPreset;
    if (nextPreset === 'custom' && preset !== 'custom') {
      const currentRange = computeRange(preset);
      setCustomFrom(toInputDate(currentRange.from));
      setCustomTo(toInputDate(currentRange.to));
    }
    setPreset(nextPreset);
  };

  const { from, to } = useMemo(() => {
    if (preset === 'custom') {
      const fromDate = customFrom ? new Date(customFrom) : new Date();
      const toDate = customTo ? new Date(customTo) : new Date();
      return { from: fromDate, to: toDate };
    }
    return computeRange(preset);
  }, [preset, customFrom, customTo]);

  const rangeFromIso = toIsoStartOfDay(from);
  const rangeToIso = toIsoEndOfDay(to);

  const { data: salariesData, isLoading: isLoadingSalaries } = useMySalaries(0, 50);
  const { data: summary, isLoading: isLoadingSummary } = useMySalarySummary();
  const { data: deductionsData } = useMyDeductions(0, 200);
  const { data: periodLessons } = useMyLessons(rangeFromIso, rangeToIso);
  const { data: breakdown, isLoading: isLoadingBreakdown } = useMySalaryBreakdown(
    breakdownMonth,
    !!breakdownMonth
  );

  const salaries = salariesData?.items || [];
  const deductions = deductionsData?.items || [];

  const periodLessonsList = periodLessons?.items ?? [];
  const periodLessonsCount = periodLessonsList.length;
  const fromTs = new Date(rangeFromIso).getTime();
  const toTs = new Date(rangeToIso).getTime();

  const periodDeductions = deductions.filter((d) => {
    const t = new Date(d.createdAt).getTime();
    return t >= fromTs && t <= toTs;
  });
  const periodDeductionsTotal = periodDeductions.reduce(
    (sum, d) => sum + Number(d.amount),
    0,
  );

  const periodSalaries = salaries.filter((s) => {
    if (s.month == null || s.year == null) return false;
    const monthStart = new Date(s.year, s.month - 1, 1).getTime();
    const monthEnd = new Date(s.year, s.month, 0, 23, 59, 59, 999).getTime();
    return monthEnd >= fromTs && monthStart <= toTs;
  });
  const periodPayments = periodSalaries
    .filter((s) => s.status === 'PAID')
    .reduce((sum, s) => sum + Number(s.netAmount ?? 0), 0);

  return (
    <DashboardLayout
      title={t('salary')}
      subtitle={t('salarySubtitle')}
    >
      {/* Period Filter */}
      <div className="mb-6 flex flex-col gap-3 rounded-xl border border-[rgba(14,14,16,0.07)] bg-white p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <SegmentedControl
          options={PERIOD_PRESETS.map((p) => ({
            id: p,
            label: capitalizeLabel(t(PERIOD_PRESET_KEYS[p]), locale),
          }))}
          value={preset}
          onChange={handlePresetChange}
          className="w-full shrink-0 sm:w-[min(100%,24rem)]"
          aria-label={t('period')}
        />
        {preset === 'custom' ? (
          <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex min-w-0 items-center gap-2">
              <label className="shrink-0 text-sm font-medium text-[#8b8b90]">{tCommon('from')}</label>
              <DatePickerInput
                value={customFrom}
                max={customTo || undefined}
                onValueChange={setCustomFrom}
                popoverExpanded
                className="h-10 w-full rounded-[15px] border border-[rgba(14,14,16,0.07)] text-sm sm:w-[9.5rem]"
              />
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <label className="shrink-0 text-sm font-medium text-[#8b8b90]">{tCommon('to')}</label>
              <DatePickerInput
                value={customTo}
                min={customFrom || undefined}
                onValueChange={setCustomTo}
                popoverExpanded
                className="h-10 w-full rounded-[15px] border border-[rgba(14,14,16,0.07)] text-sm sm:w-[9.5rem]"
              />
            </div>
          </div>
        ) : (
          <span className="shrink-0 text-xs text-[#8b8b90] sm:text-right">
            {from.toLocaleDateString(locale)} – {to.toLocaleDateString(locale)}
          </span>
        )}
      </div>

      {/* Period Summary (reflects only selected range) */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className={cn('rounded-xl border border-[rgba(14,14,16,0.07)] bg-white p-4', studentCardHoverClass)}>
          <p className="text-sm text-[#8b8b90]">{t('lessons')}</p>
          <p className="text-2xl font-bold text-[#1010a3]">{periodLessonsCount}</p>
          <p className="mt-1 text-xs text-[#8b8b90]">{t('inSelectedPeriod')}</p>
        </div>
        <div className={cn('rounded-xl border border-[rgba(14,14,16,0.07)] bg-white p-4', studentCardHoverClass)}>
          <p className="text-sm text-[#8b8b90]">{t('deductions')}</p>
          <p className="text-2xl font-bold text-red-600">
            −{formatCurrency(periodDeductionsTotal)}
          </p>
          <p className="mt-1 text-xs text-[#8b8b90]">
            {t('itemsCount', { count: periodDeductions.length })}
          </p>
        </div>
        <div className={cn('rounded-xl border border-[rgba(14,14,16,0.07)] bg-white p-4', studentCardHoverClass)}>
          <p className="text-sm text-[#8b8b90]">{t('payments')}</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(periodPayments)}
          </p>
          <p className="mt-1 text-xs text-[#8b8b90]">{t('paidInPeriod')}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className={cn('rounded-xl border border-[rgba(14,14,16,0.07)] bg-white p-4', studentCardHoverClass)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[#8b8b90]">{t('totalEarned')}</p>
              {isLoadingSummary ? (
                <div className="h-6 w-24 bg-[#f1f1f2] rounded animate-pulse" />
              ) : (
                <p className="text-lg font-bold text-[#1010a3]">{formatCurrency(summary?.totalEarned || 0)}</p>
              )}
            </div>
          </div>
        </div>

        <div className={cn('rounded-xl border border-[rgba(14,14,16,0.07)] bg-white p-4', studentCardHoverClass)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[#8b8b90]">{t('pending')}</p>
              {isLoadingSummary ? (
                <div className="h-6 w-24 bg-[#f1f1f2] rounded animate-pulse" />
              ) : (
                <p className="text-lg font-bold text-[#1010a3]">{formatCurrency(summary?.totalPending || 0)}</p>
              )}
            </div>
          </div>
        </div>

        <div className={cn('rounded-xl border border-[rgba(14,14,16,0.07)] bg-white p-4', studentCardHoverClass)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[#8b8b90]">{t('totalDeductionsLabel')}</p>
              {isLoadingSummary ? (
                <div className="h-6 w-24 bg-[#f1f1f2] rounded animate-pulse" />
              ) : (
                <p className="text-lg font-bold text-[#1010a3]">{formatCurrency(summary?.totalDeductions || 0)}</p>
              )}
            </div>
          </div>
        </div>

        <div className={cn('rounded-xl border border-[rgba(14,14,16,0.07)] bg-white p-4', studentCardHoverClass)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[#8b8b90]">{t('lessonsAllPeriods')}</p>
              {isLoadingSummary ? (
                <div className="h-6 w-16 bg-[#f1f1f2] rounded animate-pulse" />
              ) : (
                <p className="text-lg font-bold text-[#1010a3]">
                  {summary?.lessonsCount ?? 0}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-[rgba(14,14,16,0.07)] overflow-hidden">
        <div className="border-b border-[rgba(14,14,16,0.07)] px-4 py-3">
          <h3 className="text-sm font-medium text-[#1010a3]">{t('salaryRecords')}</h3>
        </div>

        {/* Content */}
        <div className="divide-y divide-[rgba(14,14,16,0.07)]">
          {isLoadingSalaries ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center justify-between">
                  <div>
                    <div className="h-4 bg-[#f1f1f2] rounded w-32 mb-2" />
                    <div className="h-3 bg-[#f1f1f2] rounded w-24" />
                  </div>
                  <div className="h-6 bg-[#f1f1f2] rounded w-24" />
                </div>
              ))}
            </div>
          ) : salaries.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#f6f6f7] rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[#8b8b90]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#1010a3] mb-1">{t('noSalaryRecordsTitle')}</h3>
              <p className="text-sm text-[#8b8b90]">{t('noSalaryRecordsDescription')}</p>
            </div>
          ) : (
            salaries.map((salary) => {
              const monthName = formatMonthFromSalary(salary, locale, t('unknownMonth'));
              const monthStr = getMonthString(salary);
              const netAmount = typeof salary.netAmount === 'number' ? salary.netAmount : Number(salary.netAmount) || 0;
              const grossAmount = typeof salary.grossAmount === 'number' ? salary.grossAmount : Number(salary.grossAmount) || 0;
              const totalDeductions = typeof salary.totalDeductions === 'number' ? salary.totalDeductions : Number(salary.totalDeductions) || 0;

              return (
                <div
                  key={salary.id}
                  className="p-4 hover:bg-[#fafafa] transition-colors flex items-center justify-between gap-4 flex-wrap"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1010a3]">{monthName}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-[#8b8b90] flex-wrap">
                      <span>{t('lessonsInRecord', { count: salary.lessonsCount ?? 0 })}</span>
                      {grossAmount > 0 && (
                        <span className="text-[#8b8b90]">{t('grossLabel', { amount: formatCurrency(grossAmount) })}</span>
                      )}
                      {totalDeductions > 0 && (
                        <span className="text-red-600">
                          {t('deductionsInRecord', { amount: formatCurrency(totalDeductions) })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-bold text-[#1010a3]">{formatCurrency(netAmount)}</p>
                    <TeacherSalaryStatusBadge status={salary.status} labels={statusLabels} />
                    <button
                      type="button"
                      onClick={() => setBreakdownMonth(monthStr)}
                      className="p-2 hover:bg-[#f1f1f2] rounded-lg transition-colors"
                      aria-label={t('viewBreakdownFor', { month: monthName })}
                    >
                      <Eye className="w-5 h-5 text-[#3b3b40]" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <TeacherSalaryBreakdownSheet
        month={breakdownMonth}
        breakdown={breakdown}
        isLoading={isLoadingBreakdown}
        onClose={() => setBreakdownMonth(null)}
      />
    </DashboardLayout>
  );
}
