'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  DELETE_CONFIRMATION_DIALOG_CONTENT_CLASS,
  DELETE_CONFIRMATION_DIALOG_OVERLAY_CLASS,
} from '@/shared/components/ui/DeleteConfirmationDialog';

export type TeacherBranchConfirmVariant = 'add' | 'remove' | 'selectAll' | 'clear';

export interface TeacherBranchConfirmState {
  variant: TeacherBranchConfirmVariant;
  teacherName: string;
  branchId?: string;
  branchName?: string;
  branchNames?: string[];
  selectAllIds?: string[];
}

interface TeacherBranchAssignConfirmDialogProps {
  state: TeacherBranchConfirmState | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function TeacherBranchAssignConfirmDialog({
  state,
  onOpenChange,
  onConfirm,
}: TeacherBranchAssignConfirmDialogProps) {
  const t = useTranslations('teachers');
  const tCommon = useTranslations('common');
  const open = state !== null;

  const copy = useMemo(() => {
    if (!state) {
      return null;
    }

    const branchNamesList = state.branchNames?.join(', ') ?? '';

    switch (state.variant) {
      case 'add':
        return {
          title: t('branchAssignConfirmTitle'),
          description: t('branchAssignConfirmMessage', {
            teacherName: state.teacherName,
            branchName: state.branchName ?? '',
          }),
          confirmLabel: tCommon('confirm'),
          destructive: false,
        };
      case 'remove':
        return {
          title: t('branchRemoveConfirmTitle'),
          description: t('branchRemoveConfirmMessage', {
            teacherName: state.teacherName,
            branchName: state.branchName ?? '',
          }),
          confirmLabel: tCommon('confirm'),
          destructive: true,
        };
      case 'selectAll':
        return {
          title: t('branchSelectAllConfirmTitle'),
          description: t('branchSelectAllConfirmMessage', {
            teacherName: state.teacherName,
            branchNames: branchNamesList,
          }),
          confirmLabel: tCommon('confirm'),
          destructive: false,
        };
      case 'clear':
        return {
          title: t('branchClearConfirmTitle'),
          description: t('branchClearConfirmMessage', {
            teacherName: state.teacherName,
          }),
          confirmLabel: tCommon('confirm'),
          destructive: true,
        };
      default:
        return null;
    }
  }, [state, t, tCommon]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        sheet={false}
        stackOpen={open}
        overlayClassName={DELETE_CONFIRMATION_DIALOG_OVERLAY_CLASS}
        className={cn(
          DELETE_CONFIRMATION_DIALOG_CONTENT_CLASS,
          'rounded-2xl border border-[rgba(14,14,16,0.08)] shadow-[0_20px_50px_rgba(15,23,42,0.18)]',
        )}
      >
        {copy ? (
          <>
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-base font-semibold text-[#0e0e10]">
                {copy.title}
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-[#8b8b90]">
                {copy.description}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-full px-5"
              >
                {tCommon('cancel')}
              </Button>
              <Button
                type="button"
                variant={copy.destructive ? 'destructive' : 'default'}
                onClick={onConfirm}
                className={cn(
                  'rounded-full px-5',
                  !copy.destructive && 'bg-[#1010a3] text-white hover:bg-[#1010a3]/90',
                )}
              >
                {copy.confirmLabel}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
