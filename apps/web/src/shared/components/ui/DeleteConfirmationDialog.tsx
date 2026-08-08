'use client';

import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/ui/dialog';

/** Centered delete modal on all breakpoints. */
export const DELETE_CONFIRMATION_DIALOG_CONTENT_CLASS =
  'w-[calc(100%-1.5rem)] max-w-md rounded-[15px] p-5 duration-500 [animation-timing-function:cubic-bezier(0.16,1,0.3,1)] sm:w-full';

/** @deprecated Same as DELETE_CONFIRMATION_DIALOG_CONTENT_CLASS */
export const DELETE_CONFIRMATION_DIALOG_DESKTOP_CONTENT_CLASS =
  DELETE_CONFIRMATION_DIALOG_CONTENT_CLASS;

/** @deprecated Delete confirmation is always a centered modal. */
export const DELETE_CONFIRMATION_DIALOG_MOBILE_CONTENT_CLASS =
  DELETE_CONFIRMATION_DIALOG_CONTENT_CLASS;

export const DELETE_CONFIRMATION_DIALOG_OVERLAY_CLASS =
  'duration-500 [animation-timing-function:cubic-bezier(0.16,1,0.3,1)]';

export function useDeleteConfirmationDialogLayout(open: boolean) {
  return {
    sheet: false as const,
    stackOpen: open,
    contentClassName: DELETE_CONFIRMATION_DIALOG_CONTENT_CLASS,
  };
}

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
  const { sheet, stackOpen, contentClassName } = useDeleteConfirmationDialogLayout(open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        sheet={sheet}
        stackOpen={stackOpen}
        overlayClassName={DELETE_CONFIRMATION_DIALOG_OVERLAY_CLASS}
        className={contentClassName}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {error ? (
          <div
            className="rounded-[15px] border border-red-200 bg-red-50 p-3"
            role="alert"
          >
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
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="destructive"
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
