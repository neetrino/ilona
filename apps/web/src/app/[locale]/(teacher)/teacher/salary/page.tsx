'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useMySalaries, useMySalarySummary, useMyDeductions } from '@/features/finance';
import { cn } from '@/shared/lib/utils';

type TabType = 'salaries' | 'deductions';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('hy-AM', {
    style: 'currency',
    currency: 'AMD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
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

  // Fetch data
  const { data: salariesData, isLoading: isLoadingSalaries } = useMySalaries(0, 20);
  const { data: summary, isLoading: isLoadingSummary } = useMySalarySummary();
  const { data: deductionsData, isLoading: isLoadingDeductions } = useMyDeductions(0, 50);

  const salaries = salariesData?.items || [];
  const deductions = deductionsData?.items || [];

  return (
    <DashboardLayout
      title={t('salary')}
      subtitle={t('salarySubtitle')}
    >
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
              <p className="text-sm text-slate-500">Lessons This Period</p>
              {isLoadingSummary ? (
                <div className="h-6 w-16 bg-slate-200 rounded animate-pulse" />
              ) : (
                <p className="text-lg font-bold text-slate-800">{summary?.lessonsCount || 0}</p>
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
                const monthDate = new Date(salary.month);
                const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

                return (
                  <div key={salary.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{monthName}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                          <span>{salary.lessonsCount} lessons</span>
                          {salary.bonuses > 0 && (
                            <span className="text-green-600">+{formatCurrency(salary.bonuses)} bonus</span>
                          )}
                          {salary.deductions > 0 && (
                            <span className="text-red-600">-{formatCurrency(salary.deductions)} deductions</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-800">{formatCurrency(salary.totalAmount)}</p>
                        <StatusBadge status={salary.status} />
                      </div>
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
    </DashboardLayout>
  );
}
