'use client';

import { useTranslations } from 'next-intl';
import { DataTable } from '@/shared/components/ui';
import { getPaymentColumns } from '../utils/tableColumns';
import type { Payment, PaymentStatus } from '@/features/finance';

interface PaymentsTableProps {
  payments: Payment[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
  updatePaymentStatus: {
    mutateAsync: (params: { id: string; status: PaymentStatus }) => Promise<void>;
    isPending: boolean;
  };
  onPageChange: (page: number) => void;
}

export function PaymentsTable({
  payments,
  isLoading,
  page,
  pageSize,
  totalPages,
  total,
  updatePaymentStatus,
  onPageChange,
}: PaymentsTableProps) {
  const t = useTranslations('finance');
  const columns = getPaymentColumns({ t, updatePaymentStatus });

  return (
    <>
      <DataTable
        columns={columns}
        data={payments}
        keyExtractor={(payment) => payment.id}
        isLoading={isLoading}
        emptyMessage="No payments found"
      />
      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          Showing {Math.min(page * pageSize + 1, total)}-{Math.min((page + 1) * pageSize, total)} of {total}
        </span>
        <div className="flex items-center gap-2">
          <button 
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50" 
            disabled={page === 0}
            onClick={() => onPageChange(Math.max(0, page - 1))}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span>Page {page + 1} of {totalPages || 1}</span>
          <button 
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50"
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

