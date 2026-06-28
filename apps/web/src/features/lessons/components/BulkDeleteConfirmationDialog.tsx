'use client';

import type { ReactNode } from 'react';
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

interface BulkDeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  lessonCount: number;
  isLoading?: boolean;
  error?: string | null;
  /** Overrides default "Delete Selected Lessons" title */
  title?: string;
  /** Overrides default body copy */
  description?: ReactNode;
  confirmLabel?: string;
}

export function BulkDeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  lessonCount,
  isLoading = false,
  error,
  title,
  description,
  confirmLabel = 'Delete',
}: BulkDeleteConfirmationDialogProps) {
  const defaultTitle = lessonCount === 1 ? 'Delete lesson' : 'Delete selected lessons';
  const defaultDescription =
    lessonCount === 1 ? (
      <>
        Are you sure you want to delete this lesson? This cannot be undone and will permanently remove
        the lesson and all associated data (attendance records, feedback, etc.).
      </>
    ) : (
      <>
        Are you sure you want to delete {lessonCount} lessons? This cannot be undone and will permanently
        remove these lessons and all associated data (attendance records, feedback, etc.).
      </>
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          sheet={false}
          overlayClassName={DELETE_CONFIRMATION_DIALOG_OVERLAY_CLASS}
          className={DELETE_CONFIRMATION_DIALOG_CONTENT_CLASS}
        >
        <DialogHeader>
          <DialogTitle>{title ?? defaultTitle}</DialogTitle>
          <DialogDescription>{description ?? defaultDescription}</DialogDescription>
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
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            isLoading={isLoading}
            disabled={isLoading}
            className="rounded-full px-5"
          >
            {isLoading ? 'Deleting...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}






