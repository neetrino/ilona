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

interface CompleteLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  lessonName?: string;
  isLoading?: boolean;
  error?: string | null;
}

export function CompleteLessonDialog({
  open,
  onOpenChange,
  onConfirm,
  lessonName,
  isLoading = false,
  error,
}: CompleteLessonDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mark Lesson as Completed</DialogTitle>
          <DialogDescription>
            {lessonName
              ? `Are you sure you want to mark "${lessonName}" as completed? This action will update the lesson status.`
              : 'Are you sure you want to mark this lesson as completed? This action will update the lesson status.'}
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
            onClick={onConfirm}
            isLoading={isLoading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading ? 'Completing...' : 'Mark as Completed'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

