'use client';

import { useTranslations } from 'next-intl';
import { useMemo, useState, useCallback } from 'react';
import { DataTable } from '@/shared/components/ui';
import { getPaymentColumns } from '../utils/tableColumns';
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

  const sortedPayments = useMemo(() => {
    const list = [...payments];
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

  const columns = getPaymentColumns({
    t,
    updatePaymentStatus,
    updatePaymentMethod,
    allPaymentsSelected,
    somePaymentsSelected,
    selectedPaymentIds,
    onSelectAllPayments,
    onToggleSelectPayment,
    isLoadingPayments: isLoading,
  });
  const emptyMessage =
    searchTerm && noResultsKey ? t(noResultsKey) : t('noPaymentsFound');

  return (
    <DataTable
      columns={columns}
      data={sortedPayments}
      keyExtractor={(payment) => payment.id}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={handleSort}
    />
  );
}

