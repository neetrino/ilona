'use client';

import { useTranslations } from 'next-intl';
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
  searchTerm?: string;
  noResultsKey?: string;
}

export function PaymentsTable({
  payments,
  isLoading,
  updatePaymentStatus,
  searchTerm,
  noResultsKey,
}: PaymentsTableProps) {
  const t = useTranslations('finance');
  const columns = getPaymentColumns({ t, updatePaymentStatus });
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

