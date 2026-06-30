'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import { useMyPayments, useMyPaymentsSummary, useProcessMyPayment } from '@/features/finance';
import { cn, formatCurrency } from '@/shared/lib/utils';
import type { Payment } from '@/features/finance/api/student-finance.api';
import {
  StudentAlert,
  StudentCard,
  StudentEmptyState,
  StudentFilterPills,
  StudentPageStack,
  StudentPrimaryButton,
  StudentStatTile,
  StudentTableBody,
  StudentTableHead,
  StudentTableRow,
  StudentTableShell,
  StudentTd,
  StudentTh,
} from '@/features/student-ui';
import { PaymentMobileCard } from './PaymentMobileCard';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { StudentPaymentPayModal } from './StudentPaymentPayModal';
import {
  MOBILE_PAYMENTS_PAGE_SIZE,
  onePaymentPerMonth,
  sortPayments,
  type FilterStatus,
  type SortDir,
  type SortKey,
} from './student-payments.utils';

export function StudentPaymentsPage() {
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

  const isPayModalOpen = !!processModal;

  const requestClosePayModal = useCallback(() => {
    setProcessModal(null);
    setConfirmStep(false);
    setSuccessMessage(null);
  }, []);

  const { dragStyle, dragHandleProps, scrollContentProps, resetDrag } = usePortalSheetDrag({
    enabled: true,
    onClose: requestClosePayModal,
  });

  useEffect(() => {
    if (!isPayModalOpen) {
      resetDrag();
    }
  }, [isPayModalOpen, resetDrag]);

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

      <StudentPaymentPayModal
        isOpen={isPayModalOpen}
        onClose={requestClosePayModal}
        processModal={processModal}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        confirmStep={confirmStep}
        onConfirmStepChange={setConfirmStep}
        successMessage={successMessage}
        onConfirmPayment={handleConfirmPayment}
        isPending={processPaymentMutation.isPending}
        dragStyle={dragStyle}
        dragHandleProps={dragHandleProps}
        scrollContentProps={scrollContentProps}
      />
    </DashboardLayout>
  );
}
