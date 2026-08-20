'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { PortalFormSheetScrollArea } from '@/shared/components/ui/portal-form-sheet-scroll-area';
import { PortalSheetPortal } from '@/shared/components/ui/portal-sheet-portal';
import { cn } from '@/shared/lib/utils';
import {
  PORTAL_ALWAYS_SIDE_SHEET_CLASS,
  PORTAL_ALWAYS_SIDE_SHEET_CLOSE_BUTTON_CLASS,
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
  const tCommon = useTranslations('common');
  const [isDialogOpen, setIsDialogOpen] = useState(open);

  useEffect(() => {
    setIsDialogOpen(open);
  }, [open]);

  const requestClose = useCallback(() => {
    setIsDialogOpen(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const displayName = student
    ? `${student.user.firstName} ${student.user.lastName}`.trim()
    : '';

  return (
    <DialogPrimitive.Root open={isDialogOpen} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
      <PortalSheetPortal
        open={isDialogOpen}
        contentClassName={cn(PORTAL_ALWAYS_SIDE_SHEET_CLASS, 'bg-[#f8f9fb]')}
        contentProps={{ 'aria-describedby': undefined }}
      >
        <div className="shrink-0 bg-transparent px-4 pb-4 pt-5 tablet:px-6 tablet:pb-5 tablet:pt-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="break-words text-xl font-semibold leading-snug text-[#1010a3] tablet:text-lg tablet:text-[#3b3b40]">
                {displayName || t('editFeedback')}
              </DialogPrimitive.Title>
              {student && hasSavedFeedback ? (
                <p className="mt-2 text-sm font-medium text-emerald-600">{t('feedbackProvided')}</p>
              ) : null}
            </div>
            <DialogPrimitive.Close
              className={PORTAL_ALWAYS_SIDE_SHEET_CLOSE_BUTTON_CLASS}
              aria-label={tCommon('close')}
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>
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
