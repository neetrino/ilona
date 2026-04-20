'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useMySalaries, useMySalarySummary, useMyDeductions, useMySalaryBreakdown } from '@/features/finance';
import { useMyLessons } from '@/features/lessons';
import { cn } from '@/shared/lib/utils';
import { Eye, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui';

type TabType = 'salaries' | 'deductions';
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('hy-AM', {
    style: 'currency',
    currency: 'AMD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getMonthString(salary: { month: number; year: number }): string {
  if (salary.year != null && salary.month != null) {
    return `${salary.year}-${String(salary.month).padStart(2, '0')}`;
  }
  return '';
}

function formatMonthFromSalary(salary: { month: number; year: number }): string {
  if (salary.month != null && salary.year != null) {
    const date = new Date(salary.year, salary.month - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  return 'Unknown';
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
    PROCESSING: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Processing' },
    PAID: { bg: 'bg-green-100', text: 'text-green-700', label: 'Paid' },
    CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
  };

  const style = styles[status] || { bg: 'bg-slate-100', text: 'text-slate-700', label: status };

  return (
    <span className={cn('px-2 py-1 text-xs font-medium rounded-full', style.bg, style.text)}>
      {style.label}
    </span>
  );
}

function DeductionReasonBadge({ reason }: { reason: string }) {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    LATE: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Late' },
    ABSENCE: { bg: 'bg-red-100', text: 'text-red-700', label: 'Absence' },
    VOCAB_NOT_SENT: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Vocab Not Sent' },
    OTHER: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Other' },
  };

  const style = styles[reason] || styles.OTHER;

  return (
    <span className={cn('px-2 py-1 text-xs font-medium rounded-full', style.bg, style.text)}>
      {style.label}
    </span>
  );
}

export default function TeacherSalaryPage() {
  const t = useTranslations('finance');
  const [activeTab, setActiveTab] = useState<TabType>('salaries');
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
  const { data: deductionsData, isLoading: isLoadingDeductions } = useMyDeductions(0, 200);
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
      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {(['day', 'week', 'month', 'custom'] as PeriodPreset[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPreset(p)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors',
                preset === p
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800',
              )}
            >
              {p}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm text-slate-600">From</label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
            />
            <label className="text-sm text-slate-600">To</label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
            />
          </div>
        )}
        <span className="ml-auto text-xs text-slate-500">
          {from.toLocaleDateString()} – {to.toLocaleDateString()}
        </span>
      </div>

      {/* Period Summary (reflects only selected range) */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Lessons</p>
          <p className="text-2xl font-bold text-slate-800">{periodLessonsCount}</p>
          <p className="mt-1 text-xs text-slate-500">in selected period</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Deductions</p>
          <p className="text-2xl font-bold text-red-600">
            −{formatCurrency(periodDeductionsTotal)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {periodDeductions.length} item{periodDeductions.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Payments</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(periodPayments)}
          </p>
          <p className="mt-1 text-xs text-slate-500">paid in period</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Earned</p>
              {isLoadingSummary ? (
                <div className="h-6 w-24 bg-slate-200 rounded animate-pulse" />
              ) : (
                <p className="text-lg font-bold text-slate-800">{formatCurrency(summary?.totalEarned || 0)}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-500">Pending</p>
              {isLoadingSummary ? (
                <div className="h-6 w-24 bg-slate-200 rounded animate-pulse" />
              ) : (
                <p className="text-lg font-bold text-slate-800">{formatCurrency(summary?.totalPending || 0)}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Deductions</p>
              {isLoadingSummary ? (
                <div className="h-6 w-24 bg-slate-200 rounded animate-pulse" />
              ) : (
                <p className="text-lg font-bold text-slate-800">{formatCurrency(summary?.totalDeductions || 0)}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-500">Lessons (all periods)</p>
              {isLoadingSummary ? (
                <div className="h-6 w-16 bg-slate-200 rounded animate-pulse" />
              ) : (
                <p className="text-lg font-bold text-slate-800">
                  {summary?.lessonsCount ?? 0}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('salaries')}
              className={cn(
                'flex-1 px-4 py-3 text-sm font-medium transition-colors',
                activeTab === 'salaries'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Salary Records
            </button>
            <button
              onClick={() => setActiveTab('deductions')}
              className={cn(
                'flex-1 px-4 py-3 text-sm font-medium transition-colors relative',
                activeTab === 'deductions'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Deductions
              {deductions.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
                  {deductions.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'salaries' && (
          <div className="divide-y divide-slate-100">
            {isLoadingSalaries ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-center justify-between">
                    <div>
                      <div className="h-4 bg-slate-200 rounded w-32 mb-2" />
                      <div className="h-3 bg-slate-200 rounded w-24" />
                    </div>
                    <div className="h-6 bg-slate-200 rounded w-24" />
                  </div>
                ))}
              </div>
            ) : salaries.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-1">No salary records yet</h3>
                <p className="text-sm text-slate-500">Your salary records will appear here once generated.</p>
              </div>
            ) : (
              salaries.map((salary) => {
                const monthName = formatMonthFromSalary(salary);
                const monthStr = getMonthString(salary);
                const netAmount = typeof salary.netAmount === 'number' ? salary.netAmount : Number(salary.netAmount) || 0;
                const grossAmount = typeof salary.grossAmount === 'number' ? salary.grossAmount : Number(salary.grossAmount) || 0;
                const totalDeductions = typeof salary.totalDeductions === 'number' ? salary.totalDeductions : Number(salary.totalDeductions) || 0;

                return (
                  <div
                    key={salary.id}
                    className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4 flex-wrap"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800">{monthName}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-500 flex-wrap">
                        <span>{salary.lessonsCount ?? 0} lessons</span>
                        {grossAmount > 0 && (
                          <span className="text-slate-600">Gross: {formatCurrency(grossAmount)}</span>
                        )}
                        {totalDeductions > 0 && (
                          <span className="text-red-600">−{formatCurrency(totalDeductions)} deductions</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-lg font-bold text-slate-800">{formatCurrency(netAmount)}</p>
                      <StatusBadge status={salary.status} />
                      <button
                        type="button"
                        onClick={() => setBreakdownMonth(monthStr)}
                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                        aria-label={`View breakdown for ${monthName}`}
                      >
                        <Eye className="w-5 h-5 text-slate-700" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'deductions' && (
          <div className="divide-y divide-slate-100">
            {isLoadingDeductions ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-center justify-between">
                    <div>
                      <div className="h-4 bg-slate-200 rounded w-32 mb-2" />
                      <div className="h-3 bg-slate-200 rounded w-48" />
                    </div>
                    <div className="h-6 bg-slate-200 rounded w-16" />
                  </div>
                ))}
              </div>
            ) : deductions.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-1">No deductions</h3>
                <p className="text-sm text-slate-500">Great job! You have no deductions recorded.</p>
              </div>
            ) : (
              deductions.map((deduction) => (
                <div key={deduction.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <DeductionReasonBadge reason={deduction.reason} />
                        <span className="text-sm text-slate-500">
                          {new Date(deduction.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      {deduction.description && (
                        <p className="text-sm text-slate-600">{deduction.description}</p>
                      )}
                    </div>
                    <p className="text-lg font-bold text-red-600">-{formatCurrency(deduction.amount)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Salary breakdown modal (per-lesson details, same as Admin view for this teacher) */}
      <Dialog open={!!breakdownMonth} onOpenChange={(open) => !open && setBreakdownMonth(null)}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle>
              Salary breakdown
              {breakdownMonth
                ? ` – ${formatMonthFromSalary({
                    year: parseInt(breakdownMonth.slice(0, 4), 10),
                    month: parseInt(breakdownMonth.slice(5, 7), 10),
                  })}`
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
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left py-2 px-3 font-medium text-slate-700">Lesson</th>
                        <th className="text-left py-2 px-3 font-medium text-slate-700">Date</th>
                        <th className="text-center py-2 px-3 font-medium text-slate-700">Obligation</th>
                        <th className="text-right py-2 px-3 font-medium text-slate-700">Salary</th>
                        <th className="text-right py-2 px-3 font-medium text-slate-700">Deduction</th>
                        <th className="text-right py-2 px-3 font-medium text-slate-700">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {breakdown.lessons.map((lesson) => (
                        <tr key={lesson.lessonId} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-slate-800">{lesson.lessonName}</td>
                          <td className="py-2 px-3 text-slate-600">
                            {lesson.lessonDate
                              ? new Date(lesson.lessonDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : '—'}
                          </td>
                          <td className="py-2 px-3 text-center text-slate-700">
                            {lesson.obligationCompleted}/{lesson.obligationTotal}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-700">{formatCurrency(lesson.salary)}</td>
                          <td className="py-2 px-3 text-right text-red-600">
                            −{formatCurrency(lesson.deduction)}
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-slate-800">
                            {formatCurrency(lesson.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 flex justify-end gap-6 text-sm font-semibold">
                  <span className="text-slate-600">
                    Gross: {formatCurrency(breakdown.lessons.reduce((s, l) => s + l.salary, 0))}
                  </span>
                  <span className="text-red-600">
                    Deductions: −{formatCurrency(breakdown.lessons.reduce((s, l) => s + l.deduction, 0))}
                  </span>
                  <span className="text-slate-800">
                    Net: {formatCurrency(breakdown.lessons.reduce((s, l) => s + l.total, 0))}
                  </span>
                </div>
              </>
            ) : breakdownMonth && !isLoadingBreakdown ? (
              <p className="py-8 text-center text-slate-500">No lessons for this period.</p>
            ) : null}
          </div>
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setBreakdownMonth(null)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <X className="w-4 h-4" />
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
