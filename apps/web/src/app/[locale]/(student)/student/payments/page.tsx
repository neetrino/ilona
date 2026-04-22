'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog';
import { Button, Label } from '@/shared/components/ui';
import { useMyPayments, useMyPaymentsSummary, useProcessMyPayment } from '@/features/finance';
import { cn, formatCurrency } from '@/shared/lib/utils';
import type { Payment } from '@/features/finance/api/student-finance.api';

type FilterStatus = 'all' | 'PENDING' | 'PAID' | 'OVERDUE';
type SortKey = 'month' | 'amount' | 'status' | 'dueDate';
type SortDir = 'asc' | 'desc';

/** Ensure exactly one payment per calendar month for deterministic display (backend already groups; this is a safeguard). */
function onePaymentPerMonth(items: Payment[]): Payment[] {
  const byMonth = new Map<string, Payment>();
  for (const p of items) {
    const d = p.month ? new Date(p.month) : new Date(p.dueDate);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!byMonth.has(key)) byMonth.set(key, p);
  }
  return Array.from(byMonth.values());
}

const STATUS_ORDER: Record<string, number> = {
  OVERDUE: 0,
  PENDING: 1,
  PAID: 2,
  CANCELLED: 3,
};

function sortPayments(items: Payment[], key: SortKey, dir: SortDir): Payment[] {
  const factor = dir === 'asc' ? 1 : -1;
  const getMonthTs = (p: Payment) =>
    p.month ? new Date(p.month).getTime() : new Date(p.dueDate).getTime();
  const getDueTs = (p: Payment) => new Date(p.dueDate).getTime();

  const compare = (a: Payment, b: Payment): number => {
    switch (key) {
      case 'amount':
        return (Number(a.amount) - Number(b.amount)) * factor;
      case 'status':
        return ((STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)) * factor;
      case 'dueDate':
        return (getDueTs(a) - getDueTs(b)) * factor;
      case 'month':
      default:
        return (getMonthTs(a) - getMonthTs(b)) * factor;
    }
  };
  return [...items].sort(compare);
}

function StatusBadge({ status, t }: { status: string; t: (key: string) => string }) {
  const styles: Record<string, { bg: string; text: string }> = {
    PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    PAID: { bg: 'bg-green-100', text: 'text-green-700' },
    OVERDUE: { bg: 'bg-red-100', text: 'text-red-700' },
    CANCELLED: { bg: 'bg-slate-100', text: 'text-slate-700' },
  };

  const style = styles[status] || { bg: 'bg-slate-100', text: 'text-slate-700' };
  const label = status === 'PENDING' ? t('pending') :
                status === 'PAID' ? t('paid') :
                status === 'OVERDUE' ? t('overdue') :
                status === 'CANCELLED' ? t('cancelled') : status;

  return (
    <span className={cn('px-2 py-1 text-xs font-medium rounded-full', style.bg, style.text)}>
      {label}
    </span>
  );
}

