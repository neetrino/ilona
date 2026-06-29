'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLesson } from '@/features/lessons';
import { PortalFormSheetDragHandle } from '@/shared/components/ui/portal-form-sheet-drag-handle';
import { PortalSheetPortal } from '@/shared/components/ui/portal-sheet-portal';
import { usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import { cn } from '@/shared/lib/utils';
import {
  PORTAL_FORM_SHEET_HEADER_CLASS,
  PORTAL_FORM_SHEET_SCROLL_CLASS,
  portalFormSheetContentClass,
} from '@/shared/lib/portal-form-sheet-classes';
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
}

export function AdminLessonDetailSheet({
  open,
  onOpenChange,
  lessonId,
  initialTab = 'absence',
  teacherOptions,
  showAdminActions = true,
}: AdminLessonDetailSheetProps) {
  const t = useTranslations('calendar');
  const [isDialogOpen, setIsDialogOpen] = useState(open);
  const [activeTab, setActiveTab] = useState<AdminLessonTab>(initialTab);
  const { data: lesson } = useLesson(lessonId ?? '', open && Boolean(lessonId));

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

  const { dragStyle, dragHandleProps, resetDrag } = usePortalSheetDrag({
    onClose: requestClose,
    enabled: isDialogOpen,
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
    ? `${new Date(lesson.scheduledAt).toLocaleDateString()} at ${new Date(lesson.scheduledAt).toLocaleTimeString()}`
    : t('lessonLoadingSubtitle');

  return (
    <DialogPrimitive.Root open={isDialogOpen} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
      <PortalSheetPortal open={isDialogOpen} dragStyle={dragStyle} contentClassName={portalFormSheetContentClass('2xl')} contentProps={{ 'aria-describedby': undefined }}>
          <PortalFormSheetDragHandle dragHandleProps={dragHandleProps} />

          <div className={cn(PORTAL_FORM_SHEET_HEADER_CLASS, 'pb-3 pt-2 min-[1367px]:pb-5 min-[1367px]:pt-6')}>
            <div className="flex items-start justify-between gap-3">
              <DialogPrimitive.Title className="min-w-0 flex-1 break-words text-xl font-semibold leading-snug text-[#1010a3] min-[1367px]:text-lg min-[1367px]:text-[#3b3b40]">
                {title}
              </DialogPrimitive.Title>
              {lessonId && showAdminActions ? (
                <AdminLessonActions
                  lessonId={lessonId}
                  teacherOptions={teacherOptions}
                  onDeleted={requestClose}
                  variant="menu"
                />
              ) : null}
            </div>
            <p className="mt-1 hidden text-sm text-[#8b8b90] min-[1367px]:block">{subtitle}</p>
          </div>

          <div
            className={cn(
              PORTAL_FORM_SHEET_SCROLL_CLASS,
              'min-h-0 flex-1 pb-[calc(1.5rem+env(safe-area-inset-bottom))] min-[1367px]:pb-6',
            )}
          >
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
          </div>
        </PortalSheetPortal>
    </DialogPrimitive.Root>
  );
}
