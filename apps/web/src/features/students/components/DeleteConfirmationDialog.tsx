'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  DELETE_CONFIRMATION_DIALOG_OVERLAY_CLASS,
  useDeleteConfirmationDialogLayout,
} from '@/shared/components/ui';

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
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {studentName
              ? `Are you sure you want to delete ${studentName}? This action cannot be undone and will permanently remove ${isBulkDelete ? 'these students' : 'the student'} and all associated data.`
              : 'Are you sure you want to delete this student? This action cannot be undone and will permanently remove the student and all associated data.'}
          </DialogDescription>
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
            className="rounded-full px-5"
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}









