'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslations, type useTranslations as UseTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui';
import { useMyPayments, useMyPaymentsSummary, useProcessMyPayment } from '@/features/finance';
import { cn, formatCurrency } from '@/shared/lib/utils';
import type { Payment } from '@/features/finance/api/student-finance.api';
import {
  StudentAlert,
  StudentBadge,
  StudentCard,
  StudentEmptyState,
  StudentFilterPills,
  StudentGhostButton,
  StudentPageStack,
  StudentPrimaryButton,
  StudentStatTile,
  StudentTableBody,
  StudentTableHead,
  StudentTableRow,
  StudentTableShell,
  StudentTd,
  StudentTh,
  paymentStatusVariant,
} from '@/features/student-ui';

type FilterStatus = 'all' | 'PENDING' | 'PAID' | 'OVERDUE';
type SortKey = 'month' | 'amount' | 'status' | 'dueDate';
type SortDir = 'asc' | 'desc';

const MOBILE_PAYMENTS_PAGE_SIZE = 5;

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

function PaymentStatusBadge({
  status,
  t,
  className,
}: {
  status: string;
  t: ReturnType<typeof UseTranslations<'finance'>>;
  className?: string;
}) {
  const label =
    status === 'PENDING'
      ? t('pending')
      : status === 'PAID'
        ? t('paid')
        : status === 'OVERDUE'
          ? t('overdue')
          : status === 'CANCELLED'
            ? t('cancelled')
            : status;

  return (
    <StudentBadge variant={paymentStatusVariant(status)} className={className}>
      {label}
    </StudentBadge>
  );
}

const mobileFieldLabelClass = 'text-xs font-semibold uppercase tracking-wider text-[#8b8b90]';

function PaymentMobileField({
  label,
  children,
  isLast = false,
}: {
  label: string;
  children: ReactNode;
  isLast?: boolean;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-4 py-4">
        <p className={cn('shrink-0', mobileFieldLabelClass)}>{label}</p>
        <div className="min-w-0 break-words text-right [overflow-wrap:anywhere]">{children}</div>
      </div>
      {!isLast ? <div className="border-t border-[rgba(14,14,16,0.07)]" /> : null}
    </>
  );
}

