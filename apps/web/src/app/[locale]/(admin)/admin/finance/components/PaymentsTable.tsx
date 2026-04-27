'use client';

import { useTranslations } from 'next-intl';
import { DataTable } from '@/shared/components/ui';
import { getPaymentColumns } from '../utils/tableColumns';
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

  return (
    <DataTable
      columns={columns}
      data={payments}
      keyExtractor={(payment) => payment.id}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
    />
  );
}
