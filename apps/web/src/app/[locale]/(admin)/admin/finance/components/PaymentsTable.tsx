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
}

export function PaymentsTable({
  payments,
  isLoading,
  updatePaymentStatus,
}: PaymentsTableProps) {
  const t = useTranslations('finance');
  const columns = getPaymentColumns({ t, updatePaymentStatus });

  return (
    <DataTable
      columns={columns}
      data={payments}
      keyExtractor={(payment) => payment.id}
      isLoading={isLoading}
      emptyMessage="No payments found"
    />
  );
}

