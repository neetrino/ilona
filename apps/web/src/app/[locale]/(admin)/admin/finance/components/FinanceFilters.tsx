'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/shared/components/ui';
import { Trash2 } from 'lucide-react';
import type { PaymentStatus, SalaryStatus } from '@/features/finance';

interface FinanceFiltersProps {
  activeTab: 'payments' | 'salaries';
  searchQuery: string;
  paymentStatus: PaymentStatus | '';
  salaryStatus: SalaryStatus | '';
  selectedSalaryIds: Set<string>;
  onSearchChange: (value: string) => void;
  onPaymentStatusChange: (status: PaymentStatus | '') => void;
  onSalaryStatusChange: (status: SalaryStatus | '') => void;
  onDeleteClick: () => void;
  isDeleting: boolean;
}

export function FinanceFilters({
  activeTab,
  searchQuery,
  paymentStatus,
  salaryStatus,
  selectedSalaryIds,
  onSearchChange,
  onPaymentStatusChange,
  onSalaryStatusChange,
  onDeleteClick,
  isDeleting,
}: FinanceFiltersProps) {
  const t = useTranslations('finance');

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={`Search ${activeTab === 'payments' ? 'payments' : 'salaries'}...`}
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>
      {/* Status Filter */}
      <div className="relative">
        <select
          value={activeTab === 'payments' ? paymentStatus : salaryStatus}
          onChange={(e) => {
            if (activeTab === 'payments') {
              onPaymentStatusChange(e.target.value as PaymentStatus | '');
            } else if (activeTab === 'salaries') {
              onSalaryStatusChange(e.target.value as SalaryStatus | '');
            }
          }}
          className="pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer min-w-[160px]"
        >
          <option value="">All statuses</option>
          {activeTab === 'payments' ? (
            <>
              <option value="PENDING">{t('pending')}</option>
              <option value="PAID">{t('paid')}</option>
              <option value="OVERDUE">{t('overdue')}</option>
              <option value="CANCELLED">{t('cancelled')}</option>
              <option value="REFUNDED">{t('refunded')}</option>
            </>
          ) : activeTab === 'salaries' ? (
            <>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
            </>
          ) : null}
        </select>
        <svg 
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {activeTab === 'payments' ? (
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-medium">
          + Record Payment
        </Button>
      ) : activeTab === 'salaries' ? (
        <>
          {selectedSalaryIds.size > 0 && (
            <Button
              variant="destructive"
              className="px-6 py-3 rounded-xl font-medium flex items-center gap-2"
              onClick={onDeleteClick}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedSalaryIds.size})
            </Button>
          )}
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-medium">
            Generate Monthly
          </Button>
        </>
      ) : null}
      <button className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">
        <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </button>
    </div>
  );
}

