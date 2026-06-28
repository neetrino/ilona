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
  DELETE_CONFIRMATION_DIALOG_OVERLAY_CLASS,
  useDeleteConfirmationDialogLayout,
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
  const confirmLabel = isDeactivate ? t('deactivateGroup') : t('activateGroup');
  const loadingLabel = isDeactivate ? t('deactivating') : t('activating');
  const { sheet, stackOpen, contentClassName } = useDeleteConfirmationDialogLayout(open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        sheet={sheet}
        stackOpen={stackOpen}
        hideCloseButton
        overlayClassName={DELETE_CONFIRMATION_DIALOG_OVERLAY_CLASS}
        className={contentClassName}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
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
            variant={isDeactivate ? 'destructive' : 'default'}
            onClick={onConfirm}
            isLoading={isLoading}
            className="rounded-full px-5"
          >
            {isLoading ? loadingLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
