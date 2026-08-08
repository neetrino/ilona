'use client';

import { AlertTriangle, Trash2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DELETE_CONFIRMATION_DIALOG_OVERLAY_CLASS,
  useDeleteConfirmationDialogLayout,
} from '@/shared/components/ui';
import {
  ADMIN_OUTLINE_BUTTON_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
} from '@/shared/lib/admin-control-theme';

const CHAT_DELETE_DIALOG_CLASS =
  'w-[calc(100%-1.5rem)] max-w-[420px] gap-0 overflow-hidden rounded-[20px] border border-[rgba(14,14,16,0.07)] bg-[#f8f9fb] p-0 shadow-xl duration-500 [animation-timing-function:cubic-bezier(0.16,1,0.3,1)] sm:w-full';

interface ChatGroupDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  subtitle: string;
  groupName: string;
  warningText: string;
  isLoading?: boolean;
  error?: string | null;
  cancelLabel: string;
  confirmLabel: string;
  loadingLabel: string;
}

export function ChatGroupDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  subtitle,
  groupName,
  warningText,
  isLoading = false,
  error,
  cancelLabel,
  confirmLabel,
  loadingLabel,
}: ChatGroupDeleteDialogProps) {
  const { sheet, stackOpen } = useDeleteConfirmationDialogLayout(open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        sheet={sheet}
        stackOpen={stackOpen}
        hideCloseButton
        overlayClassName={DELETE_CONFIRMATION_DIALOG_OVERLAY_CLASS}
        className={CHAT_DELETE_DIALOG_CLASS}
      >
        <div className="flex flex-col items-center px-6 pb-2 pt-8 text-center">
          <div
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 ring-8 ring-red-50/60"
            aria-hidden
          >
            <Trash2 className="h-6 w-6 text-red-600" strokeWidth={1.75} />
          </div>
          <DialogTitle className="text-lg font-semibold tracking-tight text-[#3b3b40]">
            {title}
          </DialogTitle>
          <DialogDescription className="mt-2 max-w-[320px] text-sm leading-relaxed text-[#8b8b90]">
            {subtitle}
          </DialogDescription>
        </div>

        <div className="px-6 pb-4">
          <div className="rounded-[15px] border border-[rgba(14,14,16,0.07)] bg-white px-4 py-3 shadow-sm">
            <p className="truncate text-center text-sm font-semibold text-[#3b3b40]">{groupName}</p>
          </div>
        </div>

        <div className="px-6 pb-2">
          <div className="flex gap-3 rounded-[15px] border border-amber-200/80 bg-amber-50/90 px-4 py-3">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
              strokeWidth={1.75}
              aria-hidden
            />
            <p className="text-left text-sm leading-relaxed text-amber-900/90">{warningText}</p>
          </div>
        </div>

        {error ? (
          <div className="px-6 pb-2">
            <div
              className="rounded-[15px] border border-red-200 bg-red-50 px-4 py-3"
              role="alert"
            >
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        ) : null}

        <div className="mt-2 flex flex-col-reverse gap-2 border-t border-[rgba(14,14,16,0.07)] bg-white/70 px-6 py-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className={cn(
              ADMIN_OUTLINE_BUTTON_CLASS,
              'w-full border-[rgba(14,14,16,0.07)] text-[#3b3b40] hover:bg-slate-50 sm:w-auto',
            )}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            isLoading={isLoading}
            className={cn(
              ADMIN_PRIMARY_BUTTON_CLASS,
              'w-full bg-red-600 text-white hover:bg-red-700 sm:w-auto',
            )}
          >
            {isLoading ? loadingLabel : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
