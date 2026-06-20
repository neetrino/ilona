'use client';

import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@/shared/components/ui';

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        className="w-[calc(100%-1.5rem)] max-w-sm rounded-[15px] p-5 duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:w-full"
      >
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {error && (
          <div className="rounded-[15px] border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="rounded-full px-5"
          >
            {tCommon('cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            isLoading={isLoading}
            className="rounded-full px-5"
          >
            {isLoading ? t('deleting') : tCommon('delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
