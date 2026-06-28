'use client';

import { portalPageStackClass } from '@/shared/lib/portal-theme';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui';
import { SalaryDetailsModal } from '@/features/finance/components/SalaryDetailsModal';
import {
  useFinanceDashboard,
  usePayments,
  useSalaries,
  useUpdatePaymentStatus,
  useUpdatePaymentMethod,
  useUpdateSalaryStatus,
  useDeleteSalaries,
  useDeletePayments,
  type PaymentStatus,
  type SalaryStatus,
} from '@/features/finance';
import { useFinancePage } from './hooks/useFinancePage';
import { FinanceStats } from './components/FinanceStats';
import { FinanceTabs } from './components/FinanceTabs';
import { FinanceFilters } from './components/FinanceFilters';
import { PaymentsTable } from './components/PaymentsTable';
import { SalariesTable } from './components/SalariesTable';
import { useIsIPad } from '@/shared/hooks/useIsIPad';

export default function FinancePage() {
  const t = useTranslations('finance');
  const params = useParams();
  const locale = params.locale as string;
  const isIPad = useIsIPad();
  const [isSmUp, setIsSmUp] = useState<boolean | undefined>(undefined);
  const pageSize = isSmUp === false ? 5 : 10;
  const cardsListStartRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollToCardsRef = useRef(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 640px)');
    const sync = () => setIsSmUp(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener('change', sync);
    return () => mediaQuery.removeEventListener('change', sync);
  }, []);

  const {
    // State
    activeTab,
    paymentsPage,
    salariesPage,
    searchQuery,
    debouncedSearchQuery,
    paymentStatus,
    salaryStatus,
    selectedSalaryId,
    isDetailModalOpen,
    selectedSalaryIds,
    selectedPaymentIds,
    isDeleteDialogOpen,
    isDeletePaymentsDialogOpen,
    deleteError,
    deletePaymentsError,
    closeSalaryDetail,
    openSalaryDetail,
    // Setters
    setSelectedSalaryIds,
    setSelectedPaymentIds,
    setIsDeleteDialogOpen,
    setIsDeletePaymentsDialogOpen,
    setDeleteError,
    setDeletePaymentsError,
    // Handlers
    handleTabChange,
    handleSearchChange,
    handlePaymentStatusChange,
    handleSalaryStatusChange,
    handlePaymentsPageChange,
    handleSalariesPageChange,
  } = useFinancePage();

  // Fetch dashboard stats
  const { data: dashboard, isLoading: isLoadingDashboard } = useFinanceDashboard();

  // Fetch payments (debounced search to avoid request on every keystroke)
  const { 
    data: paymentsData, 
    isLoading: isLoadingPayments,
    isFetching: isFetchingPayments,
  } = usePayments({
    skip: paymentsPage * pageSize,
    take: pageSize,
    status: paymentStatus || undefined,
    q: debouncedSearchQuery.trim() || undefined,
  });

  // Fetch salaries (debounced search)
  const {
    data: salariesData,
    isLoading: isLoadingSalaries,
    isFetching: isFetchingSalaries,
  } = useSalaries({
    skip: salariesPage * pageSize,
    take: pageSize,
    status: salaryStatus || undefined,
    q: debouncedSearchQuery.trim() || undefined,
  });

  // Mutations
  const updatePaymentStatusMutation = useUpdatePaymentStatus();
  const updatePaymentMethodMutation = useUpdatePaymentMethod();
  const updateSalaryStatusMutation = useUpdateSalaryStatus();
  const deleteSalaries = useDeleteSalaries();
  const deletePayments = useDeletePayments();

  // Wrap updatePaymentStatus to match expected interface
  const updatePaymentStatus = {
    mutateAsync: async (params: { id: string; status: PaymentStatus }) => {
      await updatePaymentStatusMutation.mutateAsync({ id: params.id, status: params.status });
    },
    isPending: updatePaymentStatusMutation.isPending,
  };

  // Wrap updatePaymentMethod to match expected interface (mutateAsync returns void)
  const updatePaymentMethod = {
    mutateAsync: async (params: { id: string; paymentMethod: string | null }) => {
      await updatePaymentMethodMutation.mutateAsync({ id: params.id, paymentMethod: params.paymentMethod });
    },
    isPending: updatePaymentMethodMutation.isPending,
  };

  // Wrap updateSalaryStatus to match expected interface
  const updateSalaryStatus = {
    mutateAsync: async (params: { id: string; status: SalaryStatus }) => {
      await updateSalaryStatusMutation.mutateAsync({ id: params.id, status: params.status });
    },
    isPending: updateSalaryStatusMutation.isPending,
  };

  const payments = paymentsData?.items || [];
  const totalPayments = paymentsData?.total || 0;
  const paymentsTotalPages = paymentsData?.totalPages || 1;

  const salaries = salariesData?.items || [];
  const totalSalaries = salariesData?.total || 0;
  const salariesTotalPages = salariesData?.totalPages || 1;

  useEffect(() => {
    if ((isSmUp !== false && !isIPad) || !shouldScrollToCardsRef.current) return;
    const isActiveTabFetching = activeTab === 'payments' ? isFetchingPayments : isFetchingSalaries;
    if (isActiveTabFetching) return;

    requestAnimationFrame(() => {
      cardsListStartRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
    shouldScrollToCardsRef.current = false;
  }, [isSmUp, isIPad, activeTab, isFetchingPayments, isFetchingSalaries, paymentsPage, salariesPage]);

  const isLoading = activeTab === 'payments' ? isLoadingPayments : activeTab === 'salaries' ? isLoadingSalaries : false;

  // Checkbox state for payments (current page only)
  const allPaymentsSelected = payments.length > 0 && payments.every((p) => selectedPaymentIds.has(p.id));
  const somePaymentsSelected = payments.some((p) => selectedPaymentIds.has(p.id)) && !allPaymentsSelected;

  const handleSelectAllPayments = () => {
    if (allPaymentsSelected) {
      setSelectedPaymentIds(new Set());
    } else {
      setSelectedPaymentIds(new Set(payments.map((p) => p.id)));
    }
  };

  const handleToggleSelectPayment = (paymentId: string) => {
    setSelectedPaymentIds((prev) => {
      const next = new Set(prev);
      if (next.has(paymentId)) next.delete(paymentId);
      else next.add(paymentId);
      return next;
    });
  };

  // Checkbox handlers for salaries
  const allSalariesSelected =
    salaries.length > 0 && salaries.every((s) => selectedSalaryIds.has(s.id));
  const someSalariesSelected =
    salaries.some((s) => selectedSalaryIds.has(s.id)) && !allSalariesSelected;

  const handleSelectAllSalaries = () => {
    if (allSalariesSelected) {
      setSelectedSalaryIds(new Set());
    } else {
      setSelectedSalaryIds(new Set(salaries.map((s) => s.id)));
    }
  };

  const handleSelectOneSalary = (salaryId: string, checked: boolean) => {
    const newSet = new Set(selectedSalaryIds);
    if (checked) {
      newSet.add(salaryId);
    } else {
      newSet.delete(salaryId);
    }
    setSelectedSalaryIds(newSet);
  };

  // Handle delete button click
  const handleDeleteClick = () => {
    if (selectedSalaryIds.size === 0) return;
    setDeleteError(null);
    setIsDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (selectedSalaryIds.size === 0) return;

    setDeleteError(null);

    try {
      await deleteSalaries.mutateAsync(Array.from(selectedSalaryIds));
      setSelectedSalaryIds(new Set());
      setIsDeleteDialogOpen(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete salary records. Please try again.';
      setDeleteError(errorMessage);
    }
  };

  // Handle delete payments button click
  const handleDeletePaymentsClick = () => {
    if (selectedPaymentIds.size === 0) return;
    setDeletePaymentsError(null);
    setIsDeletePaymentsDialogOpen(true);
  };

  // Handle delete payments confirmation
  const handleDeletePaymentsConfirm = async () => {
    if (selectedPaymentIds.size === 0) return;

    setDeletePaymentsError(null);

    try {
      await deletePayments.mutateAsync(Array.from(selectedPaymentIds));
      setSelectedPaymentIds(new Set());
      setIsDeletePaymentsDialogOpen(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete payments. Please try again.';
      setDeletePaymentsError(errorMessage);
    }
  };

  const handlePageChangeWithScroll = (nextPage: number) => {
    const currentPage = activeTab === 'payments' ? paymentsPage : salariesPage;
    if (nextPage === currentPage) return;

    if (isSmUp === false || isIPad) {
      shouldScrollToCardsRef.current = true;
    }

    if (activeTab === 'payments') {
      handlePaymentsPageChange(nextPage);
    } else {
      handleSalariesPageChange(nextPage);
    }
  };

  return (
    <DashboardLayout 
      title={t('title')} 
      subtitle={t('adminSubtitle')}
    >
      <div className={portalPageStackClass}>
        {/* Stats Grid */}
        <FinanceStats dashboard={dashboard} isLoading={isLoadingDashboard} isIPad={isIPad} />

        {/* Tabs */}
        <FinanceTabs
          activeTab={activeTab}
          totalPayments={totalPayments}
          totalSalaries={totalSalaries}
          onTabChange={handleTabChange}
        />

        {/* Actions */}
        <FinanceFilters
          activeTab={activeTab}
          searchQuery={searchQuery}
          paymentStatus={paymentStatus}
          salaryStatus={salaryStatus}
          selectedSalaryIds={selectedSalaryIds}
          allSalariesSelected={allSalariesSelected}
          allPaymentsSelected={allPaymentsSelected}
          onSearchChange={handleSearchChange}
          onPaymentStatusChange={handlePaymentStatusChange}
          onSalaryStatusChange={handleSalaryStatusChange}
          onDeleteClick={handleDeleteClick}
          onDeletePaymentsClick={handleDeletePaymentsClick}
          isDeleting={deleteSalaries.isPending}
          isDeletingPayments={deletePayments.isPending}
          isSearching={activeTab === 'payments' ? isFetchingPayments : isFetchingSalaries}
          selectedPaymentIds={selectedPaymentIds}
          page={activeTab === 'payments' ? paymentsPage : salariesPage}
          pageSize={pageSize}
          totalPages={activeTab === 'payments' ? paymentsTotalPages : salariesTotalPages}
          total={activeTab === 'payments' ? totalPayments : totalSalaries}
          onPageChange={handlePageChangeWithScroll}
        />

        {/* Table */}
        <div ref={cardsListStartRef} />
        {activeTab === 'payments' ? (
          <PaymentsTable
            payments={payments}
            isLoading={isLoading || isLoadingDashboard}
            isIPad={isIPad}
            updatePaymentStatus={updatePaymentStatus}
            updatePaymentMethod={updatePaymentMethod}
            searchTerm={debouncedSearchQuery.trim()}
            noResultsKey="noPaymentsMatch"
            allPaymentsSelected={allPaymentsSelected}
            somePaymentsSelected={somePaymentsSelected}
            selectedPaymentIds={selectedPaymentIds}
            onSelectAllPayments={handleSelectAllPayments}
            onToggleSelectPayment={handleToggleSelectPayment}
          />
        ) : (
          <SalariesTable
            salaries={salaries}
            isLoading={isLoading || isLoadingDashboard}
            isIPad={isIPad}
            allSalariesSelected={allSalariesSelected}
            someSalariesSelected={someSalariesSelected}
            selectedSalaryIds={selectedSalaryIds}
            updateSalaryStatus={updateSalaryStatus}
            onSelectAll={handleSelectAllSalaries}
            onSelectOne={handleSelectOneSalary}
            locale={locale}
            searchTerm={debouncedSearchQuery.trim()}
            noResultsKey="noSalariesMatch"
            onOpenSalaryDetail={openSalaryDetail}
          />
        )}

        {/* Pagination - bottom aligned */}
        {((activeTab === 'payments' ? totalPayments : totalSalaries) > 0) && (
          <div className="flex items-center justify-between text-sm text-[#8b8b90] lg:justify-start lg:gap-4">
            <span>
              {Math.min(
                (activeTab === 'payments' ? paymentsPage : salariesPage) * pageSize + 1,
                activeTab === 'payments' ? totalPayments : totalSalaries
              )}
              -
              {Math.min(
                ((activeTab === 'payments' ? paymentsPage : salariesPage) + 1) * pageSize,
                activeTab === 'payments' ? totalPayments : totalSalaries
              )}{' '}
              / {activeTab === 'payments' ? totalPayments : totalSalaries}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                  (activeTab === 'payments' ? paymentsPage : salariesPage) === 0
                    ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
                    : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]'
                }`}
                disabled={(activeTab === 'payments' ? paymentsPage : salariesPage) === 0}
                onClick={() =>
                  handlePageChangeWithScroll(
                    Math.max(0, (activeTab === 'payments' ? paymentsPage : salariesPage) - 1),
                  )
                }
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-[#1010a3] px-3 text-xs font-semibold text-white">
                {(activeTab === 'payments' ? paymentsPage : salariesPage) + 1}
              </span>
              <button
                type="button"
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                  (activeTab === 'payments' ? paymentsPage : salariesPage) >=
                  ((activeTab === 'payments' ? paymentsTotalPages : salariesTotalPages) - 1)
                    ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
                    : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]'
                }`}
                disabled={
                  (activeTab === 'payments' ? paymentsPage : salariesPage) >=
                  ((activeTab === 'payments' ? paymentsTotalPages : salariesTotalPages) - 1)
                }
                onClick={() =>
                  handlePageChangeWithScroll(
                    Math.min(
                      (activeTab === 'payments' ? paymentsTotalPages : salariesTotalPages) - 1,
                      (activeTab === 'payments' ? paymentsPage : salariesPage) + 1,
                    ),
                  )
                }
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Salary Details Modal */}
        <SalaryDetailsModal
          salaryId={selectedSalaryId}
          open={isDetailModalOpen}
          onClose={closeSalaryDetail}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent
            overlayClassName="duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            className="w-[calc(100%-1.5rem)] max-w-sm rounded-[15px] p-5 duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:w-full"
          >
            <DialogHeader>
              <DialogTitle>{t('deleteSalaryRecords')}</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedSalaryIds.size} salary record{selectedSalaryIds.size > 1 ? 's' : ''}? This action cannot be undone and will permanently remove the selected record{selectedSalaryIds.size > 1 ? 's' : ''}.
              </DialogDescription>
            </DialogHeader>
            {deleteError && (
              <div className="rounded-[15px] border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-600">{deleteError}</p>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setDeleteError(null);
                }}
                disabled={deleteSalaries.isPending}
                className="rounded-full px-5"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deleteSalaries.isPending}
                className="rounded-full px-5"
              >
                {deleteSalaries.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Payments Confirmation Dialog */}
        <Dialog open={isDeletePaymentsDialogOpen} onOpenChange={setIsDeletePaymentsDialogOpen}>
          <DialogContent
            overlayClassName="duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            className="w-[calc(100%-1.5rem)] max-w-sm rounded-[15px] p-5 duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:w-full"
          >
            <DialogHeader>
              <DialogTitle>{t('deletePayments')}</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedPaymentIds.size} payment{selectedPaymentIds.size > 1 ? 's' : ''}? This action cannot be undone and will permanently remove the selected record{selectedPaymentIds.size > 1 ? 's' : ''}.
              </DialogDescription>
            </DialogHeader>
            {deletePaymentsError && (
              <div className="rounded-[15px] border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-600">{deletePaymentsError}</p>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDeletePaymentsDialogOpen(false);
                  setDeletePaymentsError(null);
                }}
                disabled={deletePayments.isPending}
                className="rounded-full px-5"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeletePaymentsConfirm}
                disabled={deletePayments.isPending}
                className="rounded-full px-5"
              >
                {deletePayments.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
