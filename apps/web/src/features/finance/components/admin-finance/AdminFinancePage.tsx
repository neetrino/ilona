'use client';

import { portalPageStackClass } from '@/shared/lib/portal-theme';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
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
import { useFinancePage } from '@/app/[locale]/(admin)/admin/finance/hooks/useFinancePage';
import { FinanceStats } from '@/app/[locale]/(admin)/admin/finance/components/FinanceStats';
import { FinanceTabs } from '@/app/[locale]/(admin)/admin/finance/components/FinanceTabs';
import { FinanceFilters } from '@/app/[locale]/(admin)/admin/finance/components/FinanceFilters';
import { useIsIPad } from '@/shared/hooks/useIsIPad';
import { AdminFinanceTableSection } from './AdminFinanceTableSection';
import { AdminFinancePagination } from './AdminFinancePagination';
import { AdminFinanceDeleteDialogs } from './AdminFinanceDeleteDialogs';

export function AdminFinancePage() {
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

  const activePage = activeTab === 'payments' ? paymentsPage : salariesPage;
  const activeTotal = activeTab === 'payments' ? totalPayments : totalSalaries;
  const activeTotalPages = activeTab === 'payments' ? paymentsTotalPages : salariesTotalPages;

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
          page={activePage}
          pageSize={pageSize}
          totalPages={activeTotalPages}
          total={activeTotal}
          onPageChange={handlePageChangeWithScroll}
        />

        {/* Table */}
        <AdminFinanceTableSection
          activeTab={activeTab}
          cardsListStartRef={cardsListStartRef}
          payments={payments}
          salaries={salaries}
          isLoading={isLoading || isLoadingDashboard}
          isIPad={isIPad}
          locale={locale}
          searchTerm={debouncedSearchQuery.trim()}
          allPaymentsSelected={allPaymentsSelected}
          somePaymentsSelected={somePaymentsSelected}
          selectedPaymentIds={selectedPaymentIds}
          allSalariesSelected={allSalariesSelected}
          someSalariesSelected={someSalariesSelected}
          selectedSalaryIds={selectedSalaryIds}
          updatePaymentStatus={updatePaymentStatus}
          updatePaymentMethod={updatePaymentMethod}
          updateSalaryStatus={updateSalaryStatus}
          onSelectAllPayments={handleSelectAllPayments}
          onToggleSelectPayment={handleToggleSelectPayment}
          onSelectAllSalaries={handleSelectAllSalaries}
          onSelectOneSalary={handleSelectOneSalary}
          onOpenSalaryDetail={openSalaryDetail}
        />

        {/* Pagination - bottom aligned */}
        <AdminFinancePagination
          page={activePage}
          pageSize={pageSize}
          total={activeTotal}
          totalPages={activeTotalPages}
          onPageChange={handlePageChangeWithScroll}
        />

        {/* Salary Details Modal */}
        <SalaryDetailsModal
          salaryId={selectedSalaryId}
          open={isDetailModalOpen}
          onClose={closeSalaryDetail}
        />

        <AdminFinanceDeleteDialogs
          isDeleteDialogOpen={isDeleteDialogOpen}
          isDeletePaymentsDialogOpen={isDeletePaymentsDialogOpen}
          selectedSalaryIds={selectedSalaryIds}
          selectedPaymentIds={selectedPaymentIds}
          deleteError={deleteError}
          deletePaymentsError={deletePaymentsError}
          isDeletingSalaries={deleteSalaries.isPending}
          isDeletingPayments={deletePayments.isPending}
          onDeleteDialogOpenChange={(open) => {
            setIsDeleteDialogOpen(open);
            if (!open) setDeleteError(null);
          }}
          onDeletePaymentsDialogOpenChange={(open) => {
            setIsDeletePaymentsDialogOpen(open);
            if (!open) setDeletePaymentsError(null);
          }}
          onDeleteConfirm={handleDeleteConfirm}
          onDeletePaymentsConfirm={handleDeletePaymentsConfirm}
        />
      </div>
    </DashboardLayout>
  );
}
