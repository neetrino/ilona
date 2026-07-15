'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Label,
  DELETE_CONFIRMATION_DIALOG_OVERLAY_CLASS,
  useDeleteConfirmationDialogLayout,
} from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { ADMIN_TEXTAREA_CLASS } from './edit-group-form/edit-group-form.constants';

export type GroupStatusDialogAction = 'activate' | 'deactivate';

interface GroupStatusConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason?: string) => void;
  action: GroupStatusDialogAction;
  groupName?: string;
  isLoading?: boolean;
  error?: string;
  /** When true (manager deactivate), require a reason before confirming. */
  requireReason?: boolean;
}

export function GroupStatusConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  action,
  groupName,
  isLoading = false,
  error,
  requireReason = false,
}: GroupStatusConfirmationDialogProps) {
  const t = useTranslations('groups');
  const tCommon = useTranslations('common');
  const isDeactivate = action === 'deactivate';
  const showReasonField = requireReason && isDeactivate;
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setReason('');
      setReasonError(null);
    }
  }, [open]);

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

  const handleConfirm = () => {
    if (showReasonField) {
      const trimmed = reason.trim();
      if (!trimmed) {
        setReasonError(t('deactivationReasonRequired'));
        return;
      }
      onConfirm(trimmed);
      return;
    }
    onConfirm();
  };

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
        {showReasonField ? (
          <div className="space-y-2">
            <Label htmlFor="group-deactivation-reason">
              {t('deactivationReasonLabel')} <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="group-deactivation-reason"
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                if (reasonError) setReasonError(null);
              }}
              rows={3}
              maxLength={500}
              placeholder={t('deactivationReasonPlaceholder')}
              disabled={isLoading}
              className={cn(
                ADMIN_TEXTAREA_CLASS,
                reasonError ? 'border-red-300' : '',
                isLoading ? 'cursor-not-allowed bg-slate-100' : '',
              )}
            />
            {reasonError ? <p className="text-sm text-red-600">{reasonError}</p> : null}
          </div>
        ) : null}
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
            onClick={handleConfirm}
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
