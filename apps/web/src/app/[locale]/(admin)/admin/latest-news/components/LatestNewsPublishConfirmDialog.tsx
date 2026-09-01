'use client';

import { Globe, GlobeLock } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui';
import {
  DELETE_CONFIRMATION_DIALOG_CONTENT_CLASS,
  DELETE_CONFIRMATION_DIALOG_OVERLAY_CLASS,
} from '@/shared/components/ui/DeleteConfirmationDialog';
import { cn } from '@/shared/lib/utils';

type LatestNewsPublishConfirmDialogProps = {
  open: boolean;
  isPublishing: boolean;
  isPending: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function LatestNewsPublishConfirmDialog({
  open,
  isPublishing,
  isPending,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onOpenChange,
  onConfirm,
}: LatestNewsPublishConfirmDialogProps) {
  const Icon = isPublishing ? Globe : GlobeLock;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        sheet={false}
        overlayClassName={DELETE_CONFIRMATION_DIALOG_OVERLAY_CLASS}
        className={cn(
          DELETE_CONFIRMATION_DIALOG_CONTENT_CLASS,
          'gap-5 sm:max-w-[420px]',
        )}
      >
        <DialogHeader className="items-center text-center sm:text-center">
          <span
            className={cn(
              'mb-1 flex size-12 items-center justify-center rounded-2xl',
              isPublishing ? 'bg-[#1010a3]/10 text-[#1010a3]' : 'bg-red-50 text-red-600',
            )}
          >
            <Icon className="size-6" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <DialogTitle className="text-lg">{title}</DialogTitle>
          <DialogDescription className="text-[14px] leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-center">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            className="h-11 min-h-11 flex-1 rounded-[15px] px-5 py-0 sm:flex-none sm:min-w-[120px]"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={isPublishing ? 'default' : 'destructive'}
            disabled={isPending}
            isLoading={isPending}
            onClick={onConfirm}
            className={
              isPublishing
                ? 'h-11 min-h-11 flex-1 rounded-[15px] bg-[#1010a3] px-5 py-0 text-white hover:bg-[#1010a3]/90 sm:flex-none sm:min-w-[120px]'
                : 'h-11 min-h-11 flex-1 rounded-[15px] px-5 py-0 sm:flex-none sm:min-w-[120px]'
            }
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
