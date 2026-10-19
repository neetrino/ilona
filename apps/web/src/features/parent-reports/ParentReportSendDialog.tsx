'use client';

import { useTranslations } from 'next-intl';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui';

export function ParentReportSendDialog({
  open,
  count,
  pending,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  count: number;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const t = useTranslations('parentReportsPage');
  const tCommon = useTranslations('common');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent sheet={false} className="w-[calc(100%-1.5rem)] max-w-md rounded-[15px] p-5 sm:w-full">
        <DialogHeader>
          <DialogTitle>{t('sendAllTitle')}</DialogTitle>
          <DialogDescription>{t('sendAllBody', { count })}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" className="rounded-full px-5" disabled={pending} onClick={() => onOpenChange(false)}>
            {tCommon('cancel')}
          </Button>
          <Button type="button" className="rounded-full px-5" disabled={count === 0} isLoading={pending} onClick={onConfirm}>
            {t('confirmSend')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
