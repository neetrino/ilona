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
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="lg:max-w-md lg:rounded-[15px] p-5 duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:w-full"
      >
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {teacherName
              ? `Are you sure you want to delete ${teacherName}? This action cannot be undone and will permanently remove ${isBulkDelete ? 'these teachers' : 'the teacher'} and all associated data.`
              : 'Are you sure you want to delete this teacher? This action cannot be undone and will permanently remove the teacher and all associated data.'}
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

