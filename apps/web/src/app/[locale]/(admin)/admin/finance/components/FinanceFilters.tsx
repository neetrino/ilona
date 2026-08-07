'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button, DatePickerInput, LoadingSpinner } from '@/shared/components/ui';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import type { PaymentStatus, SalaryStatus } from '@/features/finance';
import type { FinanceTabId } from './FinanceTabs';
import {
  formatEarningsPeriodLabel,
  formatEarningsRangeTitle,
} from '../utils/earnings-month';

interface FinanceFiltersProps {
  activeTab: FinanceTabId;
  searchQuery: string;
  paymentStatus: PaymentStatus | '';
  salaryStatus: SalaryStatus | '';
  earningsFrom: string;
  earningsTo: string;
  selectedSalaryIds: Set<string>;
  allSalariesSelected?: boolean;
  allPaymentsSelected?: boolean;
  selectedPaymentIds?: Set<string>;
  onSearchChange: (value: string) => void;
  onPaymentStatusChange: (status: PaymentStatus | '') => void;
  onSalaryStatusChange: (status: SalaryStatus | '') => void;
  onEarningsMonthShift: (delta: number) => void;
  onEarningsRangeChange: (from: string, to: string) => void;
  onDeleteClick: () => void;
  onDeletePaymentsClick?: () => void;
  isDeleting: boolean;
  isDeletingPayments?: boolean;
  isSearching?: boolean;
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
  earningsFrom,
  earningsTo,
  selectedSalaryIds,
  allSalariesSelected = false,
  allPaymentsSelected = false,
  selectedPaymentIds,
  onSearchChange,
  onPaymentStatusChange,
  onSalaryStatusChange,
  onEarningsMonthShift,
  onEarningsRangeChange,
  onDeleteClick,
  onDeletePaymentsClick,
  isDeleting,
  isDeletingPayments,
  isSearching,
}: FinanceFiltersProps) {
  const t = useTranslations('finance');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [rangeOpen, setRangeOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(earningsFrom);
  const [draftTo, setDraftTo] = useState(earningsTo);

  useEffect(() => {
    setDraftFrom(earningsFrom);
    setDraftTo(earningsTo);
  }, [earningsFrom, earningsTo]);

  const statusOptions =
    activeTab === 'payments'
      ? [
          { id: '', label: t('allStatuses') },
          { id: 'PAID', label: t('paid') },
          { id: 'OVERDUE', label: t('overdue') },
          { id: 'CANCELLED', label: t('cancelled') },
        ]
      : [
          { id: '', label: t('allStatuses') },
          { id: 'PENDING', label: t('pending') },
          { id: 'PAID', label: t('paid') },
        ];

  const searchPlaceholder =
    activeTab === 'payments'
      ? t('searchPaymentsPlaceholder')
      : activeTab === 'earnings'
        ? t('searchEarningsPlaceholder')
        : t('searchSalariesPlaceholder');

  const applyDraftRange = () => {
    if (!draftFrom || !draftTo) return;
    onEarningsRangeChange(draftFrom, draftTo);
    setRangeOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <div className="relative min-w-0 flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8b8b90]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-xl border border-[rgba(14,14,16,0.07)] bg-white py-3 pl-10 pr-10 text-sm focus:border-[#1010a3] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20"
          />
          {isSearching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b8b90]" aria-hidden>
              <LoadingSpinner size="sm" />
            </span>
          )}
        </div>

        {activeTab === 'earnings' ? (
          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:min-w-[18rem]">
            <div className="flex items-center justify-between gap-2 rounded-xl border border-[rgba(14,14,16,0.07)] bg-white px-2 py-1.5">
              <button
                type="button"
                onClick={() => onEarningsMonthShift(-1)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-[15px] text-[#3b3b40] transition-colors hover:bg-[#f6f6f7]"
                aria-label={t('previousMonth')}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setRangeOpen((open) => !open)}
                className="min-w-0 flex-1 rounded-[15px] px-2 py-1 text-center transition-colors hover:bg-[#f6f6f7]"
                aria-expanded={rangeOpen}
                aria-label={t('editEarningsRange')}
              >
                <p className="truncate text-sm font-semibold capitalize text-[#3b3b40]">
                  {formatEarningsRangeTitle(earningsFrom, earningsTo, locale)}
                </p>
                <p className="truncate text-xs text-[#8b8b90]">
                  {formatEarningsPeriodLabel(earningsFrom, earningsTo, locale)}
                </p>
              </button>
              <button
                type="button"
                onClick={() => onEarningsMonthShift(1)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-[15px] text-[#3b3b40] transition-colors hover:bg-[#f6f6f7]"
                aria-label={t('nextMonth')}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {rangeOpen ? (
              <div className="rounded-xl border border-[rgba(14,14,16,0.07)] bg-white p-3 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#8b8b90]">{tCommon('from')}</label>
                    <DatePickerInput
                      value={draftFrom}
                      max={draftTo || undefined}
                      onValueChange={setDraftFrom}
                      popoverExpanded
                      className="h-10 w-full rounded-lg border border-[rgba(14,14,16,0.07)] text-sm"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#8b8b90]">{tCommon('to')}</label>
                    <DatePickerInput
                      value={draftTo}
                      min={draftFrom || undefined}
                      onValueChange={setDraftTo}
                      popoverExpanded
                      className="h-10 w-full rounded-lg border border-[rgba(14,14,16,0.07)] text-sm"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={applyDraftRange}
                    disabled={!draftFrom || !draftTo}
                    className="h-10 shrink-0 rounded-[15px] bg-[#1010a3] px-4 text-sm font-medium text-white hover:bg-[#1010a3]/90"
                  >
                    {t('applyEarningsRange')}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
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
        )}

        {activeTab === 'payments' ? (
          <div className="flex w-full shrink-0 items-center gap-3 sm:w-auto">
            {selectedPaymentIds && selectedPaymentIds.size > 0 && onDeletePaymentsClick && (
              <Button
                variant="destructive"
                className="flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-medium sm:w-auto"
                onClick={onDeletePaymentsClick}
                disabled={isDeletingPayments}
              >
                <Trash2 className="h-4 w-4" />
                {allPaymentsSelected
                  ? t('deleteAll', { count: selectedPaymentIds.size })
                  : t('deleteSelected', { count: selectedPaymentIds.size })}
              </Button>
            )}
            {selectedPaymentIds && selectedPaymentIds.size > 0 && !onDeletePaymentsClick && (
              <span className="text-sm text-[#3b3b40]">{selectedPaymentIds.size} selected</span>
            )}
          </div>
        ) : activeTab === 'salaries' ? (
          <div className="flex w-full shrink-0 items-center gap-3 sm:w-auto">
            {selectedSalaryIds.size > 0 && (
              <Button
                variant="destructive"
                className="flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-medium sm:w-auto"
                onClick={onDeleteClick}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
                {allSalariesSelected
                  ? t('deleteAll', { count: selectedSalaryIds.size })
                  : t('deleteSelected', { count: selectedSalaryIds.size })}
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
