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

interface BulkDeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  lessonCount: number;
  isLoading?: boolean;
  error?: string | null;
}

export function BulkDeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  lessonCount,
  isLoading = false,
  error,
}: BulkDeleteConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Selected Lessons</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}? 
            This action cannot be undone and will permanently remove {lessonCount === 1 ? 'the lesson' : 'these lessons'} 
            and all associated data (attendance records, feedback, etc.).
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

