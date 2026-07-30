'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Label,
  DELETE_CONFIRMATION_DIALOG_OVERLAY_CLASS,
  useDeleteConfirmationDialogLayout,
} from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { ADMIN_TEXTAREA_CLASS } from './edit-student-form/edit-student-form.constants';

export type StudentStatusDialogAction = 'activate' | 'deactivate';

interface StudentStatusConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason?: string) => void;
  action: StudentStatusDialogAction;
  studentName?: string;
  isLoading?: boolean;
  error?: string | null;
}

export function StudentStatusConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  action,
  studentName,
  isLoading = false,
  error,
}: StudentStatusConfirmationDialogProps) {
  const t = useTranslations('students');
  const tCommon = useTranslations('common');
  const tTeachers = useTranslations('teachers');
  const isDeactivate = action === 'deactivate';
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setReason('');
      setReasonError(null);
    }
  }, [open]);

  const title = isDeactivate ? t('studentStatusDeactivateTitle') : t('studentStatusActivateTitle');
  const message =
    studentName && studentName.trim().length > 0
      ? isDeactivate
        ? t('studentStatusDeactivateWithName', { name: studentName })
        : t('studentStatusActivateWithName', { name: studentName })
      : isDeactivate
        ? t('studentStatusDeactivateGeneric')
        : t('studentStatusActivateGeneric');
  const confirmLabel = isDeactivate ? tTeachers('deactivate') : tTeachers('activate');
  const loadingLabel = isDeactivate ? t('deactivatingStudent') : t('activatingStudent');
  const { sheet, stackOpen, contentClassName } = useDeleteConfirmationDialogLayout(open);

  const handleConfirm = () => {
    if (isDeactivate) {
      const trimmed = reason.trim();
      if (!trimmed) {
        setReasonError(t('deactivateReasonRequired'));
        return;
      }
      onConfirm(trimmed);
      return;
    }
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        sheet={sheet}
        stackOpen={stackOpen}
        hideCloseButton
        overlayClassName={DELETE_CONFIRMATION_DIALOG_OVERLAY_CLASS}
        className={contentClassName}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>

        {isDeactivate ? (
          <div className="space-y-2">
            <Label htmlFor="student-deactivate-reason">
              {t('deactivateReasonLabel')} <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="student-deactivate-reason"
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                if (reasonError) setReasonError(null);
              }}
              rows={3}
              maxLength={500}
              placeholder={t('deactivateReasonPlaceholder')}
              disabled={isLoading}
              className={cn(
                ADMIN_TEXTAREA_CLASS,
                reasonError ? 'border-red-300' : '',
                isLoading ? 'cursor-not-allowed bg-slate-100' : '',
              )}
            />
            {reasonError ? <p className="text-sm text-red-600">{reasonError}</p> : null}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[15px] border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : null}
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="rounded-full px-5"
          >
            {tCommon('cancel')}
          </Button>
          <Button
            type="button"
            variant={isDeactivate ? 'destructive' : 'default'}
            onClick={handleConfirm}
            isLoading={isLoading}
            disabled={isLoading || (isDeactivate && reason.trim().length === 0)}
            className="rounded-full px-5"
          >
            {isLoading ? loadingLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const NOTES_MAX_LENGTH = 500;

/** Prepend a dated status note to existing student notes (max 500 chars). */
export function buildStudentStatusNote(
  existingNotes: string | null | undefined,
  label: string,
  detail?: string,
): string {
  const stamp = new Date().toISOString().slice(0, 10);
  const trimmedDetail = detail?.trim();
  const entry = trimmedDetail ? `[${label} ${stamp}] ${trimmedDetail}` : `[${label} ${stamp}]`;
  const previous = existingNotes?.trim();
  const combined = previous ? `${entry}\n\n${previous}` : entry;
  if (combined.length <= NOTES_MAX_LENGTH) return combined;
  return combined.slice(0, NOTES_MAX_LENGTH);
}

/** @deprecated Use buildStudentStatusNote */
export function buildStudentDeactivationNotes(
  existingNotes: string | null | undefined,
  reason: string,
  deactivatedLabel: string,
): string {
  return buildStudentStatusNote(existingNotes, deactivatedLabel, reason);
}
