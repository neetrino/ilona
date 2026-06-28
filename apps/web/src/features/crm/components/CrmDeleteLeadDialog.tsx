'use client';

import { useTranslations } from 'next-intl';
import { DeleteConfirmationDialog } from '@/shared/components/ui';

export interface CrmDeleteLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
  error?: string | null;
  /** Overrides default voice-lead / standard delete copy */
  description?: string;
}

export function CrmDeleteLeadDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  error,
  description,
}: CrmDeleteLeadDialogProps) {
  const t = useTranslations('crm');
  const tCommon = useTranslations('common');

  return (
    <DeleteConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title={t('deleteLead')}
      description={description ?? t('deleteLeadConfirmDescription')}
      isLoading={isLoading}
      error={error}
      confirmLabel={t('deleteLeadConfirm')}
      cancelLabel={tCommon('cancel')}
      loadingLabel={t('deleting')}
    />
  );
}
