'use client';

import { DeleteConfirmationDialog as BaseDeleteConfirmationDialog } from '@/shared/components/ui';

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
  description?: string;
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
    lessonCount === 1
      ? 'Are you sure you want to delete this lesson? This cannot be undone and will permanently remove the lesson and all associated data (attendance records, feedback, etc.).'
      : `Are you sure you want to delete ${lessonCount} lessons? This cannot be undone and will permanently remove these lessons and all associated data (attendance records, feedback, etc.).`;

  return (
    <BaseDeleteConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title={title ?? defaultTitle}
      description={description ?? defaultDescription}
      isLoading={isLoading}
      error={error}
      confirmLabel={confirmLabel}
      loadingLabel="Deleting..."
    />
  );
}
