'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@/shared/components/ui';

export interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  isLoading?: boolean;
  error?: string | null;
  confirmLabel?: string;
  cancelLabel?: string;
  loadingLabel?: string;
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  isLoading = false,
  error,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  loadingLabel = 'Deleting...',
}: DeleteConfirmationDialogProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isLoading) return;
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="mx-4 w-[calc(100%-2rem)] max-w-md gap-5 p-6 sm:mx-auto sm:w-full"
        overlayClassName="bg-black/50 backdrop-blur-sm"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {error ? (
          <div
            className="rounded-lg border border-red-200 bg-red-50 p-3"
            role="alert"
          >
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : null}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
            className="min-h-10 w-full sm:w-auto"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            isLoading={isLoading}
            disabled={isLoading}
            className="min-h-10 w-full sm:w-auto"
          >
            {isLoading ? loadingLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