function PaymentMobileCard({
  payment,
  t,
  tCommon,
  onPay,
  isProcessing,
}: {
  payment: Payment;
  t: ReturnType<typeof UseTranslations<'finance'>>;
  tCommon: ReturnType<typeof UseTranslations<'common'>>;
  onPay: (payment: Payment) => void;
  isProcessing: boolean;
}) {
  const monthDate = payment.month ? new Date(payment.month) : new Date(payment.dueDate);
  const unpaid = payment.status === 'PENDING' || payment.status === 'OVERDUE';
  const canPay = payment.canPay === true;
  const groupName = payment.student?.group?.name;
  const description = payment.notes || payment.description;
  const windowReason = payment.paymentWindowReason;
  const monthLabel = monthDate.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });
  const dateLabel =
    payment.status === 'PAID' && payment.paidAt
      ? `${t('paidOn')} ${new Date(payment.paidAt).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}`
      : new Date(payment.dueDate).toLocaleDateString('en-GB', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

  return (
    <article className="rounded-[1.125rem] border border-[rgba(14,14,16,0.07)] bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold tracking-tight text-[#1010a3]">{monthLabel}</h3>
      {description ? <p className="mt-1.5 text-sm text-[#8b8b90]">{description}</p> : null}

      <div className="mt-2">
        <PaymentMobileField label={tCommon('group') ?? 'Group'}>
          <span className="text-base text-[#3b3b40]">{groupName ?? '—'}</span>
        </PaymentMobileField>
        <PaymentMobileField label={t('amount') ?? 'Amount'}>
          <span
            className={cn(
              'text-lg font-semibold tracking-tight',
              payment.status === 'PAID'
                ? 'text-[#0a7a3e]'
                : payment.status === 'OVERDUE'
                  ? 'text-[#b42318]'
                  : 'text-[#1010a3]',
            )}
          >
            {formatCurrency(Number(payment.amount))}
          </span>
        </PaymentMobileField>
        <PaymentMobileField label={t('status') ?? 'Status'}>
          <div className="flex justify-end">
            <PaymentStatusBadge
              status={payment.status}
              t={t}
              className="px-3 py-1 text-xs"
            />
          </div>
        </PaymentMobileField>
        <PaymentMobileField label={t('dueDate') ?? 'Due Date'} isLast>
          <div className="text-right">
            <span className="text-base font-medium text-[#1010a3]">{dateLabel}</span>
            {unpaid && !canPay && windowReason === 'past' && (
              <p className="mt-1.5 text-sm text-[#8b4a00]" role="status">
                {t('paymentPeriodEnded')}
              </p>
            )}
            {unpaid && !canPay && windowReason === 'future' && (
              <p className="mt-1.5 text-sm text-[#8b8b90]" role="status">
                {t('paymentNotYetAvailable', { month: monthLabel })}
              </p>
            )}
          </div>
        </PaymentMobileField>
      </div>

      {unpaid ? (
        <StudentPrimaryButton
          type="button"
          onClick={() => canPay && onPay(payment)}
          disabled={!canPay || isProcessing}
          className="mt-6 min-h-12 w-full text-base"
          title={
            !canPay && windowReason === 'past'
              ? t('paymentPeriodEnded')
              : !canPay && windowReason === 'future'
                ? t('paymentNotYetAvailable', { month: monthLabel })
                : undefined
          }
        >
          {t('pay')}
        </StudentPrimaryButton>
      ) : (
        <p className="mt-6 text-center text-base font-semibold text-[#0a7a3e]">{t('paid')}</p>
      )}
    </article>
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
  const [mobilePage, setMobilePage] = useState(0);
  const mobilePaymentsStartRef = useRef<HTMLDivElement | null>(null);

  const { data: summary, isLoading: isLoadingSummary, isFetching: isFetchingSummary } =
    useMyPaymentsSummary();
  const { data: paymentsData, isLoading: isLoadingPayments, isFetching: isFetchingPayments } =
    useMyPayments(0, 50, filter === 'all' ? undefined : filter);
  const showSummaryReady = !isLoadingSummary && !isFetchingSummary;
  const showPaymentsReady = !isLoadingPayments && !isFetchingPayments;
  const processPaymentMutation = useProcessMyPayment();

  const payments = useMemo(() => {
    const deduped = onePaymentPerMonth(paymentsData?.items ?? []);
    return sortPayments(deduped, sortKey, sortDir);
  }, [paymentsData?.items, sortKey, sortDir]);

  const totalMobilePages = Math.max(1, Math.ceil(payments.length / MOBILE_PAYMENTS_PAGE_SIZE));
  const safeMobilePage = Math.min(Math.max(0, mobilePage), totalMobilePages - 1);

  const mobilePayments = useMemo(
    () =>
      payments.slice(
        safeMobilePage * MOBILE_PAYMENTS_PAGE_SIZE,
        safeMobilePage * MOBILE_PAYMENTS_PAGE_SIZE + MOBILE_PAYMENTS_PAGE_SIZE,
      ),
    [payments, safeMobilePage],
  );

  useEffect(() => {
    setMobilePage(0);
  }, [filter, payments.length]);

  const goToMobilePage = (nextPage: number) => {
    setMobilePage(nextPage);
    requestAnimationFrame(() => {
      mobilePaymentsStartRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

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
      { paymentId: processModal.id, data: { paymentMethod } },
      {
        onSuccess: () => {
          setSuccessMessage(t('paymentSuccess'));
          setTimeout(() => {
            setProcessModal(null);
            setSuccessMessage(null);
            setConfirmStep(false);
          }, 1500);
        },
      },
    );
  };

  const filterOptions: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: t('all') },
    { value: 'PENDING', label: t('pending') },
    { value: 'PAID', label: t('paid') },
    { value: 'OVERDUE', label: t('overdue') },
  ];

  return (
    <DashboardLayout title={t('payments')} subtitle={t('paymentsSubtitle')}>
      <StudentPageStack>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StudentStatTile
            label={t('totalPaid')}
            value={formatCurrency(summary?.totalPaid || 0)}
            isLoading={!showSummaryReady}
            tone="lime"
            icon={
              <svg className="h-5 w-5 text-[#1010a3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            }
          />
          <StudentStatTile
            label={t('pending')}
            value={formatCurrency(summary?.totalPending || 0)}
            isLoading={!showSummaryReady}
            tone="amber"
            icon={
              <svg className="h-5 w-5 text-[#8b4a00]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StudentStatTile
            label={t('overdue')}
            value={formatCurrency(summary?.totalOverdue || 0)}
            isLoading={!showSummaryReady}
            tone="rose"
            valueClassName="text-[#b42318]"
            icon={
              <svg className="h-5 w-5 text-[#b42318]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />
        </div>

        {showSummaryReady && summary?.nextPayment && (
          <StudentAlert variant="info" title={t('nextPaymentDue')}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm">
                {new Date(summary.nextPayment.dueDate).toLocaleDateString('en-GB', {
                  month: 'long',
                  year: 'numeric',
                })}
                {' — '}
                {t('paymentOnlyInMonth')}
              </span>
              <span className="text-2xl font-bold">{formatCurrency(summary.nextPayment.amount)}</span>
            </div>
          </StudentAlert>
        )}

        <StudentCard
          noPadding
          className="rounded-none border-0 bg-transparent p-0 sm:rounded-none md:rounded-3xl md:border md:border-[rgba(14,14,16,0.07)] md:bg-white"
        >
          <div className="border-b border-[rgba(14,14,16,0.07)] pb-4 md:p-4 md:pb-4 lg:p-5">
            <StudentFilterPills
              options={filterOptions}
              value={filter}
              onChange={setFilter}
              shape="rectangular"
              size="md"
              className="w-full"
            />
          </div>

          {!showPaymentsReady ? (
            <div className="space-y-4 pt-4 md:p-4 md:pt-4 lg:p-5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse rounded-[1.125rem] bg-[#f6f6f7] md:h-14"
                />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="pt-4 md:pt-0">
              <StudentEmptyState
                title={t('noPaymentsFound')}
                message={
                  filter === 'all'
                    ? t('paymentHistoryEmpty')
                    : t('noStatusPayments', { status: filter.toLowerCase() })
                }
              />
            </div>
          ) : (
            <>
              <div ref={mobilePaymentsStartRef} className="md:hidden" />
              <div className="space-y-4 pt-4 md:hidden">
                {mobilePayments.map((payment) => (
                  <PaymentMobileCard
                    key={payment.id}
                    payment={payment}
                    t={t}
                    tCommon={tCommon}
                    onPay={openPayModal}
                    isProcessing={processPaymentMutation.isPending}
                  />
                ))}
              </div>
              {payments.length > MOBILE_PAYMENTS_PAGE_SIZE && (
                <div className="flex items-center justify-between pt-2 pb-2 text-sm text-[#8b8b90] md:hidden">
                  <span>
                    {safeMobilePage * MOBILE_PAYMENTS_PAGE_SIZE + 1}-
                    {Math.min((safeMobilePage + 1) * MOBILE_PAYMENTS_PAGE_SIZE, payments.length)} /{' '}
                    {payments.length}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className={cn(
                        'inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors focus:outline-none focus-visible:outline-none focus-visible:ring-0',
                        safeMobilePage === 0
                          ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
                          : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]',
                      )}
                      disabled={safeMobilePage === 0}
                      onClick={() => goToMobilePage(Math.max(0, safeMobilePage - 1))}
                      aria-label={tCommon('back')}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-[#1010a3] px-3 text-xs font-semibold text-white">
                      {safeMobilePage + 1}
                    </span>
                    <button
                      type="button"
                      className={cn(
                        'inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors focus:outline-none focus-visible:outline-none focus-visible:ring-0',
                        safeMobilePage >= totalMobilePages - 1
                          ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
                          : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]',
                      )}
                      disabled={safeMobilePage >= totalMobilePages - 1}
                      onClick={() => goToMobilePage(Math.min(totalMobilePages - 1, safeMobilePage + 1))}
                      aria-label={tCommon('next')}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              <StudentTableShell className="hidden p-0 md:block">
                <StudentTableHead>
                  <tr>
                    <StudentTh>
                      <button type="button" onClick={() => handleSort('month')} className="hover:text-[#1010a3]">
                        {t('month') ?? 'Month'}
                        {sortIndicator('month')}
                      </button>
                    </StudentTh>
                    <StudentTh className="text-center">{tCommon('group') ?? 'Group'}</StudentTh>
                    <StudentTh className="text-center">
                      <button
                        type="button"
                        onClick={() => handleSort('amount')}
                        className="inline-flex items-center justify-center hover:text-[#1010a3]"
                      >
                        {t('amount') ?? 'Amount'}
                        {sortIndicator('amount')}
                      </button>
                    </StudentTh>
                    <StudentTh className="text-center">
                      <button
                        type="button"
                        onClick={() => handleSort('status')}
                        className="inline-flex w-full items-center justify-center hover:text-[#1010a3]"
                      >
                        {t('status') ?? 'Status'}
                        {sortIndicator('status')}
                      </button>
                    </StudentTh>
                    <StudentTh className="text-center">
                      <button
                        type="button"
                        onClick={() => handleSort('dueDate')}
                        className="inline-flex items-center justify-center hover:text-[#1010a3]"
                      >
                        {t('dueDate') ?? 'Due / Paid'}
                        {sortIndicator('dueDate')}
                      </button>
                    </StudentTh>
                    <StudentTh className="text-right">{tCommon('action') ?? 'Action'}</StudentTh>
                  </tr>
                </StudentTableHead>
                <StudentTableBody>
                  {payments.map((payment) => {
                    const monthDate = payment.month ? new Date(payment.month) : new Date(payment.dueDate);
                    const unpaid = payment.status === 'PENDING' || payment.status === 'OVERDUE';
                    const canPay = payment.canPay === true;
                    const groupName = payment.student?.group?.name;
                    const description = payment.notes || payment.description;
                    const windowReason = payment.paymentWindowReason;
                    const monthLabel = monthDate.toLocaleDateString('en-GB', {
                      month: 'long',
                      year: 'numeric',
                    });
                    const dateLabel =
                      payment.status === 'PAID' && payment.paidAt
                        ? `${t('paidOn')} ${new Date(payment.paidAt).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}`
                        : new Date(payment.dueDate).toLocaleDateString('en-GB', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          });

                    return (
                      <StudentTableRow key={payment.id}>
                        <StudentTd>
                          <p className="font-semibold text-[#1010a3]">{monthLabel}</p>
                          {description ? (
                            <p className="mt-0.5 text-xs text-[#8b8b90]">{description}</p>
                          ) : null}
                        </StudentTd>
                        <StudentTd className="text-center">
                          <span className="text-[#3b3b40]">{groupName ?? '—'}</span>
                        </StudentTd>
                        <StudentTd
                          className={cn(
                            'text-center font-semibold',
                            payment.status === 'PAID'
                              ? 'text-[#0a7a3e]'
                              : payment.status === 'OVERDUE'
                                ? 'text-[#b42318]'
                                : 'text-[#1010a3]',
                          )}
                        >
                          {formatCurrency(Number(payment.amount))}
                        </StudentTd>
                        <StudentTd className="align-middle text-center">
                          <div className="flex justify-center">
                            <PaymentStatusBadge status={payment.status} t={t} />
                          </div>
                        </StudentTd>
                        <StudentTd className="text-center">
                          <span className="text-[#8b8b90]">{dateLabel}</span>
                          {unpaid && !canPay && windowReason === 'past' && (
                            <p className="mt-1 text-xs text-[#8b4a00]" role="status">
                              {t('paymentPeriodEnded')}
                            </p>
                          )}
                          {unpaid && !canPay && windowReason === 'future' && (
                            <p className="mt-1 text-xs text-[#8b8b90]" role="status">
                              {t('paymentNotYetAvailable', { month: monthLabel })}
                            </p>
                          )}
                        </StudentTd>
                        <StudentTd className="text-right">
                          {unpaid ? (
                            <StudentPrimaryButton
                              type="button"
                              onClick={() => canPay && openPayModal(payment)}
                              disabled={!canPay || processPaymentMutation.isPending}
                              className="min-h-9 px-4 text-xs"
                              title={
                                !canPay && windowReason === 'past'
                                  ? t('paymentPeriodEnded')
                                  : !canPay && windowReason === 'future'
                                    ? t('paymentNotYetAvailable', { month: monthLabel })
                                    : undefined
                              }
                            >
                              {t('pay')}
                            </StudentPrimaryButton>
                          ) : (
                            <span className="text-sm font-semibold text-[#0a7a3e]">{t('paid')}</span>
                          )}
                        </StudentTd>
                      </StudentTableRow>
                    );
                  })}
                </StudentTableBody>
              </StudentTableShell>
            </>
          )}
        </StudentCard>
      </StudentPageStack>

      <Dialog open={!!processModal} onOpenChange={(open) => !open && setProcessModal(null)}>
        <DialogContent
          variant="portal"
          className="border-[rgba(14,14,16,0.07)] lg:max-w-md lg:rounded-3xl"
          aria-describedby={undefined}
        >
          <DialogHeader className="hidden lg:flex">
            <DialogTitle className="text-xl font-semibold text-[#1010a3]">{t('pay')}</DialogTitle>
            <DialogDescription className="sr-only">{t('paymentMethod')}</DialogDescription>
          </DialogHeader>
          {processModal && (
            <>
              {successMessage ? (
                <div className="py-4 text-center">
                  <p className="font-medium text-[#0a7a3e]">{successMessage}</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 lg:hidden">
                    <h2 className="text-xl font-semibold text-[#1010a3]">{t('pay')}</h2>
                  </div>
                  <p className="mb-[50px] lg:mb-4 text-sm font-medium text-[#1010a3]">
                    {(processModal.month ? new Date(processModal.month) : new Date(processModal.dueDate)).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                    {' — '}
                    {formatCurrency(Number(processModal.amount))}
                  </p>
                  {!confirmStep ? (
                    <>
                      <Label className="mb-4 block text-[#3b3b40]">{t('paymentMethod')}</Label>
                      <div className="mb-3 lg:mb-4 grid grid-cols-3 gap-3 sm:grid-cols-3">
                        {(['cash', 'card', 'idram'] as const).map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setPaymentMethod(method)}
                            className={cn(
                              'min-h-12 rounded-[0.875rem] border-2 px-2 py-3.5 text-sm font-bold transition-colors lg:min-h-11 lg:px-4 lg:py-3 lg:text-base',
                              paymentMethod === method
                                ? 'border-[#1010a3] bg-[#d9d9f4] text-[#1010a3]'
                                : 'border-[rgba(14,14,16,0.07)] text-[#3b3b40] hover:bg-[#f6f6f7]',
                            )}
                          >
                            {method === 'cash'
                              ? t('methodCash')
                              : method === 'card'
                                ? t('methodCard')
                                : t('methodIdram')}
                          </button>
                        ))}
                      </div>
                      <DialogFooter className="max-lg:flex-row max-lg:justify-end max-lg:pt-4 gap-3 sm:gap-0">
                        <StudentGhostButton
                          type="button"
                          onClick={() => setProcessModal(null)}
                          className="min-h-12 px-6 text-base font-semibold lg:min-h-10 lg:px-4 lg:text-sm lg:font-medium"
                        >
                          {tCommon('cancel')}
                        </StudentGhostButton>
                        <StudentPrimaryButton
                          type="button"
                          onClick={() => setConfirmStep(true)}
                          className="min-h-12 px-6 text-base lg:min-h-10 lg:px-5 lg:text-sm"
                        >
                          {tCommon('next')}
                        </StudentPrimaryButton>
                      </DialogFooter>
                    </>
                  ) : (
                    <>
                      <p className="mb-3 lg:mb-4 text-sm text-[#8b8b90]">
                        {t('payConfirm', {
                          amount: formatCurrency(Number(processModal.amount)),
                          method:
                            paymentMethod === 'cash'
                              ? t('methodCash')
                              : paymentMethod === 'card'
                                ? t('methodCard')
                                : t('methodIdram'),
                        })}
                      </p>
                      <DialogFooter className="max-lg:flex-row max-lg:justify-end max-lg:pt-4 gap-3 sm:gap-0">
                        <StudentGhostButton
                          type="button"
                          onClick={() => setConfirmStep(false)}
                          className="min-h-12 px-6 text-base font-semibold lg:min-h-10 lg:px-4 lg:text-sm lg:font-medium"
                        >
                          {tCommon('back')}
                        </StudentGhostButton>
                        <StudentPrimaryButton
                          type="button"
                          onClick={handleConfirmPayment}
                          disabled={processPaymentMutation.isPending}
                          className="min-h-12 px-6 text-base lg:min-h-10 lg:px-5 lg:text-sm"
                        >
                          {processPaymentMutation.isPending ? tCommon('loading') : tCommon('confirm')}
                        </StudentPrimaryButton>
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
