'use client';

import { useTranslations } from 'next-intl';
import { DataTable } from '@/shared/components/ui';
import { getPaymentColumns } from '../utils/tableColumns';
import { InlineSelect } from '@/features/students/components/InlineSelect';
import { formatCurrency } from '@/shared/lib/utils';
import type { Payment, PaymentStatus } from '@/features/finance';

interface PaymentsTableProps {
  payments: Payment[];
  isLoading: boolean;
  allPaymentsSelected: boolean;
  somePaymentsSelected: boolean;
  selectedPaymentIds: Set<string>;
  updatePaymentStatus: {
    mutateAsync: (params: { id: string; status: PaymentStatus }) => Promise<void>;
    isPending: boolean;
  };
  updatePaymentMethod?: {
    mutateAsync: (params: { id: string; paymentMethod: string }) => Promise<void>;
    isPending: boolean;
  };
  onSelectAllPayments: () => void;
  onToggleSelectPayment: (paymentId: string) => void;
  searchTerm?: string;
  noResultsKey?: string;
}

const METHOD_OPTIONS = [
  { id: 'CASH', labelKey: 'methodCash' },
  { id: 'CARD', labelKey: 'methodCard' },
  { id: 'TERMINAL', labelKey: 'methodTerminal' },
] as const;

const STATUS_OPTIONS: Array<{ id: PaymentStatus; labelKey: string }> = [
  { id: 'PENDING', labelKey: 'pending' },
  { id: 'PAID', labelKey: 'paid' },
  { id: 'OVERDUE', labelKey: 'overdue' },
  { id: 'CANCELLED', labelKey: 'cancelled' },
  { id: 'REFUNDED', labelKey: 'refunded' },
];

function formatMethodLabel(method: string | null | undefined, t: (key: string) => string): string {
  if (!method) return '—';
  const upper = method.toUpperCase();
  if (upper === 'CASH') return t('methodCash');
  if (upper === 'CARD') return t('methodCard');
  if (upper === 'IDRAM') return t('methodIdram');
  if (upper === 'TERMINAL') return t('methodTerminal');
  return method;
}

export function PaymentsTable({
  payments,
  isLoading,
  allPaymentsSelected,
  somePaymentsSelected,
  selectedPaymentIds,
  updatePaymentStatus,
  updatePaymentMethod,
  onSelectAllPayments,
  onToggleSelectPayment,
  searchTerm,
  noResultsKey,
}: PaymentsTableProps) {
  const t = useTranslations('finance');
  const columns = getPaymentColumns({
    t: t as (key: string) => string,
    allPaymentsSelected,
    somePaymentsSelected,
    isLoadingPayments: isLoading,
    selectedPaymentIds,
    updatePaymentStatus,
    updatePaymentMethod,
    onSelectAllPayments,
    onToggleSelectPayment,
  });
  const emptyMessage =
    searchTerm && noResultsKey ? t(noResultsKey) : t('noPaymentsFound');

  const statusBadgeClass = (status: PaymentStatus) => {
    if (status === 'PAID') return 'border-emerald-300 bg-emerald-50 text-emerald-700';
    if (status === 'OVERDUE') return 'border-red-300 bg-red-50 text-red-700';
    if (status === 'PENDING') return 'border-amber-300 bg-amber-50 text-amber-700';
    return 'border-slate-300 bg-slate-100 text-slate-600';
  };

  return (
    <>
      <div className="space-y-3 sm:hidden">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={`payments-mobile-skeleton-${idx}`}
              className="rounded-2xl border border-[rgba(14,14,16,0.08)] bg-white p-4"
            >
              <div className="h-5 w-40 animate-pulse rounded bg-[#f6f6f7]" />
              <div className="mt-3 h-4 w-32 animate-pulse rounded bg-[#f6f6f7]" />
              <div className="mt-2 h-4 w-24 animate-pulse rounded bg-[#f6f6f7]" />
            </div>
          ))
        ) : payments.length === 0 ? (
          <div className="rounded-2xl border border-[rgba(14,14,16,0.08)] bg-white px-4 py-10 text-center text-sm text-[#8b8b90]">
            {emptyMessage}
          </div>
        ) : (
          payments.map((payment) => {
            const firstName = payment.student?.user?.firstName || '';
            const lastName = payment.student?.user?.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim();
            const initials = `${firstName[0] || ''}${lastName[0] || ''}` || '?';
            const amount =
              typeof payment.amount === 'string'
                ? parseFloat(payment.amount)
                : Number(payment.amount);
            const dueDate = new Date(payment.dueDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const canEditMethod =
              updatePaymentMethod != null &&
              (payment.status === 'PENDING' || payment.status === 'OVERDUE');
            return (
              <article
                key={`payment-mobile-${payment.id}`}
                className="rounded-2xl border border-[rgba(14,14,16,0.08)] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(14,14,16,0.03)]"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="my-auto h-5 w-5 rounded border-[rgba(14,14,16,0.2)] accent-[#1010a3] text-[#1010a3]"
                    checked={selectedPaymentIds.has(payment.id)}
                    onChange={() => onToggleSelectPayment(payment.id)}
                    aria-label={`Select payment for ${fullName}`}
                  />
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f1f1f2] text-base font-semibold text-[#3b3b40]">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[1.1rem] font-semibold leading-tight text-[#1f2937]">
                      {fullName || payment.student?.user?.email || '—'}
                    </p>
                    <p className="truncate text-[0.95rem] text-[#64748b]">
                      {payment.student?.user?.email || '—'}
                    </p>
                  </div>
                </div>

                <div className="my-3 border-t border-[rgba(14,14,16,0.08)]" />

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-3 text-[1rem]">
                    <span className="text-[#64748b]">{t('amount')}</span>
                    <span className="font-semibold text-[#1f2937]">{formatCurrency(amount)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-[1rem]">
                    <span className="text-[#64748b]">{t('dueDate')}</span>
                    <span className="font-semibold text-[#1f2937]">{dueDate}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-[1rem]">
                    <span className="text-[#64748b]">{t('method')}</span>
                    <div className="min-w-[9rem] max-w-[11rem]">
                      {canEditMethod ? (
                        <InlineSelect
                          value={payment.paymentMethod ?? null}
                          options={METHOD_OPTIONS.map((o) => ({ id: o.id, label: t(o.labelKey) }))}
                          onChange={async (nextMethod) => {
                            if (nextMethod && nextMethod !== payment.paymentMethod) {
                              try {
                                await updatePaymentMethod?.mutateAsync({
                                  id: payment.id,
                                  paymentMethod: nextMethod,
                                });
                              } catch (error) {
                                console.error('Failed to update payment method:', error);
                              }
                            }
                          }}
                          disabled={updatePaymentMethod?.isPending}
                          className="w-full"
                        />
                      ) : (
                        <span className="inline-flex min-h-8 items-center rounded-xl border border-[rgba(14,14,16,0.1)] px-2.5 text-sm text-[#475569]">
                          {formatMethodLabel(payment.paymentMethod, t as (key: string) => string)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-[1rem]">
                    <span className="text-[#64748b]">{t('status')}</span>
                    <span
                      className={`inline-flex items-center rounded-xl border px-3 py-1 text-sm font-medium ${statusBadgeClass(payment.status)}`}
                    >
                      {t(
                        STATUS_OPTIONS.find((option) => option.id === payment.status)?.labelKey ?? 'pending',
                      )}
                    </span>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="hidden sm:block">
        <DataTable
          columns={columns}
          data={payments}
          keyExtractor={(payment) => payment.id}
          isLoading={isLoading}
          emptyMessage={emptyMessage}
        />
      </div>
    </>
  );
}
