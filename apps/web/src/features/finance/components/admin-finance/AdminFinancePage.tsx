'use client';

import { portalPageStackClass } from '@/shared/lib/portal-theme';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { earningsMonthDateBounds } from '@/app/[locale]/(admin)/admin/finance/utils/earnings-month';

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
    activeTab,
    paymentsPage,
    salariesPage,
    earningsPage,
    earningsMonth,
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
    setSelectedSalaryIds,
    setSelectedPaymentIds,
    setIsDeleteDialogOpen,
    setIsDeletePaymentsDialogOpen,
    setDeleteError,
    setDeletePaymentsError,
    handleTabChange,
    handleSearchChange,
    handlePaymentStatusChange,
    handleSalaryStatusChange,
    handlePaymentsPageChange,
    handleSalariesPageChange,
    handleEarningsPageChange,
    handleEarningsMonthShift,
  } = useFinancePage();

  const earningsBounds = useMemo(
    () => earningsMonthDateBounds(earningsMonth),
    [earningsMonth],
  );

  const { data: dashboard, isLoading: isLoadingDashboard } = useFinanceDashboard();

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

  const {
    data: earningsData,
    isLoading: isLoadingEarnings,
    isFetching: isFetchingEarnings,
  } = useSalaries({
    skip: earningsPage * pageSize,
    take: pageSize,
    dateFrom: earningsBounds.dateFrom,
    dateTo: earningsBounds.dateTo,
    q: debouncedSearchQuery.trim() || undefined,
  });

  const updatePaymentStatusMutation = useUpdatePaymentStatus();
  const updatePaymentMethodMutation = useUpdatePaymentMethod();
  const updateSalaryStatusMutation = useUpdateSalaryStatus();
  const deleteSalaries = useDeleteSalaries();
  const deletePayments = useDeletePayments();

  const updatePaymentStatus = {
    mutateAsync: async (params: { id: string; status: PaymentStatus }) => {
      await updatePaymentStatusMutation.mutateAsync({ id: params.id, status: params.status });
    },
    isPending: updatePaymentStatusMutation.isPending,
  };

  const updatePaymentMethod = {
    mutateAsync: async (params: { id: string; paymentMethod: string | null }) => {
      await updatePaymentMethodMutation.mutateAsync({
        id: params.id,
        paymentMethod: params.paymentMethod,
      });
    },
    isPending: updatePaymentMethodMutation.isPending,
  };

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

  const earnings = earningsData?.items || [];
  const totalEarnings = earningsData?.total || 0;
  const earningsTotalPages = earningsData?.totalPages || 1;

  useEffect(() => {
    if ((isSmUp !== false && !isIPad) || !shouldScrollToCardsRef.current) return;
    const isActiveTabFetching =
      activeTab === 'payments'
        ? isFetchingPayments
        : activeTab === 'salaries'
          ? isFetchingSalaries
          : isFetchingEarnings;
    if (isActiveTabFetching) return;

    requestAnimationFrame(() => {
      cardsListStartRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
    shouldScrollToCardsRef.current = false;
  }, [
    isSmUp,
    isIPad,
    activeTab,
    isFetchingPayments,
    isFetchingSalaries,
    isFetchingEarnings,
    paymentsPage,
    salariesPage,
    earningsPage,
  ]);

  const isLoading =
    activeTab === 'payments'
      ? isLoadingPayments
      : activeTab === 'salaries'
        ? isLoadingSalaries
        : isLoadingEarnings;

  const isSearching =
    activeTab === 'payments'
      ? isFetchingPayments
      : activeTab === 'salaries'
        ? isFetchingSalaries
        : isFetchingEarnings;

  const allPaymentsSelected =
    payments.length > 0 && payments.every((p) => selectedPaymentIds.has(p.id));
  const somePaymentsSelected =
    payments.some((p) => selectedPaymentIds.has(p.id)) && !allPaymentsSelected;

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

  const handleDeleteClick = () => {
    if (selectedSalaryIds.size === 0) return;
    setDeleteError(null);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedSalaryIds.size === 0) return;

    setDeleteError(null);

    try {
      await deleteSalaries.mutateAsync(Array.from(selectedSalaryIds));
      setSelectedSalaryIds(new Set());
      setIsDeleteDialogOpen(false);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete salary records. Please try again.';
      setDeleteError(errorMessage);
    }
  };

  const handleDeletePaymentsClick = () => {
    if (selectedPaymentIds.size === 0) return;
    setDeletePaymentsError(null);
    setIsDeletePaymentsDialogOpen(true);
  };

  const handleDeletePaymentsConfirm = async () => {
    if (selectedPaymentIds.size === 0) return;

    setDeletePaymentsError(null);

    try {
      await deletePayments.mutateAsync(Array.from(selectedPaymentIds));
      setSelectedPaymentIds(new Set());
      setIsDeletePaymentsDialogOpen(false);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete payments. Please try again.';
      setDeletePaymentsError(errorMessage);
    }
  };

  const handlePageChangeWithScroll = (nextPage: number) => {
    const currentPage =
      activeTab === 'payments'
        ? paymentsPage
        : activeTab === 'salaries'
          ? salariesPage
          : earningsPage;
    if (nextPage === currentPage) return;

    if (isSmUp === false || isIPad) {
      shouldScrollToCardsRef.current = true;
    }

    if (activeTab === 'payments') {
      handlePaymentsPageChange(nextPage);
    } else if (activeTab === 'salaries') {
      handleSalariesPageChange(nextPage);
    } else {
      handleEarningsPageChange(nextPage);
    }
  };

  const activePage =
    activeTab === 'payments'
      ? paymentsPage
      : activeTab === 'salaries'
        ? salariesPage
        : earningsPage;
  const activeTotal =
    activeTab === 'payments'
      ? totalPayments
      : activeTab === 'salaries'
        ? totalSalaries
        : totalEarnings;
  const activeTotalPages =
    activeTab === 'payments'
      ? paymentsTotalPages
      : activeTab === 'salaries'
        ? salariesTotalPages
        : earningsTotalPages;

  return (
    <DashboardLayout title={t('title')} subtitle={t('adminSubtitle')}>
      <div className={portalPageStackClass}>
        <FinanceStats dashboard={dashboard} isLoading={isLoadingDashboard} isIPad={isIPad} />

        <FinanceTabs
          activeTab={activeTab}
          totalPayments={totalPayments}
          totalSalaries={totalSalaries}
          totalEarnings={totalEarnings}
          onTabChange={handleTabChange}
        />

        <FinanceFilters
          activeTab={activeTab}
          searchQuery={searchQuery}
          paymentStatus={paymentStatus}
          salaryStatus={salaryStatus}
          earningsMonth={earningsMonth}
          selectedSalaryIds={selectedSalaryIds}
          allSalariesSelected={allSalariesSelected}
          allPaymentsSelected={allPaymentsSelected}
          onSearchChange={handleSearchChange}
          onPaymentStatusChange={handlePaymentStatusChange}
          onSalaryStatusChange={handleSalaryStatusChange}
          onEarningsMonthShift={handleEarningsMonthShift}
          onDeleteClick={handleDeleteClick}
          onDeletePaymentsClick={handleDeletePaymentsClick}
          isDeleting={deleteSalaries.isPending}
          isDeletingPayments={deletePayments.isPending}
          isSearching={isSearching}
          selectedPaymentIds={selectedPaymentIds}
          page={activePage}
          pageSize={pageSize}
          totalPages={activeTotalPages}
          total={activeTotal}
          onPageChange={handlePageChangeWithScroll}
        />

        <AdminFinanceTableSection
          activeTab={activeTab}
          cardsListStartRef={cardsListStartRef}
          payments={payments}
          salaries={salaries}
          earnings={earnings}
          earningsMonth={earningsMonth}
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

        <AdminFinancePagination
          page={activePage}
          pageSize={pageSize}
          total={activeTotal}
          totalPages={activeTotalPages}
          onPageChange={handlePageChangeWithScroll}
        />

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
