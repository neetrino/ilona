'use client';

import { useTranslations } from 'next-intl';
import { DeleteConfirmationDialog } from '@/shared/components/ui';

type AdminFinanceDeleteDialogsProps = {
  isDeleteDialogOpen: boolean;
  isDeletePaymentsDialogOpen: boolean;
  selectedSalaryIds: Set<string>;
  selectedPaymentIds: Set<string>;
  deleteError: string | null;
  deletePaymentsError: string | null;
  isDeletingSalaries: boolean;
  isDeletingPayments: boolean;
  onDeleteDialogOpenChange: (open: boolean) => void;
  onDeletePaymentsDialogOpenChange: (open: boolean) => void;
  onDeleteConfirm: () => void;
  onDeletePaymentsConfirm: () => void;
};

export function AdminFinanceDeleteDialogs({
  isDeleteDialogOpen,
  isDeletePaymentsDialogOpen,
  selectedSalaryIds,
  selectedPaymentIds,
  deleteError,
  deletePaymentsError,
  isDeletingSalaries,
  isDeletingPayments,
  onDeleteDialogOpenChange,
  onDeletePaymentsDialogOpenChange,
  onDeleteConfirm,
  onDeletePaymentsConfirm,
}: AdminFinanceDeleteDialogsProps) {
  const t = useTranslations('finance');
  const tCommon = useTranslations('common');

  return (
    <>
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={onDeleteDialogOpenChange}
        onConfirm={onDeleteConfirm}
        title={t('deleteSalaryRecords')}
        description={`Are you sure you want to delete ${selectedSalaryIds.size} salary record${selectedSalaryIds.size > 1 ? 's' : ''}? This action cannot be undone and will permanently remove the selected record${selectedSalaryIds.size > 1 ? 's' : ''}.`}
        isLoading={isDeletingSalaries}
        error={deleteError}
        confirmLabel={tCommon('delete')}
        cancelLabel={tCommon('cancel')}
      />

      <DeleteConfirmationDialog
        open={isDeletePaymentsDialogOpen}
        onOpenChange={onDeletePaymentsDialogOpenChange}
        onConfirm={onDeletePaymentsConfirm}
        title={t('deletePayments')}
        description={`Are you sure you want to delete ${selectedPaymentIds.size} payment${selectedPaymentIds.size > 1 ? 's' : ''}? This action cannot be undone and will permanently remove the selected record${selectedPaymentIds.size > 1 ? 's' : ''}.`}
        isLoading={isDeletingPayments}
        error={deletePaymentsError}
        confirmLabel={tCommon('delete')}
        cancelLabel={tCommon('cancel')}
      />
    </>
  );
}