export default function StudentPaymentsPage() {
  const t = useTranslations('finance');
  const tCommon = useTranslations('common');
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [sortKey, setSortKey] = useState<SortKey>('month');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [processModal, setProcessModal] = useState<Payment | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'idram'>('card');
  const [confirmStep, setConfirmStep] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: summary, isLoading: isLoadingSummary, isFetching: isFetchingSummary } = useMyPaymentsSummary();
  const { data: paymentsData, isLoading: isLoadingPayments, isFetching: isFetchingPayments } = useMyPayments(
    0,
    50,
    filter === 'all' ? undefined : filter
  );
  const showSummaryReady = !isLoadingSummary && !isFetchingSummary;
  const showPaymentsReady = !isLoadingPayments && !isFetchingPayments;
  const processPaymentMutation = useProcessMyPayment();

  const payments = useMemo(() => {
    const deduped = onePaymentPerMonth(paymentsData?.items ?? []);
    return sortPayments(deduped, sortKey, sortDir);
  }, [paymentsData?.items, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDir(key === 'month' || key === 'dueDate' ? 'desc' : 'asc');
  };

  const sortIndicator = (key: SortKey): string => {
    if (key !== sortKey) return '';
    return sortDir === 'asc' ? ' ▲' : ' ▼';
  };

  const openPayModal = (payment: Payment) => {
    setProcessModal(payment);
    setConfirmStep(false);
    setSuccessMessage(null);
    setPaymentMethod('card');
  };

  const handleConfirmPayment = () => {
    if (!processModal) return;
    processPaymentMutation.mutate(
      {
        paymentId: processModal.id,
        data: { paymentMethod },
      },
      {
        onSuccess: () => {
          setSuccessMessage(t('paymentSuccess'));
          setTimeout(() => {
            setProcessModal(null);
            setSuccessMessage(null);
            setConfirmStep(false);
          }, 1500);
        },
      }
    );
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
              <p className="text-sm text-slate-500">{t('totalPaid')}</p>
              {!showSummaryReady ? (
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
              <p className="text-sm text-slate-500">{t('pending')}</p>
              {!showSummaryReady ? (
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
              <p className="text-sm text-slate-500">{t('overdue')}</p>
              {!showSummaryReady ? (
                <div className="h-6 w-24 bg-slate-200 rounded animate-pulse" />
              ) : (
                <p className="text-lg font-bold text-red-600">{formatCurrency(summary?.totalOverdue || 0)}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Next Payment Alert - only show when summary is fresh to avoid wrong amount */}
      {showSummaryReady && summary?.nextPayment && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-blue-800">{t('nextPaymentDue')}</p>
                <p className="text-sm text-blue-600">
                  {new Date(summary.nextPayment.dueDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  {' — '}
                  {t('paymentOnlyInMonth')}
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
            <span className="text-sm text-slate-500">{t('filter')}:</span>
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
                {status === 'all' ? t('all') : 
                 status === 'PENDING' ? t('pending') :
                 status === 'PAID' ? t('paid') :
                 status === 'OVERDUE' ? t('overdue') : status}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {!showPaymentsReady ? (
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
            <h3 className="text-lg font-semibold text-slate-800 mb-1">{t('noPaymentsFound')}</h3>
            <p className="text-sm text-slate-500">
              {filter === 'all' ? t('paymentHistoryEmpty') : t('noStatusPayments', { status: filter.toLowerCase() })}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">
                    <button type="button" onClick={() => handleSort('month')} className="hover:text-slate-700">
                      {t('month') ?? 'Month'}{sortIndicator('month')}
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium">{tCommon('group') ?? 'Group'}</th>
                  <th className="px-4 py-3 font-medium">
                    <button type="button" onClick={() => handleSort('amount')} className="hover:text-slate-700">
                      {t('amount') ?? 'Amount'}{sortIndicator('amount')}
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium">
                    <button type="button" onClick={() => handleSort('status')} className="hover:text-slate-700">
                      {t('status') ?? 'Status'}{sortIndicator('status')}
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium">
                    <button type="button" onClick={() => handleSort('dueDate')} className="hover:text-slate-700">
                      {t('dueDate') ?? 'Due / Paid'}{sortIndicator('dueDate')}
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium text-right">{tCommon('action') ?? 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((payment) => {
                  const monthDate = payment.month ? new Date(payment.month) : new Date(payment.dueDate);
                  const unpaid = payment.status === 'PENDING' || payment.status === 'OVERDUE';
                  const canPay = payment.canPay === true;
                  const groupName = payment.student?.group?.name;
                  const description = payment.notes || payment.description;
                  const windowReason = payment.paymentWindowReason;
                  const monthLabel = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                  const dateLabel = payment.status === 'PAID' && payment.paidAt
                    ? `${t('paidOn')} ${new Date(payment.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : new Date(payment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                  return (
                    <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 align-top">
                        <p className="font-semibold text-slate-800">{monthLabel}</p>
                        {description && (
                          <p className="mt-0.5 text-xs text-slate-400">{description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-slate-600">{groupName ?? '—'}</td>
                      <td className={cn(
                        'px-4 py-3 align-top font-semibold',
                        payment.status === 'PAID' ? 'text-green-600' :
                        payment.status === 'OVERDUE' ? 'text-red-600' : 'text-slate-800',
                      )}>
                        {formatCurrency(Number(payment.amount))}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <StatusBadge status={payment.status} t={t} />
                      </td>
                      <td className="px-4 py-3 align-top text-slate-500">
                        {dateLabel}
                        {unpaid && !canPay && windowReason === 'past' && (
                          <p className="text-xs text-amber-700 mt-1" role="status">
                            {t('paymentPeriodEnded')}
                          </p>
                        )}
                        {unpaid && !canPay && windowReason === 'future' && (
                          <p className="text-xs text-slate-500 mt-1" role="status">
                            {t('paymentNotYetAvailable', { month: monthLabel })}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-right">
                        {unpaid ? (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => canPay && openPayModal(payment)}
                            disabled={!canPay || processPaymentMutation.isPending}
                            title={!canPay && windowReason === 'past' ? t('paymentPeriodEnded') : !canPay && windowReason === 'future' ? t('paymentNotYetAvailable', { month: monthLabel }) : undefined}
                          >
                            {t('pay')}
                          </Button>
                        ) : (
                          <span className="text-sm text-green-600 font-medium">{t('paid')}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pay – method picker + confirm dialog */}
      <Dialog open={!!processModal} onOpenChange={(open) => !open && setProcessModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('pay')}</DialogTitle>
            <DialogDescription className="sr-only">
              {t('paymentMethod')}
            </DialogDescription>
          </DialogHeader>
          {processModal && (
            <>
              {successMessage ? (
                <div className="py-4 text-center">
                  <p className="text-green-600 font-medium">{successMessage}</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-600 mb-4">
                    {(processModal.month ? new Date(processModal.month) : new Date(processModal.dueDate)).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} — {formatCurrency(Number(processModal.amount))}
                  </p>
                  {!confirmStep ? (
                    <>
                      <Label className="mb-2 block">{t('paymentMethod')}</Label>
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {(['cash', 'card', 'idram'] as const).map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setPaymentMethod(method)}
                            className={cn(
                              'py-3 px-3 rounded-lg border-2 text-sm font-medium transition-colors',
                              paymentMethod === method
                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                : 'border-slate-200 hover:border-slate-300 text-slate-700'
                            )}
                          >
                            {method === 'cash' ? t('methodCash') : method === 'card' ? t('methodCard') : t('methodIdram')}
                          </button>
                        ))}
                      </div>
                      <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setProcessModal(null)}>
                          {tCommon('cancel')}
                        </Button>
                        <Button onClick={() => setConfirmStep(true)}>
                          {tCommon('next')}
                        </Button>
                      </DialogFooter>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-slate-600 mb-4">
                        {t('payConfirm', {
                          amount: formatCurrency(Number(processModal.amount)),
                          method: paymentMethod === 'cash' ? t('methodCash') : paymentMethod === 'card' ? t('methodCard') : t('methodIdram'),
                        })}
                      </p>
                      <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setConfirmStep(false)}>
                          {tCommon('back')}
                        </Button>
                        <Button
                          onClick={handleConfirmPayment}
                          disabled={processPaymentMutation.isPending}
                        >
                          {processPaymentMutation.isPending ? tCommon('loading') : tCommon('confirm')}
                        </Button>
                      </DialogFooter>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
