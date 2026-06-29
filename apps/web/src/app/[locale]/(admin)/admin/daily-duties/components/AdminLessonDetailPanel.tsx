'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { LessonDetailTabs } from '@/shared/components/daily-duties/LessonDetailTabs';
import { AbsenceTab } from '@/shared/components/daily-duties/AbsenceTab';
import { FeedbacksTab } from '@/shared/components/daily-duties/FeedbacksTab';
import { VoiceTab } from '@/shared/components/daily-duties/VoiceTab';
import { TextTab } from '@/shared/components/daily-duties/TextTab';
import { DailyPlanTab } from '@/shared/components/daily-duties/DailyPlanTab';
import { useLesson } from '@/features/lessons';
import { AdminLessonActions } from './AdminLessonActions';
import type { SubstituteTeacherOption } from './SubstituteLessonModal';
import { cn } from '@/shared/lib/utils';
import { DAILY_DUTIES_RADIUS_CLASS } from '@/shared/lib/daily-duties/daily-duties-theme';

export type AdminLessonTab = 'absence' | 'feedback' | 'voice' | 'text' | 'dailyPlan';

interface AdminLessonDetailPanelProps {
  lessonId: string;
  teacherOptions: SubstituteTeacherOption[];
  activeTab?: AdminLessonTab;
  onTabChange?: (tab: AdminLessonTab) => void;
  onDeleted?: () => void;
  variant?: 'page' | 'sheet';
  showAdminActions?: boolean;
}

export function AdminLessonDetailPanel({
  lessonId,
  teacherOptions,
  activeTab: controlledTab,
  onTabChange,
  onDeleted,
  variant = 'page',
  showAdminActions = true,
}: AdminLessonDetailPanelProps) {
  const t = useTranslations('dailyDuties');
  const [internalTab, setInternalTab] = useState<AdminLessonTab>('absence');
  const activeTab = controlledTab ?? internalTab;
  const { data: lesson, isLoading } = useLesson(lessonId);

  useEffect(() => {
    if (!onTabChange) {
      setInternalTab('absence');
    }
  }, [lessonId, onTabChange]);

  const handleTabChange = (tab: AdminLessonTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
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

  const subTeacherName = lesson.substituteTeacher?.user
    ? `${lesson.substituteTeacher.user.firstName} ${lesson.substituteTeacher.user.lastName}`.trim()
    : null;

  return (
    <>
      <div
        className={cn(
          variant === 'sheet' ? 'flex flex-col' : 'flex min-h-0 flex-1 flex-col overflow-hidden',
          variant === 'page' &&
            'rounded-none border-0 bg-white lg:rounded-[2rem] lg:border lg:border-[rgba(14,14,16,0.07)]',
        )}
      >
        {subTeacherName && (
          <div className="shrink-0 border-b border-[rgba(14,14,16,0.07)] px-4 py-3 text-sm text-[#3b3b40]">
            <p className={cn('inline-block border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900', DAILY_DUTIES_RADIUS_CLASS)}>
              <span className="font-medium">{t('substituteThisDay')}</span> {subTeacherName}
            </p>
          </div>
        )}
        <div className={variant === 'page' ? 'min-h-0 flex-1' : undefined}>
          <LessonDetailTabs
            lesson={lesson}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            showRequiredActions={false}
            layout={variant === 'sheet' ? 'flow' : 'fill'}
          >
            {{
              absence: <AbsenceTab lessonId={lessonId} />,
              feedback: <FeedbacksTab lessonId={lessonId} />,
              voice: <VoiceTab lessonId={lessonId} />,
              text: <TextTab lessonId={lessonId} />,
              dailyPlan: <DailyPlanTab lessonId={lessonId} groupId={lesson.groupId} />,
            }}
          </LessonDetailTabs>
        </div>
        {variant === 'page' && showAdminActions ? (
          <AdminLessonActions
            lessonId={lessonId}
            teacherOptions={teacherOptions}
            onDeleted={onDeleted}
            variant="footer"
          />
        ) : null}
      </div>
    </>
  );
}
