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

export type GroupStatusDialogAction = 'activate' | 'deactivate';

interface GroupStatusConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  action: GroupStatusDialogAction;
  groupName?: string;
  isLoading?: boolean;
  error?: string;
}

export function GroupStatusConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  action,
  groupName,
  isLoading = false,
  error,
}: GroupStatusConfirmationDialogProps) {
  const isDeactivate = action === 'deactivate';
  const title = isDeactivate ? 'Deactivate group' : 'Activate group';
  const baseMessage = isDeactivate
    ? 'Are you sure you want to deactivate this group?'
    : 'Are you sure you want to activate this group?';
  const message =
    groupName && groupName.trim().length > 0
      ? isDeactivate
        ? `Are you sure you want to deactivate "${groupName}"?`
        : `Are you sure you want to activate "${groupName}"?`
      : baseMessage;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
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
            variant={isDeactivate ? 'destructive' : 'default'}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {isLoading ? 'Saving…' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
