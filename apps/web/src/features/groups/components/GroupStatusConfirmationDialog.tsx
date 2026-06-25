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

export type GroupStatusDialogAction = 'activate' | 'deactivate';

interface GroupStatusConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  action: GroupStatusDialogAction;
  groupName?: string;
  isLoading?: boolean;
  error?: string;
}

export function GroupStatusConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  action,
  groupName,
  isLoading = false,
  error,
}: GroupStatusConfirmationDialogProps) {
  const t = useTranslations('groups');
  const tCommon = useTranslations('common');
  const isDeactivate = action === 'deactivate';
  const title = isDeactivate ? t('groupStatusDeactivateTitle') : t('groupStatusActivateTitle');
  const message =
    groupName && groupName.trim().length > 0
      ? isDeactivate
        ? t('groupStatusDeactivateWithName', { name: groupName })
        : t('groupStatusActivateWithName', { name: groupName })
      : isDeactivate
        ? t('groupStatusDeactivateGeneric')
        : t('groupStatusActivateGeneric');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {tCommon('cancel')}
          </Button>
          <Button
            type="button"
            variant={isDeactivate ? 'destructive' : 'default'}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {isLoading ? t('groupStatusSaving') : tCommon('confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
