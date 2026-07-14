'use client';

import { use, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { LessonDetailTabs } from '@/shared/components/daily-duties/LessonDetailTabs';
import { AbsenceTab } from '@/shared/components/daily-duties/AbsenceTab';
import { FeedbacksTab } from '@/shared/components/daily-duties/FeedbacksTab';
import { VoiceTab } from '@/shared/components/daily-duties/VoiceTab';
import { TextTab } from '@/shared/components/daily-duties/TextTab';
import { DailyPlanTab } from '@/shared/components/daily-duties/DailyPlanTab';
import { useLesson } from '@/features/lessons';
import { ChatBackButton } from '@/shared/components/ui/chat-back-button';
import { useHistoryBack } from '@/shared/hooks/useHistoryBack';
import { TEACHER_DAILY_DUTIES_BASE_PATH } from '@/shared/lib/role-routes';
import { formatAppDateTime } from '@/shared/lib/app-timezone';
import { readUrlSearchParam } from '@/shared/lib/url-search-params';
import { cn } from '@/shared/lib/utils';
type LessonTab = 'absence' | 'feedback' | 'voice' | 'text' | 'dailyPlan';

function parseLessonTab(value: string | null): LessonTab {
  if (
    value === 'absence' ||
    value === 'feedback' ||
    value === 'voice' ||
    value === 'text' ||
    value === 'dailyPlan'
  ) {
    return value;
  }
  return 'absence';
}

const LESSON_BANNER_CLASS =
  'flex h-[calc(100vh-200px)] flex-col overflow-hidden rounded-[2rem] border border-[rgba(14,14,16,0.07)] bg-white';

function TeacherLessonDetailBanner({
  onBack,
  backLabel,
  children,
  className,
}: {
  onBack: () => void;
  backLabel: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(LESSON_BANNER_CLASS, className)}>
      <div className="flex shrink-0 items-center border-b border-[rgba(14,14,16,0.07)] px-3 py-3 sm:px-4">
        <ChatBackButton onClick={onBack} aria-label={backLabel} />
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

export default function TeacherDailyDutiesLessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const tCommon = useTranslations('common');
  const tCalendar = useTranslations('dailyDuties');
  const resolvedParams = use(params);
  const { searchParams, urlRevision, replaceParams } = useAppSearchUrl();
  const [pendingTab, setPendingTab] = useState<LessonTab | null>(null);

  const readTabFromUrl = useCallback((): LessonTab => {
    void urlRevision;
    return parseLessonTab(readUrlSearchParam('tab', searchParams));
  }, [searchParams, urlRevision]);

  const activeTab = pendingTab ?? readTabFromUrl();

  useEffect(() => {
    if (pendingTab === null) {
      return;
    }
    if (readTabFromUrl() === pendingTab) {
      setPendingTab(null);
    }
  }, [pendingTab, readTabFromUrl]);

  const { data: lesson, isLoading } = useLesson(resolvedParams.lessonId);
  const handleBack = useHistoryBack(TEACHER_DAILY_DUTIES_BASE_PATH);

  const handleTabChange = (tab: LessonTab) => {
    setPendingTab(tab);
    replaceParams({ tab: tab === 'absence' ? null : tab });
  };

  if (isLoading) {
    return (
      <DashboardLayout title={tCommon('loading')} subtitle={tCommon('loading')}>
        <TeacherLessonDetailBanner onBack={handleBack} backLabel={tCommon('goBack')}>
          <div className="flex flex-1 items-center justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
          </div>
        </TeacherLessonDetailBanner>
      </DashboardLayout>
    );
  }

  if (!lesson) {
    return (
      <DashboardLayout
        title={tCalendar('lessonNotFoundTitle')}
        subtitle={tCalendar('lessonNotFoundSubtitle')}
      >
        <TeacherLessonDetailBanner onBack={handleBack} backLabel={tCommon('goBack')}>
          <div className="flex flex-1 flex-col items-center justify-center p-12">
            <ChatBackButton onClick={handleBack} aria-label={tCommon('goBack')} />
          </div>
        </TeacherLessonDetailBanner>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={tCalendar('lessonTitle', { name: lesson.group?.name || tCalendar('lessonUnknown') })}
      subtitle={formatAppDateTime(lesson.scheduledAt)}
    >
      <TeacherLessonDetailBanner onBack={handleBack} backLabel={tCommon('goBack')}>
        <LessonDetailTabs lesson={lesson} activeTab={activeTab} onTabChange={handleTabChange}>
          {{
            absence: <AbsenceTab lessonId={resolvedParams.lessonId} />,
            feedback: <FeedbacksTab lessonId={resolvedParams.lessonId} />,
            voice: <VoiceTab lessonId={resolvedParams.lessonId} />,
            text: <TextTab lessonId={resolvedParams.lessonId} />,
            dailyPlan: (
              <DailyPlanTab lessonId={resolvedParams.lessonId} groupId={lesson.groupId} />
            ),
          }}
        </LessonDetailTabs>
      </TeacherLessonDetailBanner>
    </DashboardLayout>
  );
}
