'use client';

import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui';
import { SalaryDetailsModal } from '@/features/finance/components/SalaryDetailsModal';
import { SalaryBreakdownModal } from '@/features/finance/components/SalaryBreakdownModal';
import {
  useFinanceDashboard,
  usePayments,
  useSalaries,
  useUpdatePaymentStatus,
  useUpdateSalaryStatus,
  useDeleteSalaries,
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
  const pageSize = 10;

  const {
    // State
    activeTab,
    paymentsPage,
    salariesPage,
    searchQuery,
    paymentStatus,
    salaryStatus,
    selectedSalaryId,
    isDetailModalOpen,
    selectedSalaryForBreakdown,
    selectedSalaryIds,
    isDeleteDialogOpen,
    deleteError,
    // Setters
    setSelectedSalaryId,
    setIsDetailModalOpen,
    setSelectedSalaryIds,
    setIsDeleteDialogOpen,
    setDeleteError,
    // Handlers
    handleTabChange,
    handleSearchChange,
    handlePaymentStatusChange,
    handleSalaryStatusChange,
    handlePaymentsPageChange,
    handleSalariesPageChange,
    handleViewBreakdown,
    handleBreakdownClose,
  } = useFinancePage();

  // Fetch dashboard stats
  const { data: dashboard, isLoading: isLoadingDashboard } = useFinanceDashboard();

  // Fetch payments
  const { 
    data: paymentsData, 
    isLoading: isLoadingPayments 
  } = usePayments({
    skip: paymentsPage * pageSize,
    take: pageSize,
    status: paymentStatus || undefined,
  });

  // Fetch salaries
  const {
    data: salariesData,
    isLoading: isLoadingSalaries,
  } = useSalaries({
    skip: salariesPage * pageSize,
    take: pageSize,
    status: salaryStatus || undefined,
  });

  // Mutations
  const updatePaymentStatusMutation = useUpdatePaymentStatus();
  const updateSalaryStatusMutation = useUpdateSalaryStatus();
  const deleteSalaries = useDeleteSalaries();

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
          isDeleting={deleteSalaries.isPending}
        />

        {/* Table */}
        {activeTab === 'payments' ? (
          <PaymentsTable
            payments={payments}
            isLoading={isLoading || isLoadingDashboard}
            page={paymentsPage}
            pageSize={pageSize}
            totalPages={paymentsTotalPages}
            total={totalPayments}
            updatePaymentStatus={updatePaymentStatus}
            onPageChange={handlePaymentsPageChange}
          />
        ) : (
          <SalariesTable
            salaries={salaries}
            isLoading={isLoading || isLoadingDashboard}
            page={salariesPage}
            pageSize={pageSize}
            totalPages={salariesTotalPages}
            total={totalSalaries}
            allSalariesSelected={allSalariesSelected}
            someSalariesSelected={someSalariesSelected}
            selectedSalaryIds={selectedSalaryIds}
            updateSalaryStatus={updateSalaryStatus}
            onSelectAll={handleSelectAllSalaries}
            onSelectOne={handleSelectOneSalary}
            onPageChange={handleSalariesPageChange}
            onViewBreakdown={handleViewBreakdown}
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

        {/* Salary Breakdown Modal */}
        {selectedSalaryForBreakdown && (
          <SalaryBreakdownModal
            teacherId={selectedSalaryForBreakdown.teacherId}
            teacherName={selectedSalaryForBreakdown.teacherName}
            month={selectedSalaryForBreakdown.month}
            open={!!selectedSalaryForBreakdown}
            onClose={handleBreakdownClose}
          />
        )}

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
      </div>
    </DashboardLayout>
  );
}
