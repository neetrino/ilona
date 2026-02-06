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
  itemName?: string;
  isLoading?: boolean;
  error?: string;
  title?: string;
  itemType?: 'group' | 'center';
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  itemName,
  isLoading = false,
  error,
  title,
  itemType = 'group',
}: DeleteConfirmationDialogProps) {
  const dialogTitle = title || `Delete ${itemType === 'group' ? 'Group' : 'Center'}`;
  const itemLabel = itemType === 'group' ? 'group' : 'center';
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {itemName
              ? `Are you sure you want to delete ${itemName}? This action cannot be undone and will permanently remove the ${itemLabel} and all associated data.`
              : `Are you sure you want to delete this ${itemLabel}? This action cannot be undone and will permanently remove the ${itemLabel} and all associated data.`}
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

