'use client';

import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { ADMIN_OUTLINE_BUTTON_CLASS, ADMIN_PRIMARY_BUTTON_CLASS } from '@/shared/lib/admin-control-theme';

export type EditGroupFormRegenerateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tForm: (key: string) => string;
  onConfirmRegenerate: () => void;
};

export function EditGroupFormRegenerateDialog({
  open,
  onOpenChange,
  tForm,
  onConfirmRegenerate,
}: EditGroupFormRegenerateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent sheet={false} className="max-w-md rounded-[15px]">
        <DialogHeader>
          <DialogTitle>{tForm('replaceLessonsTitle')}</DialogTitle>
          <DialogDescription>{tForm('replaceLessonsDescription')}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            className={cn(ADMIN_OUTLINE_BUTTON_CLASS, 'border-[rgba(14,14,16,0.07)] hover:bg-slate-50')}
            onClick={() => onOpenChange(false)}
          >
            {tForm('goBack')}
          </Button>
          <Button
            type="button"
            className={cn(ADMIN_PRIMARY_BUTTON_CLASS, 'bg-primary text-primary-foreground hover:bg-primary/90')}
            onClick={onConfirmRegenerate}
          >
            {tForm('replaceAndSave')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
