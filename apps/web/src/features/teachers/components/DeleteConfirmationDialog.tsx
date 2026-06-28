'use client';

import { DeleteConfirmationDialog as BaseDeleteConfirmationDialog } from '@/shared/components/ui';

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  teacherName?: string;
  isLoading?: boolean;
  error?: string | null;
  title?: string;
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  teacherName,
  isLoading = false,
  error,
  title,
}: DeleteConfirmationDialogProps) {
  const isBulkDelete = teacherName?.includes('teachers') || teacherName?.match(/\d+\s+teachers?/i);
  const dialogTitle = title || (isBulkDelete ? 'Delete Teachers' : 'Delete Teacher');
  const description = teacherName
    ? `Are you sure you want to delete ${teacherName}? This action cannot be undone and will permanently remove ${isBulkDelete ? 'these teachers' : 'the teacher'} and all associated data.`
    : 'Are you sure you want to delete this teacher? This action cannot be undone and will permanently remove the teacher and all associated data.';

  return (
    <BaseDeleteConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title={dialogTitle}
      description={description}
      isLoading={isLoading}
      error={error}
      confirmLabel="Delete"
      loadingLabel="Deleting..."
    />
  );
}
