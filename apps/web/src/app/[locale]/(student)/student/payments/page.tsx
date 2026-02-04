'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useMyPayments, useMyPaymentsSummary } from '@/features/finance';
import { cn } from '@/shared/lib/utils';

type FilterStatus = 'all' | 'PENDING' | 'PAID' | 'OVERDUE';

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
    PAID: { bg: 'bg-green-100', text: 'text-green-700', label: 'Paid' },
    OVERDUE: { bg: 'bg-red-100', text: 'text-red-700', label: 'Overdue' },
    CANCELLED: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Cancelled' },
  };

  const style = styles[status] || { bg: 'bg-slate-100', text: 'text-slate-700', label: status };

  return (
    <span className={cn('px-2 py-1 text-xs font-medium rounded-full', style.bg, style.text)}>
      {style.label}
    </span>
  );
}

export default function StudentPaymentsPage() {
  const t = useTranslations('finance');
  const [filter, setFilter] = useState<FilterStatus>('all');

  // Fetch data
  const { data: summary, isLoading: isLoadingSummary } = useMyPaymentsSummary();
  const { data: paymentsData, isLoading: isLoadingPayments } = useMyPayments(
    0,
    50,
    filter === 'all' ? undefined : filter
  );

  const payments = paymentsData?.items || [];

  // Calculate days until next payment
  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <DashboardLayout
      title={t('payments')}
      subtitle={t('paymentsSubtitle')}
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Paid</p>
              {isLoadingSummary ? (
                <div className="h-6 w-24 bg-slate-200 rounded animate-pulse" />
              ) : (
                <p className="text-lg font-bold text-slate-800">{formatCurrency(summary?.totalPaid || 0)}</p>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-500">Overdue</p>
              {isLoadingSummary ? (
                <div className="h-6 w-24 bg-slate-200 rounded animate-pulse" />
              ) : (
                <p className="text-lg font-bold text-red-600">{formatCurrency(summary?.totalOverdue || 0)}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Next Payment Alert */}
      {summary?.nextPayment && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-blue-800">Next Payment Due</p>
                <p className="text-sm text-blue-600">
                  {new Date(summary.nextPayment.dueDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  {' '}
                  ({getDaysUntilDue(summary.nextPayment.dueDate)} days)
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-800">{formatCurrency(summary.nextPayment.amount)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Payments List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Filter */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Filter:</span>
            {(['all', 'PENDING', 'PAID', 'OVERDUE'] as FilterStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={cn(
                  'px-3 py-1 text-sm rounded-lg transition-colors',
                  filter === status
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                {status === 'all' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="divide-y divide-slate-100">
          {isLoadingPayments ? (
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
          ) : payments.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-1">No payments found</h3>
              <p className="text-sm text-slate-500">
                {filter === 'all' ? 'Your payment history is empty.' : `No ${filter.toLowerCase()} payments.`}
              </p>
            </div>
          ) : (
            payments.map((payment) => {
              const dueDate = new Date(payment.dueDate);
              const daysUntil = getDaysUntilDue(payment.dueDate);
              const isOverdue = payment.status === 'OVERDUE' || (payment.status === 'PENDING' && daysUntil < 0);

              return (
                <div key={payment.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-slate-800">
                          {dueDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </p>
                        <StatusBadge status={payment.status} />
                      </div>
                      <p className="text-sm text-slate-500">
                        {payment.status === 'PAID' && payment.paidAt
                          ? `Paid on ${new Date(payment.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                          : `Due: ${dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                        {payment.status === 'PENDING' && !isOverdue && daysUntil > 0 && (
                          <span className="ml-2 text-blue-600">({daysUntil} days left)</span>
                        )}
                        {isOverdue && payment.status !== 'PAID' && (
                          <span className="ml-2 text-red-600 font-medium">({Math.abs(daysUntil)} days overdue)</span>
                        )}
                      </p>
                      {payment.description && (
                        <p className="text-xs text-slate-400 mt-1">{payment.description}</p>
                      )}
                    </div>
                    <p className={cn(
                      'text-lg font-bold',
                      payment.status === 'PAID' ? 'text-green-600' : 
                      payment.status === 'OVERDUE' ? 'text-red-600' : 'text-slate-800'
                    )}>
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
