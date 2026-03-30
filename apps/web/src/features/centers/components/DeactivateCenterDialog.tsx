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

interface DeactivateCenterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  centerName?: string;
  isLoading?: boolean;
  error?: string | null;
}

export function DeactivateCenterDialog({
  open,
  onOpenChange,
  onConfirm,
  centerName,
  isLoading = false,
  error,
}: DeactivateCenterDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Deactivate Center</DialogTitle>
          <DialogDescription>
            {centerName
              ? `Are you sure you want to deactivate ${centerName}? You can activate this center again later.`
              : 'Are you sure you want to deactivate this center? You can activate it again later.'}
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
            {isLoading ? 'Deactivating...' : 'Deactivate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

