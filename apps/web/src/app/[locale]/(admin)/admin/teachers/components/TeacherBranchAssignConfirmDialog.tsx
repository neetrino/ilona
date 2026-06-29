'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Building2, UserRound } from 'lucide-react';
import { cn, getContrastColor, lightenColor } from '@/shared/lib/utils';
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

export interface BranchConfirmOption {
  id: string;
  label: string;
  colorHex?: string | null;
}

interface TeacherBranchAssignConfirmDialogProps {
  state: TeacherBranchConfirmState | null;
  branchOptions: BranchConfirmOption[];
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

interface DisplayBranch {
  id: string;
  name: string;
  colorHex?: string | null;
}

function resolveDisplayBranches(
  state: TeacherBranchConfirmState,
  branchOptions: BranchConfirmOption[],
): DisplayBranch[] {
  const optionById = new Map(branchOptions.map((option) => [option.id, option]));

  if (state.variant === 'add' || state.variant === 'remove') {
    if (!state.branchId) {
      return [];
    }
    const option = optionById.get(state.branchId);
    return [
      {
        id: state.branchId,
        name: state.branchName ?? option?.label ?? state.branchId,
        colorHex: option?.colorHex,
      },
    ];
  }

  const ids = state.selectAllIds ?? [];
  return ids.flatMap((id): DisplayBranch[] => {
    const option = optionById.get(id);
    if (!option) {
      return [];
    }
    return [{ id, name: option.label, colorHex: option.colorHex }];
  });
}

function BranchConfirmChip({ name, colorHex }: { name: string; colorHex?: string | null }) {
  const primaryColor = colorHex || '#253046';
  const softColor = lightenColor(primaryColor, 0.62);
  const borderColor = lightenColor(primaryColor, 0.35);
  const textColor = getContrastColor(primaryColor) === 'white' ? '#1e293b' : '#334155';

  return (
    <span
      className="inline-flex max-w-full items-center rounded-2xl px-3 py-2 text-xs font-semibold tracking-[0.01em] shadow-[0_2px_8px_rgba(15,23,42,0.06)]"
      style={{
        backgroundColor: softColor,
        color: textColor,
        border: `1px solid ${borderColor}`,
      }}
      title={name}
    >
      <Building2 className="mr-1.5 h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
      <span className="truncate">{name}</span>
    </span>
  );
}

export function TeacherBranchAssignConfirmDialog({
  state,
  branchOptions,
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

    const branches = resolveDisplayBranches(state, branchOptions);

    switch (state.variant) {
      case 'add':
        return {
          title: t('branchAssignConfirmTitle'),
          lead: t('branchAssignConfirmLead'),
          branches,
          confirmLabel: tCommon('confirm'),
          destructive: false,
        };
      case 'remove':
        return {
          title: t('branchRemoveConfirmTitle'),
          lead: t('branchRemoveConfirmLead'),
          branches,
          confirmLabel: tCommon('confirm'),
          destructive: true,
        };
      case 'selectAll':
        return {
          title: t('branchSelectAllConfirmTitle'),
          lead: t('branchSelectAllConfirmLead'),
          branches,
          confirmLabel: tCommon('confirm'),
          destructive: false,
        };
      case 'clear':
        return {
          title: t('branchClearConfirmTitle'),
          lead: t('branchClearConfirmLead'),
          branches,
          confirmLabel: tCommon('confirm'),
          destructive: true,
        };
      default:
        return null;
    }
  }, [state, branchOptions, t, tCommon]);

  const ariaDescription = copy
    ? `${copy.lead} ${state?.teacherName ?? ''} ${copy.branches.map((branch) => branch.name).join(', ')}`
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        sheet={false}
        stackOpen={open}
        overlayClassName={DELETE_CONFIRMATION_DIALOG_OVERLAY_CLASS}
        className={cn(
          DELETE_CONFIRMATION_DIALOG_CONTENT_CLASS,
          'gap-0 overflow-hidden rounded-2xl border border-[rgba(14,14,16,0.08)] p-0 shadow-[0_24px_60px_rgba(15,23,42,0.2)]',
        )}
      >
        {copy && state ? (
          <>
            <div
              className={cn(
                'border-b border-[rgba(14,14,16,0.07)] px-5 py-4',
                copy.destructive ? 'bg-gradient-to-r from-red-50/80 to-white' : 'bg-gradient-to-r from-[#f0f0ff]/80 to-white',
              )}
            >
              <DialogHeader className="space-y-3 text-left">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                      copy.destructive ? 'bg-red-100 text-red-600' : 'bg-[#f0f0ff] text-[#1010a3]',
                    )}
                  >
                    <Building2 className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 space-y-1">
                    <DialogTitle className="text-base font-semibold text-[#0e0e10]">
                      {copy.title}
                    </DialogTitle>
                    <DialogDescription className="text-sm leading-relaxed text-[#8b8b90]">
                      {copy.lead}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <div className="space-y-4 px-5 py-4">
              <div className="rounded-2xl border border-[rgba(14,14,16,0.07)] bg-[#fafafa] p-3.5">
                <p className="mb-2 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-[#8b8b90]">
                  {t('branchConfirmTeacherLabel')}
                </p>
                <div className="inline-flex max-w-full items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f0f0ff] text-[#1010a3]">
                    <UserRound className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="truncate text-sm font-semibold text-[#0e0e10]">{state.teacherName}</span>
                </div>
              </div>

              {copy.branches.length > 0 ? (
                <div>
                  <p className="mb-2.5 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-[#8b8b90]">
                    {copy.destructive ? t('branchConfirmRemoveLabel') : t('branchConfirmAssignLabel')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {copy.branches.map((branch) => (
                      <BranchConfirmChip
                        key={branch.id}
                        name={branch.name}
                        colorHex={branch.colorHex}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              <p className="sr-only">{ariaDescription}</p>
            </div>

            <DialogFooter className="gap-2 border-t border-[rgba(14,14,16,0.07)] bg-[#fafafa]/60 px-5 py-4 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-full border-[rgba(14,14,16,0.12)] px-5 hover:bg-white"
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
