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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('deactivateCenterTitle')}</DialogTitle>
          <DialogDescription>
            {centerName
              ? t('deactivateCenterWithName', { name: centerName })
              : t('deactivateCenterGeneric')}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
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
            variant="destructive"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {isLoading ? t('deactivating') : t('deactivateAction')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
