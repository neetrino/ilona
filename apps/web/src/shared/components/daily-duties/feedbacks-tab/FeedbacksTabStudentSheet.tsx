'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { PortalFormSheetScrollArea } from '@/shared/components/ui/portal-form-sheet-scroll-area';
import { PortalSheetPortal } from '@/shared/components/ui/portal-sheet-portal';
import { PortalFormSheetDragHandle } from '@/shared/components/ui/portal-form-sheet-drag-handle';
import { usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import { cn } from '@/shared/lib/utils';
import {
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

  const { dragStyle, dragHandleProps, scrollContentProps, resetDrag } = usePortalSheetDrag({
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
        sheetContentRef={scrollContentProps.ref}
        contentClassName={cn(portalFormSheetContentClass('2xl'), 'bg-[#f8f9fb]')}
        contentProps={{ 'aria-describedby': undefined }}
      >
        <PortalFormSheetDragHandle dragHandleProps={dragHandleProps} />

        <div className="shrink-0 bg-transparent px-4 pb-6 pt-1 tablet:px-6 tablet:pb-5 tablet:pt-6">
          <DialogPrimitive.Title className="break-words text-xl font-semibold leading-snug text-[#1010a3] tablet:text-lg tablet:text-[#3b3b40]">
            {displayName || t('editFeedback')}
          </DialogPrimitive.Title>
          {student && hasSavedFeedback ? (
            <p className="mt-2 text-sm font-medium text-emerald-600">{t('feedbackProvided')}</p>
          ) : null}
        </div>

        <PortalFormSheetScrollArea
          className="min-h-0 flex-1 bg-transparent pt-2"
        >
          {children}
        </PortalFormSheetScrollArea>
      </PortalSheetPortal>
    </DialogPrimitive.Root>
  );
}
