'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useMySalaries, useMySalarySummary, useMyDeductions, useMySalaryBreakdown } from '@/features/finance';
import { useMyLessons } from '@/features/lessons';
import { cn, formatCurrency } from '@/shared/lib/utils';
import { Eye, X } from 'lucide-react';
import {
  DatePickerInput,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui';

type PeriodPreset = 'day' | 'week' | 'month' | 'custom';

function toIsoStartOfDay(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function toIsoEndOfDay(date: Date): string {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function toInputDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function computeRange(preset: PeriodPreset): { from: Date; to: Date } {
  const now = new Date();
  if (preset === 'day') {
    return { from: now, to: now };
  }
  if (preset === 'week') {
    const monday = new Date(now);
    const day = (monday.getDay() + 6) % 7;
    monday.setDate(monday.getDate() - day);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { from: monday, to: sunday };
  }
  if (preset === 'month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from, to };
  }
  return { from: now, to: now };
}

function getMonthString(salary: { month: number; year: number }): string {
  if (salary.year != null && salary.month != null) {
    return `${salary.year}-${String(salary.month).padStart(2, '0')}`;
  }
  return '';
}

function formatMonthFromSalary(
  salary: { month: number; year: number },
  locale: string,
  unknownLabel: string,
): string {
  if (salary.month != null && salary.year != null) {
    const date = new Date(salary.year, salary.month - 1);
    return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  }
  return unknownLabel;
}

function StatusBadge({
  status,
  labels,
}: {
  status: string;
  labels: Record<string, string>;
}) {
  const styles: Record<string, { bg: string; text: string; labelKey: string }> = {
    PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', labelKey: 'pending' },
    PROCESSING: { bg: 'bg-blue-100', text: 'text-blue-700', labelKey: 'processing' },
    PAID: { bg: 'bg-green-100', text: 'text-green-700', labelKey: 'paid' },
    CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', labelKey: 'cancelled' },
  };

  const style = styles[status];
  const label = style ? labels[style.labelKey] ?? status : status;
  const colors = style ?? { bg: 'bg-[#f6f6f7]', text: 'text-[#3b3b40]' };

  return (
    <span className={cn('px-2 py-1 text-xs font-medium rounded-full', colors.bg, colors.text)}>
      {label}
    </span>
  );
}

const PERIOD_PRESET_KEYS = {
  day: 'periodDay',
  week: 'periodWeek',
  month: 'periodMonth',
  custom: 'periodCustom',
} as const satisfies Record<PeriodPreset, string>;

const PERIOD_PRESETS: PeriodPreset[] = ['day', 'week', 'month', 'custom'];
const PERIOD_TRACK_PADDING_PX = 4;

export default function TeacherSalaryPage() {
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

  const selectedPresetIndex = PERIOD_PRESETS.indexOf(preset);
  const periodTrackInsetPx = PERIOD_TRACK_PADDING_PX * 2;

  return (
    <DashboardLayout
      title={t('salary')}
      subtitle={t('salarySubtitle')}
    >
      {/* Period Filter */}
      <div className="mb-6 flex flex-col gap-3 rounded-xl border border-[rgba(14,14,16,0.07)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
          <div
            role="group"
            aria-label={t('period')}
            className="relative grid w-full shrink-0 rounded-lg border border-[rgba(14,14,16,0.12)] bg-[#f6f6f7] p-1 shadow-sm sm:w-auto"
            style={{ gridTemplateColumns: `repeat(${PERIOD_PRESETS.length}, minmax(0, 1fr))` }}
          >
            {selectedPresetIndex >= 0 ? (
              <span
                aria-hidden
                className="pointer-events-none absolute z-0 rounded-md bg-[#1010a3] shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  top: PERIOD_TRACK_PADDING_PX,
                  bottom: PERIOD_TRACK_PADDING_PX,
                  left: PERIOD_TRACK_PADDING_PX,
                  width: `calc((100% - ${periodTrackInsetPx}px) / ${PERIOD_PRESETS.length})`,
                  transform: `translateX(${selectedPresetIndex * 100}%)`,
                }}
              />
            ) : null}
            {PERIOD_PRESETS.map((p) => {
              const isSelected = preset === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPreset(p)}
                  className={cn(
                    'relative z-10 flex w-full items-center justify-center rounded-md px-2 py-2 text-center text-sm font-semibold capitalize whitespace-nowrap transition-colors duration-300 focus:outline-none focus-visible:outline-none focus-visible:ring-0 sm:px-3',
                    isSelected
                      ? 'text-white'
                      : 'text-[#3b3b40] hover:text-[#1010a3]',
                  )}
                  aria-pressed={isSelected}
                >
                  {t(PERIOD_PRESET_KEYS[p])}
                </button>
              );
            })}
          </div>
          {preset === 'custom' && (
            <div className="grid w-full grid-cols-2 gap-3 sm:ml-10 sm:flex sm:w-auto sm:flex-row sm:items-center sm:gap-4">
              <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                <label className="shrink-0 text-sm font-medium text-[#8b8b90]">{tCommon('from')}</label>
                <DatePickerInput
                  value={customFrom}
                  max={customTo || undefined}
                  onValueChange={setCustomFrom}
                  popoverExpanded
                  className="h-10 w-full rounded-lg border border-[rgba(14,14,16,0.07)] text-sm sm:w-[9.5rem]"
                />
              </div>
              <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                <label className="shrink-0 text-sm font-medium text-[#8b8b90]">{tCommon('to')}</label>
                <DatePickerInput
                  value={customTo}
                  min={customFrom || undefined}
                  onValueChange={setCustomTo}
                  popoverExpanded
                  className="h-10 w-full rounded-lg border border-[rgba(14,14,16,0.07)] text-sm sm:w-[9.5rem]"
                />
              </div>
            </div>
          )}
        </div>
        <span className="shrink-0 text-xs text-[#8b8b90] sm:ml-auto">
          {from.toLocaleDateString(locale)} – {to.toLocaleDateString(locale)}
        </span>
      </div>

      {/* Period Summary (reflects only selected range) */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[rgba(14,14,16,0.07)] bg-white p-4">
          <p className="text-sm text-[#8b8b90]">{t('lessons')}</p>
          <p className="text-2xl font-bold text-[#1010a3]">{periodLessonsCount}</p>
          <p className="mt-1 text-xs text-[#8b8b90]">{t('inSelectedPeriod')}</p>
        </div>
        <div className="rounded-xl border border-[rgba(14,14,16,0.07)] bg-white p-4">
          <p className="text-sm text-[#8b8b90]">{t('deductions')}</p>
          <p className="text-2xl font-bold text-red-600">
            −{formatCurrency(periodDeductionsTotal)}
          </p>
          <p className="mt-1 text-xs text-[#8b8b90]">
            {t('itemsCount', { count: periodDeductions.length })}
          </p>
        </div>
        <div className="rounded-xl border border-[rgba(14,14,16,0.07)] bg-white p-4">
          <p className="text-sm text-[#8b8b90]">{t('payments')}</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(periodPayments)}
          </p>
          <p className="mt-1 text-xs text-[#8b8b90]">{t('paidInPeriod')}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-[rgba(14,14,16,0.07)]">
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

        <div className="bg-white p-4 rounded-xl border border-[rgba(14,14,16,0.07)]">
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

        <div className="bg-white p-4 rounded-xl border border-[rgba(14,14,16,0.07)]">
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

        <div className="bg-white p-4 rounded-xl border border-[rgba(14,14,16,0.07)]">
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
                    <StatusBadge status={salary.status} labels={statusLabels} />
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

      {/* Salary breakdown modal (per-lesson details, same as Admin view for this teacher) */}
      <Dialog open={!!breakdownMonth} onOpenChange={(open) => !open && setBreakdownMonth(null)}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle>
              {t('breakdownTitle')}
              {breakdownMonth
                ? ` – ${formatMonthFromSalary(
                    {
                      year: parseInt(breakdownMonth.slice(0, 4), 10),
                      month: parseInt(breakdownMonth.slice(5, 7), 10),
                    },
                    locale,
                    t('unknownMonth'),
                  )}`
                : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto flex-1 min-h-0">
            {isLoadingBreakdown ? (
              <div className="py-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : breakdown?.lessons && breakdown.lessons.length > 0 ? (
              <>
                <div className="border border-[rgba(14,14,16,0.07)] rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-[#fafafa] border-b border-[rgba(14,14,16,0.07)]">
                      <tr>
                        <th className="text-left py-2 px-3 font-medium text-[#3b3b40]">{t('lessonColumn')}</th>
                        <th className="text-left py-2 px-3 font-medium text-[#3b3b40]">{tCommon('date')}</th>
                        <th className="text-center py-2 px-3 font-medium text-[#3b3b40]">{t('obligation')}</th>
                        <th className="text-right py-2 px-3 font-medium text-[#3b3b40]">{t('lessonSalary')}</th>
                        <th className="text-right py-2 px-3 font-medium text-[#3b3b40]">{t('lessonDeduction')}</th>
                        <th className="text-right py-2 px-3 font-medium text-[#3b3b40]">{t('rowTotal')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(14,14,16,0.07)]">
                      {breakdown.lessons.map((lesson) => (
                        <tr key={lesson.lessonId} className="hover:bg-[#fafafa]">
                          <td className="py-2 px-3 text-[#1010a3]">{lesson.lessonName}</td>
                          <td className="py-2 px-3 text-[#8b8b90]">
                            {lesson.lessonDate
                              ? new Date(lesson.lessonDate).toLocaleDateString(locale, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : '—'}
                          </td>
                          <td className="py-2 px-3 text-center text-[#3b3b40]">
                            {lesson.obligationCompleted}/{lesson.obligationTotal}
                          </td>
                          <td className="py-2 px-3 text-right text-[#3b3b40]">{formatCurrency(lesson.salary)}</td>
                          <td className="py-2 px-3 text-right text-red-600">
                            −{formatCurrency(lesson.deduction)}
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-[#1010a3]">
                            {formatCurrency(lesson.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 pt-4 border-t border-[rgba(14,14,16,0.07)] flex justify-end gap-6 text-sm font-semibold">
                  <span className="text-[#8b8b90]">
                    {t('grossSummary', {
                      amount: formatCurrency(breakdown.lessons.reduce((s, l) => s + l.salary, 0)),
                    })}
                  </span>
                  <span className="text-red-600">
                    {t('deductionsSummary', {
                      amount: formatCurrency(breakdown.lessons.reduce((s, l) => s + l.deduction, 0)),
                    })}
                  </span>
                  <span className="text-[#1010a3]">
                    {t('netSummary', {
                      amount: formatCurrency(breakdown.lessons.reduce((s, l) => s + l.total, 0)),
                    })}
                  </span>
                </div>
              </>
            ) : breakdownMonth && !isLoadingBreakdown ? (
              <p className="py-8 text-center text-[#8b8b90]">{t('breakdownNoLessons')}</p>
            ) : null}
          </div>
          <div className="flex justify-end pt-4 border-t border-[rgba(14,14,16,0.07)]">
            <button
              type="button"
              onClick={() => setBreakdownMonth(null)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[rgba(14,14,16,0.07)] text-[#3b3b40] hover:bg-[#fafafa]"
            >
              <X className="w-4 h-4" />
              {tCommon('close')}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
