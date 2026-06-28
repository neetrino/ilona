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
  DELETE_CONFIRMATION_DIALOG_CONTENT_CLASS,
  DELETE_CONFIRMATION_DIALOG_OVERLAY_CLASS,
} from '@/shared/components/ui';

export interface CrmDeleteLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function CrmDeleteLeadDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  error,
}: CrmDeleteLeadDialogProps) {
  const t = useTranslations('crm');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        sheet={false}
        overlayClassName={DELETE_CONFIRMATION_DIALOG_OVERLAY_CLASS}
        className={DELETE_CONFIRMATION_DIALOG_CONTENT_CLASS}
      >
        <DialogHeader>
          <DialogTitle>{t('deleteLead')}</DialogTitle>
          <DialogDescription>Are you sure you want to delete this lead?</DialogDescription>
        </DialogHeader>
        {error ? (
          <div className="rounded-[15px] border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : null}
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="rounded-full px-5"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            isLoading={isLoading}
            className="rounded-full px-5"
          >
            {isLoading ? 'Deleting...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
