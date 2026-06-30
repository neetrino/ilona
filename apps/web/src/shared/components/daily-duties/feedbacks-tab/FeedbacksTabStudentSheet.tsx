'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { PortalSheetPortal } from '@/shared/components/ui/portal-sheet-portal';
import { usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import { cn } from '@/shared/lib/utils';
import {
  PORTAL_FORM_SHEET_SCROLL_CLASS,
  portalFormSheetContentClass,
} from '@/shared/lib/portal-form-sheet-classes';
import type { FeedbackStudentItem } from './feedbacks-tab.types';

interface FeedbacksTabStudentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: FeedbackStudentItem | null;
  hasSavedFeedback?: boolean;
  children: ReactNode;
}

export function FeedbacksTabStudentSheet({
  open,
  onOpenChange,
  student,
  hasSavedFeedback = false,
  children,
}: FeedbacksTabStudentSheetProps) {
  const t = useTranslations('dailyDuties.feedback');
  const [isDialogOpen, setIsDialogOpen] = useState(open);

  useEffect(() => {
    setIsDialogOpen(open);
  }, [open]);

  const requestClose = useCallback(() => {
    setIsDialogOpen(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const { dragStyle, dragHandleProps, resetDrag } = usePortalSheetDrag({
    onClose: requestClose,
    enabled: isDialogOpen,
  });

  useEffect(() => {
    if (!open) {
      resetDrag();
    }
  }, [open, resetDrag]);

  const displayName = student
    ? `${student.user.firstName} ${student.user.lastName}`.trim()
    : '';

  return (
    <DialogPrimitive.Root open={isDialogOpen} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
      <PortalSheetPortal
        open={isDialogOpen}
        dragStyle={dragStyle}
        contentClassName={portalFormSheetContentClass('2xl')}
        contentClassName={cn(portalFormSheetContentClass('2xl'), 'bg-[#f8f9fb]')}
        contentProps={{ 'aria-describedby': undefined }}
      >
        <div className="relative flex h-9 w-full items-center justify-center bg-transparent min-[1367px]:hidden">
          <div className="absolute inset-x-0 -top-2 h-14" style={{ touchAction: 'pan-y' }} {...dragHandleProps} />
          <div className="h-1.5 w-14 rounded-full bg-slate-400" />
        </div>

        <div className="shrink-0 bg-transparent px-4 pb-6 pt-1 min-[1367px]:px-6 min-[1367px]:pb-5 min-[1367px]:pt-6">
          <DialogPrimitive.Title className="break-words text-xl font-semibold leading-snug text-[#1010a3] min-[1367px]:text-lg min-[1367px]:text-[#3b3b40]">
            {displayName || t('editFeedback')}
          </DialogPrimitive.Title>
          {student && hasSavedFeedback ? (
            <p className="mt-2 text-sm font-medium text-emerald-600">{t('feedbackProvided')}</p>
          ) : null}
        </div>

        <div className={cn(PORTAL_FORM_SHEET_SCROLL_CLASS, 'min-h-0 flex-1 bg-transparent pt-2')}>{children}</div>
      </PortalSheetPortal>
    </DialogPrimitive.Root>
  );
}
