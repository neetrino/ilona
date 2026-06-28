'use client';

import { useTranslations } from 'next-intl';
import { DeleteConfirmationDialog } from '@/shared/components/ui';

interface DeactivateCenterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  centerName?: string;
  isLoading?: boolean;
  error?: string | null;
}

export function DeactivateCenterDialog({
  open,
  onOpenChange,
  onConfirm,
  centerName,
  isLoading = false,
  error,
}: DeactivateCenterDialogProps) {
  const t = useTranslations('centers');
  const tCommon = useTranslations('common');
  const description = centerName
    ? t('deactivateCenterWithName', { name: centerName })
    : t('deactivateCenterGeneric');

  return (
    <DeleteConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title={t('deactivateCenterTitle')}
      description={description}
      isLoading={isLoading}
      error={error}
      confirmLabel={t('deactivateAction')}
      cancelLabel={tCommon('cancel')}
      loadingLabel={t('deactivating')}
    />
  );
}
