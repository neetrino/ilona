'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui';
import { SalaryDetailsModal } from '@/features/finance/components/SalaryDetailsModal';
import {
  useFinanceDashboard,
  usePayments,
  useSalaries,
  useUpdatePaymentStatus,
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
import { FinanceInfoCards } from './components/FinanceInfoCards';

export default function FinancePage() {
  const t = useTranslations('finance');
  const params = useParams();
  const locale = params.locale as string;
  const pageSize = 10;

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
    // Setters
    setSelectedSalaryId,
    setIsDetailModalOpen,
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
  const allSalariesSelected = salaries.length > 0 && selectedSalaryIds.size === salaries.length;
  const someSalariesSelected = selectedSalaryIds.size > 0 && selectedSalaryIds.size < salaries.length;

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

  return (
    <DashboardLayout 
      title={t('title')} 
      subtitle={t('adminSubtitle')}
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <FinanceStats dashboard={dashboard} isLoading={isLoadingDashboard} />

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
          onPageChange={activeTab === 'payments' ? handlePaymentsPageChange : handleSalariesPageChange}
        />

        {/* Table */}
        {activeTab === 'payments' ? (
          <PaymentsTable
            payments={payments}
            isLoading={isLoading || isLoadingDashboard}
            updatePaymentStatus={updatePaymentStatus}
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
            allSalariesSelected={allSalariesSelected}
            someSalariesSelected={someSalariesSelected}
            selectedSalaryIds={selectedSalaryIds}
            updateSalaryStatus={updateSalaryStatus}
            onSelectAll={handleSelectAllSalaries}
            onSelectOne={handleSelectOneSalary}
            locale={locale}
            searchTerm={debouncedSearchQuery.trim()}
            noResultsKey="noSalariesMatch"
          />
        )}

        {/* Info Cards */}
        <FinanceInfoCards dashboard={dashboard} />

        {/* Salary Details Modal */}
        <SalaryDetailsModal
          salaryId={selectedSalaryId}
          open={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedSalaryId(null);
          }}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Salary Records</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedSalaryIds.size} salary record{selectedSalaryIds.size > 1 ? 's' : ''}? This action cannot be undone and will permanently remove the selected record{selectedSalaryIds.size > 1 ? 's' : ''}.
              </DialogDescription>
            </DialogHeader>
            {deleteError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{deleteError}</p>
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setDeleteError(null);
                }}
                disabled={deleteSalaries.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deleteSalaries.isPending}
              >
                {deleteSalaries.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Payments Confirmation Dialog */}
        <Dialog open={isDeletePaymentsDialogOpen} onOpenChange={setIsDeletePaymentsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Payments</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedPaymentIds.size} payment{selectedPaymentIds.size > 1 ? 's' : ''}? This action cannot be undone and will permanently remove the selected record{selectedPaymentIds.size > 1 ? 's' : ''}.
              </DialogDescription>
            </DialogHeader>
            {deletePaymentsError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{deletePaymentsError}</p>
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDeletePaymentsDialogOpen(false);
                  setDeletePaymentsError(null);
                }}
                disabled={deletePayments.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeletePaymentsConfirm}
                disabled={deletePayments.isPending}
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
