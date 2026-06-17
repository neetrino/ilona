'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/shared/components/ui';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import { Trash2, Loader2 } from 'lucide-react';
import type { PaymentStatus, SalaryStatus } from '@/features/finance';

interface FinanceFiltersProps {
  activeTab: 'payments' | 'salaries';
  searchQuery: string;
  paymentStatus: PaymentStatus | '';
  salaryStatus: SalaryStatus | '';
  selectedSalaryIds: Set<string>;
  selectedPaymentIds?: Set<string>;
  onSearchChange: (value: string) => void;
  onPaymentStatusChange: (status: PaymentStatus | '') => void;
  onSalaryStatusChange: (status: SalaryStatus | '') => void;
  onDeleteClick: () => void;
  onDeletePaymentsClick?: () => void;
  isDeleting: boolean;
  isDeletingPayments?: boolean;
  isSearching?: boolean;
  // Pagination props
  page?: number;
  pageSize?: number;
  totalPages?: number;
  total?: number;
  onPageChange?: (page: number) => void;
}

export function FinanceFilters({
  activeTab,
  searchQuery,
  paymentStatus,
  salaryStatus,
  selectedSalaryIds,
  selectedPaymentIds,
  onSearchChange,
  onPaymentStatusChange,
  onSalaryStatusChange,
  onDeleteClick,
  onDeletePaymentsClick,
  isDeleting,
  isDeletingPayments,
  isSearching,
  page,
  pageSize,
  totalPages,
  total,
  onPageChange,
}: FinanceFiltersProps) {
  const t = useTranslations('finance');
  const statusOptions =
    activeTab === 'payments'
      ? [
          { id: '', label: 'All statuses' },
          { id: 'PAID', label: t('paid') },
          { id: 'OVERDUE', label: t('overdue') },
          { id: 'CANCELLED', label: t('cancelled') },
        ]
      : [
          { id: '', label: 'All statuses' },
          { id: 'PENDING', label: 'Pending' },
          { id: 'PAID', label: 'Paid' },
        ];

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <div className="flex-1 min-w-0 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8b8b90] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={
              activeTab === 'payments'
                ? t('searchPaymentsPlaceholder')
                : t('searchSalariesPlaceholder')
            }
            className="w-full pl-10 pr-10 py-3 bg-white border border-[rgba(14,14,16,0.07)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20 focus:border-[#1010a3]"
          />
          {isSearching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b8b90]" aria-hidden>
              <Loader2 className="w-5 h-5 animate-spin" />
            </span>
          )}
        </div>
        {/* Status Filter */}
        <div className="w-full shrink-0 sm:w-auto sm:min-w-[9rem]">
          <SingleSelectDropdown
            id="finance-status-filter"
            options={statusOptions}
            value={activeTab === 'payments' ? paymentStatus : salaryStatus}
            onValueChange={(nextValue) => {
              if (activeTab === 'payments') {
                onPaymentStatusChange((nextValue ?? '') as PaymentStatus | '');
              } else {
                onSalaryStatusChange((nextValue ?? '') as SalaryStatus | '');
              }
            }}
            className="sm:min-w-[9rem]"
          />
        </div>
        {activeTab === 'payments' ? (
          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
            {selectedPaymentIds && selectedPaymentIds.size > 0 && onDeletePaymentsClick && (
              <Button
                variant="destructive"
                className="px-6 py-3 rounded-xl font-medium flex items-center gap-2 w-full sm:w-auto justify-center"
                onClick={onDeletePaymentsClick}
                disabled={isDeletingPayments}
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedPaymentIds.size})
              </Button>
            )}
            {selectedPaymentIds && selectedPaymentIds.size > 0 && !onDeletePaymentsClick && (
              <span className="text-sm text-[#3b3b40]">
                {selectedPaymentIds.size} selected
              </span>
            )}
          </div>
        ) : activeTab === 'salaries' ? (
          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
            {selectedSalaryIds.size > 0 && (
              <Button
                variant="destructive"
                className="px-6 py-3 rounded-xl font-medium flex items-center gap-2 w-full sm:w-auto justify-center"
                onClick={onDeleteClick}
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedSalaryIds.size})
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

