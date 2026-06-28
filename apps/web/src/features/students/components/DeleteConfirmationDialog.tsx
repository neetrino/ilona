'use client';

import { DeleteConfirmationDialog as BaseDeleteConfirmationDialog } from '@/shared/components/ui';

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  studentName?: string;
  isLoading?: boolean;
  error?: string | null;
  title?: string;
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  studentName,
  isLoading = false,
  error,
  title,
}: DeleteConfirmationDialogProps) {
  const isBulkDelete = studentName?.includes('students') || studentName?.match(/\d+\s+students?/i);
  const dialogTitle = title || (isBulkDelete ? 'Delete Students' : 'Delete Student');
  const description = studentName
    ? `Are you sure you want to delete ${studentName}? This action cannot be undone and will permanently remove ${isBulkDelete ? 'these students' : 'the student'} and all associated data.`
    : 'Are you sure you want to delete this student? This action cannot be undone and will permanently remove the student and all associated data.';

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
