'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { useLesson, type Lesson } from '@/features/lessons';
import { LessonDetailTabs } from '@/shared/components/daily-duties/LessonDetailTabs';
import { AbsenceTab } from '@/shared/components/daily-duties/AbsenceTab';
import { FeedbacksTab } from '@/shared/components/daily-duties/FeedbacksTab';
import { VoiceTab } from '@/shared/components/daily-duties/VoiceTab';
import { TextTab } from '@/shared/components/daily-duties/TextTab';
import { DailyPlanTab } from '@/shared/components/daily-duties/DailyPlanTab';
import { PortalFormSheetDragHandle } from '@/shared/components/ui/portal-form-sheet-drag-handle';
import { PortalSheetPortal } from '@/shared/components/ui/portal-sheet-portal';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';
import { usePortalSheetDrag } from '@/shared/hooks/usePortalSheetDrag';
import { formatAppDateTime } from '@/shared/lib/app-timezone';
import { cn } from '@/shared/lib/utils';
import {
  PORTAL_FORM_SHEET_CLOSE_BUTTON_CLASS,
  PORTAL_FORM_SHEET_HEADER_CLASS,
  portalFormSheetContentClass,
} from '@/shared/lib/portal-form-sheet-classes';
import type { DailyDutiesLessonDetailTab } from './daily-duties.types';

interface TeacherLessonDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId: string | null;
  initialTab?: DailyDutiesLessonDetailTab;
  onTabChange?: (tab: DailyDutiesLessonDetailTab) => void;
}

export function TeacherLessonDetailSheet({
  open,
  onOpenChange,
  lessonId,
  initialTab = 'absence',
  onTabChange,
}: TeacherLessonDetailSheetProps) {
  const t = useTranslations('dailyDuties');
  const tCommon = useTranslations('common');
  const [isDialogOpen, setIsDialogOpen] = useState(open);
  const [activeTab, setActiveTab] = useState<DailyDutiesLessonDetailTab>(initialTab);
  const { data: lesson, isLoading } = useLesson(lessonId ?? '', open && Boolean(lessonId));

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

  const handleTabChange = (tab: DailyDutiesLessonDetailTab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const { dragStyle, dragHandleProps, scrollContentProps, resetDrag } = usePortalSheetDrag({
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
    ? formatAppDateTime(lesson.scheduledAt)
    : t('lessonLoadingSubtitle');

  return (
    <DialogPrimitive.Root open={isDialogOpen} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
      <PortalSheetPortal
        open={isDialogOpen}
        dragStyle={dragStyle}
        sheetContentRef={scrollContentProps.ref}
        contentClassName={cn(
          portalFormSheetContentClass('2xl'),
          'bg-white tablet:landscape:!w-[60%] min-[1366px]:!w-[60%]',
        )}
        contentProps={{ 'aria-describedby': undefined }}
      >
        <PortalFormSheetDragHandle dragHandleProps={dragHandleProps} className="bg-white" />

        <div className={cn(PORTAL_FORM_SHEET_HEADER_CLASS, 'border-b-0 bg-white pb-3 pt-2 tablet:pb-5 tablet:pt-6')}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="break-words text-xl font-semibold leading-snug text-[#1010a3] tablet:text-lg tablet:text-[#3b3b40]">
                {title}
              </DialogPrimitive.Title>
              <p className="mt-1 hidden text-sm text-[#8b8b90] tablet:block">{subtitle}</p>
            </div>
            <DialogPrimitive.Close
              className={PORTAL_FORM_SHEET_CLOSE_BUTTON_CLASS}
              aria-label={tCommon('close')}
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <TeacherLessonDetailSheetBody
            lessonId={lessonId}
            lesson={lesson}
            isLoading={isLoading}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div>
      </PortalSheetPortal>
    </DialogPrimitive.Root>
  );
}

function TeacherLessonDetailSheetBody({
  lessonId,
  lesson,
  isLoading,
  activeTab,
  onTabChange,
}: {
  lessonId: string | null;
  lesson: Lesson | undefined;
  isLoading: boolean;
  activeTab: DailyDutiesLessonDetailTab;
  onTabChange: (tab: DailyDutiesLessonDetailTab) => void;
}) {
  const t = useTranslations('dailyDuties');

  if (isLoading || !lessonId) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-[#8b8b90]">
        {t('lessonNotFoundSubtitle')}
      </div>
    );
  }

  return (
    <LessonDetailTabs
      lesson={lesson}
      activeTab={activeTab}
      onTabChange={onTabChange}
      layout="fill"
    >
      {{
        absence: <AbsenceTab lessonId={lessonId} />,
        feedback: <FeedbacksTab lessonId={lessonId} />,
        voice: <VoiceTab lessonId={lessonId} />,
        text: <TextTab lessonId={lessonId} />,
        dailyPlan: <DailyPlanTab lessonId={lessonId} groupId={lesson.groupId} />,
      }}
    </LessonDetailTabs>
  );
}
