'use client';

import { useTranslations } from 'next-intl';
import { DeleteConfirmationDialog as BaseDeleteConfirmationDialog } from '@/shared/components/ui';

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  itemName?: string;
  isLoading?: boolean;
  error?: string;
  title?: string;
  itemType?: 'group' | 'center';
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  itemName,
  isLoading = false,
  error,
  title,
  itemType = 'group',
}: DeleteConfirmationDialogProps) {
  const t = useTranslations('groups');
  const tCommon = useTranslations('common');
  const isGroup = itemType === 'group';
  const dialogTitle = title || (isGroup ? t('deleteGroupTitle') : t('deleteCenterTitle'));
  const description = itemName
    ? isGroup
      ? t('deleteGroupWithName', { name: itemName })
      : t('deleteCenterWithName', { name: itemName })
    : isGroup
      ? t('deleteGroupGeneric')
      : t('deleteCenterGeneric');

  return (
    <BaseDeleteConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title={dialogTitle}
      description={description}
      isLoading={isLoading}
      error={error}
      confirmLabel={tCommon('delete')}
      cancelLabel={tCommon('cancel')}
      loadingLabel={t('deleting')}
    />
  );
}
