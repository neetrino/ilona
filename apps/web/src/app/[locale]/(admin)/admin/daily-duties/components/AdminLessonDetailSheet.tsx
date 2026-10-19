'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { useLesson } from '@/features/lessons';
import { PortalFormSheetDragHandle } from '@/shared/components/ui/portal-form-sheet-drag-handle';
import { PortalFormSheetScrollArea } from '@/shared/components/ui/portal-form-sheet-scroll-area';
import { PortalSheetPortal } from '@/shared/components/ui/portal-sheet-portal';
import { usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import { formatAppDateTime } from '@/shared/lib/app-timezone';
import { cn } from '@/shared/lib/utils';
import {
  PORTAL_ALWAYS_SIDE_SHEET_CLASS,
  PORTAL_ALWAYS_SIDE_SHEET_CLOSE_BUTTON_CLASS,
  PORTAL_FORM_SHEET_HEADER_CLASS,
  portalFormSheetContentClass,
} from '@/shared/lib/portal-form-sheet-classes';
import { LessonRequiredActionsHeaderBanner } from '@/shared/components/daily-duties/LessonRequiredActionsHeaderBanner';
import { AdminLessonDetailPanel, type AdminLessonTab } from './AdminLessonDetailPanel';
import { AdminLessonActions } from './AdminLessonActions';
import type { SubstituteTeacherOption } from './SubstituteLessonModal';

interface AdminLessonDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId: string | null;
  initialTab?: AdminLessonTab;
  teacherOptions: SubstituteTeacherOption[];
  showAdminActions?: boolean;
  /** `side` always slides in from the right (no bottom sheet). */
  placement?: 'auto' | 'side';
}

export function AdminLessonDetailSheet({
  open,
  onOpenChange,
  lessonId,
  initialTab = 'absence',
  teacherOptions,
  showAdminActions = true,
  placement = 'auto',
}: AdminLessonDetailSheetProps) {
  const t = useTranslations('dailyDuties');
  const tCommon = useTranslations('common');
  const [isDialogOpen, setIsDialogOpen] = useState(open);
  const [activeTab, setActiveTab] = useState<AdminLessonTab>(initialTab);
  const { data: lesson } = useLesson(lessonId ?? '', open && Boolean(lessonId));
  const isSideSheet = placement === 'side';

  useEffect(() => {
    setIsDialogOpen(open);
  }, [open]);

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab, lessonId]);

  const requestClose = () => {
    setIsDialogOpen(false);
    onOpenChange(false);
  };

  const { dragStyle, dragHandleProps, scrollContentProps, resetDrag } = usePortalSheetDrag({
    onClose: requestClose,
    enabled: isDialogOpen && !isSideSheet,
  });

  useEffect(() => {
    if (!open) {
      resetDrag();
    }
  }, [open, resetDrag]);

  const title = lesson
    ? t('lessonTitle', { name: lesson.group?.name || t('lessonUnknown') })
    : t('lessonLoadingTitle');
  const subtitle = lesson
    ? formatAppDateTime(lesson.scheduledAt)
    : t('lessonLoadingSubtitle');

  return (
    <DialogPrimitive.Root open={isDialogOpen} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
      <PortalSheetPortal
        open={isDialogOpen}
        dragStyle={isSideSheet ? undefined : dragStyle}
        sheetContentRef={scrollContentProps.ref}
        contentClassName={isSideSheet ? PORTAL_ALWAYS_SIDE_SHEET_CLASS : portalFormSheetContentClass('2xl')}
        contentProps={{ 'aria-describedby': undefined }}
      >
          {isSideSheet ? null : <PortalFormSheetDragHandle dragHandleProps={dragHandleProps} />}

          <div className={cn(PORTAL_FORM_SHEET_HEADER_CLASS, 'pb-3 pt-2 tablet:pb-5 tablet:pt-6', isSideSheet && 'pt-5')}>
            <div className="flex items-start gap-3">
              <div className="min-w-0 shrink-0 basis-[min(100%,14rem)] sm:basis-[min(100%,16rem)]">
                <DialogPrimitive.Title className="break-words text-xl font-semibold leading-snug text-[#1010a3] tablet:text-lg tablet:text-[#3b3b40]">
                  {title}
                </DialogPrimitive.Title>
                <p className="mt-1 hidden text-sm text-[#8b8b90] tablet:block">{subtitle}</p>
              </div>
              {!showAdminActions ? (
                <div className="min-w-0 flex-1">
                  <LessonRequiredActionsHeaderBanner
                    lesson={lesson}
                    onOpenAction={(id) => setActiveTab(id)}
                  />
                </div>
              ) : (
                <div className="min-w-0 flex-1" />
              )}
              <div className="flex shrink-0 items-center gap-1 pt-0.5">
                {showAdminActions && lessonId ? (
                  <AdminLessonActions
                    lessonId={lessonId}
                    teacherOptions={teacherOptions}
                    onDeleted={requestClose}
                    menuClassName="self-center"
                  />
                ) : null}
                {isSideSheet ? (
                  <DialogPrimitive.Close
                    className={PORTAL_ALWAYS_SIDE_SHEET_CLOSE_BUTTON_CLASS}
                    aria-label={tCommon('close')}
                  >
                    <X className="h-4 w-4" />
                  </DialogPrimitive.Close>
                ) : null}
              </div>
            </div>
          </div>

          <PortalFormSheetScrollArea className="min-h-0 flex-1">
            {lessonId ? (
              <AdminLessonDetailPanel
                lessonId={lessonId}
                teacherOptions={teacherOptions}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onDeleted={requestClose}
                variant="sheet"
                showAdminActions={showAdminActions}
              />
            ) : null}
          </PortalFormSheetScrollArea>
        </PortalSheetPortal>
    </DialogPrimitive.Root>
  );
}
