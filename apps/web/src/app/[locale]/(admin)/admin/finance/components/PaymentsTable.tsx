'use client';

import { useTranslations } from 'next-intl';
import { useMemo, useState, useCallback } from 'react';
import { InlineSelect } from '@/features/students/components/InlineSelect';
import type { Payment, PaymentStatus } from '@/features/finance';

interface PaymentsTableProps {
  payments: Payment[];
  isLoading: boolean;
  updatePaymentStatus: {
    mutateAsync: (params: { id: string; status: PaymentStatus }) => Promise<void>;
    isPending: boolean;
  };
  updatePaymentMethod?: {
    mutateAsync: (params: { id: string; paymentMethod: string }) => Promise<void>;
    isPending: boolean;
  };
  searchTerm?: string;
  noResultsKey?: string;
  allPaymentsSelected?: boolean;
  somePaymentsSelected?: boolean;
  selectedPaymentIds?: Set<string>;
  onSelectAllPayments?: () => void;
  onToggleSelectPayment?: (paymentId: string) => void;
}

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
  updatePaymentStatus,
  updatePaymentMethod,
  searchTerm,
  noResultsKey,
  allPaymentsSelected,
  somePaymentsSelected,
  selectedPaymentIds,
  onSelectAllPayments,
  onToggleSelectPayment,
}: PaymentsTableProps) {
  const t = useTranslations('finance');
  const [sortBy, setSortBy] = useState<string>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = useCallback((key: string) => {
    if (sortBy === key) {
      setSortOrder((order) => (order === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  }, [sortBy]);

  const sortedPayments = useMemo<Payment[]>(() => {
    const list = [...payments] as Payment[];
    if (sortBy === 'amount') {
      list.sort((a, b) => {
        const aVal = typeof a.amount === 'string' ? parseFloat(a.amount) : Number(a.amount);
        const bVal = typeof b.amount === 'string' ? parseFloat(b.amount) : Number(b.amount);
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      });
    } else if (sortBy === 'dueDate') {
      // Use same date as display (local Y/M/D) so sort order matches visible dates
      const getDueTime = (p: Payment): number => {
        const raw = p.dueDate;
        if (raw == null || raw === '') return 0;
        const d = new Date(raw);
        const t = d.getTime();
        if (Number.isNaN(t)) return 0;
        const y = d.getFullYear();
        const m = d.getMonth();
        const day = d.getDate();
        return Date.UTC(y, m, day);
      };
      list.sort((a, b) => {
        const aTime = getDueTime(a);
        const bTime = getDueTime(b);
        return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
      });
    }
    return list;
  }, [payments, sortBy, sortOrder]);

  const groupedPayments = useMemo(() => {
    const groups = new Map<
      string,
      {
        groupName: string;
        students: Map<
          string,
          {
            studentName: string;
            email: string;
            payments: Payment[];
          }
        >;
      }
    >();

    sortedPayments.forEach((payment) => {
      const groupId = payment.student?.group?.id ?? 'ungrouped';
      const groupName = payment.student?.group?.name ?? 'Ungrouped students';
      const studentId = payment.student?.id ?? payment.studentId;
      const firstName = payment.student?.user?.firstName ?? '';
      const lastName = payment.student?.user?.lastName ?? '';
      const studentName = `${firstName} ${lastName}`.trim() || 'Unknown student';
      const email = payment.student?.user?.email ?? '';

      if (!groups.has(groupId)) {
        groups.set(groupId, {
          groupName,
          students: new Map(),
        });
      }

      const group = groups.get(groupId)!;
      if (!group.students.has(studentId)) {
        group.students.set(studentId, {
          studentName,
          email,
          payments: [],
        });
      }

      group.students.get(studentId)!.payments.push(payment);
    });

    return Array.from(groups.entries())
      .map(([groupId, group]) => ({
        groupId,
        groupName: group.groupName,
        students: Array.from(group.students.entries())
          .map(([studentId, student]) => ({
            studentId,
            ...student,
          }))
          .sort((a, b) => a.studentName.localeCompare(b.studentName)),
      }))
      .sort((a, b) => a.groupName.localeCompare(b.groupName));
  }, [sortedPayments]);

  const showCheckboxes = onSelectAllPayments != null && onToggleSelectPayment != null;
  const emptyMessage =
    searchTerm && noResultsKey ? t(noResultsKey) : t('noPaymentsFound');

  const statusOptions: { id: PaymentStatus; label: string }[] = [
    { id: 'PENDING', label: t('pending') },
    { id: 'PAID', label: t('paid') },
    { id: 'OVERDUE', label: t('overdue') },
    { id: 'CANCELLED', label: t('cancelled') },
    { id: 'REFUNDED', label: t('refunded') },
  ];

  const methodOptions = [
    { id: 'CASH', label: t('methodCash') },
    { id: 'CARD', label: t('methodCard') },
    { id: 'TERMINAL', label: t('methodTerminal') },
  ];

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-12 bg-slate-100 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (groupedPayments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {showCheckboxes && (
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-slate-300 cursor-pointer"
              checked={allPaymentsSelected}
              ref={(el) => {
                if (el) el.indeterminate = Boolean(somePaymentsSelected);
              }}
              onChange={onSelectAllPayments}
              aria-label="Select all payments on current page"
            />
          )}
          <p className="text-sm text-slate-600">
            {showCheckboxes && selectedPaymentIds
              ? `${selectedPaymentIds.size} selected`
              : `${sortedPayments.length} payments`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`px-3 py-1.5 text-sm rounded-lg border ${
              sortBy === 'dueDate' ? 'border-primary text-primary' : 'border-slate-200 text-slate-600'
            }`}
            onClick={() => handleSort('dueDate')}
          >
            {t('dueDate')}
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 text-sm rounded-lg border ${
              sortBy === 'amount' ? 'border-primary text-primary' : 'border-slate-200 text-slate-600'
            }`}
            onClick={() => handleSort('amount')}
          >
            {t('amount')}
          </button>
        </div>
      </div>

      {groupedPayments.map((group) => (
        <section key={group.groupId} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-slate-800">{group.groupName}</h3>
              <span className="text-sm text-slate-500">
                {group.students.length} students
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {group.students.map((student) => (
              <div key={student.studentId} className="p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="font-medium text-slate-800">{student.studentName}</p>
                    {student.email && <p className="text-sm text-slate-500">{student.email}</p>}
                  </div>
                  <span className="text-sm text-slate-500">{student.payments.length} payments</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 border-b border-slate-100">
                        {showCheckboxes && <th className="py-2 pr-3 w-10" />}
                        <th className="py-2 pr-3">{t('dueDate')}</th>
                        <th className="py-2 pr-3">{t('amount')}</th>
                        <th className="py-2 pr-3">{t('method')}</th>
                        <th className="py-2 pr-3">{t('status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {student.payments.map((payment) => {
                        const dueDate = new Date(payment.dueDate);
                        const amount = typeof payment.amount === 'string' ? parseFloat(payment.amount) : Number(payment.amount);
                        const isPending = payment.status === 'PENDING' || payment.status === 'OVERDUE';
                        const currentMethod = payment.paymentMethod ?? '';

                        return (
                          <tr key={payment.id} className="border-b last:border-b-0 border-slate-100">
                            {showCheckboxes && (
                              <td className="py-2 pr-3">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 rounded border-slate-300 cursor-pointer"
                                  checked={Boolean(selectedPaymentIds?.has(payment.id))}
                                  onChange={() => onToggleSelectPayment?.(payment.id)}
                                  aria-label={`Select payment for ${student.studentName}`}
                                />
                              </td>
                            )}
                            <td className="py-2 pr-3 text-slate-600">
                              {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="py-2 pr-3 font-semibold text-slate-800">
                              {new Intl.NumberFormat('hy-AM', {
                                style: 'currency',
                                currency: 'AMD',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }).format(amount)}
                            </td>
                            <td className="py-2 pr-3">
                              {isPending && updatePaymentMethod ? (
                                <div className="w-32">
                                  <InlineSelect
                                    value={currentMethod || null}
                                    options={methodOptions}
                                    onChange={async (newMethod) => {
                                      if (newMethod && newMethod !== currentMethod) {
                                        await updatePaymentMethod.mutateAsync({
                                          id: payment.id,
                                          paymentMethod: newMethod,
                                        });
                                      }
                                    }}
                                    disabled={updatePaymentMethod.isPending}
                                    className="w-full"
                                  />
                                </div>
                              ) : (
                                <span className="text-slate-600">{formatMethodLabel(currentMethod, t)}</span>
                              )}
                            </td>
                            <td className="py-2 pr-3">
                              <div className="w-32">
                                <InlineSelect
                                  value={payment.status}
                                  options={statusOptions}
                                  onChange={async (newStatus) => {
                                    if (newStatus && newStatus !== payment.status) {
                                      await updatePaymentStatus.mutateAsync({
                                        id: payment.id,
                                        status: newStatus as PaymentStatus,
                                      });
                                    }
                                  }}
                                  disabled={updatePaymentStatus.isPending}
                                  className="w-full"
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

