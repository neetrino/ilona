'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { TeacherLessonDetailSheet } from '@/features/daily-duties/components/TeacherLessonDetailSheet';
import { useLesson } from '@/features/lessons';
import { useHistoryBack } from '@/shared/hooks/useHistoryBack';
import { TEACHER_DAILY_DUTIES_BASE_PATH } from '@/shared/lib/role-routes';
import { formatAppDateTime } from '@/shared/lib/app-timezone';
import { readUrlSearchParam } from '@/shared/lib/url-search-params';
import type { DailyDutiesLessonDetailTab } from '@/features/daily-duties/components/daily-duties.types';

function parseLessonTab(value: string | null): DailyDutiesLessonDetailTab {
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

export default function TeacherDailyDutiesLessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const tCommon = useTranslations('common');
  const tCalendar = useTranslations('dailyDuties');
  const resolvedParams = use(params);
  const { searchParams, urlRevision, replaceParams } = useAppSearchUrl();
  const [pendingTab, setPendingTab] = useState<DailyDutiesLessonDetailTab | null>(null);

  const readTabFromUrl = useCallback((): DailyDutiesLessonDetailTab => {
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

  const { data: lesson } = useLesson(resolvedParams.lessonId);
  const handleBack = useHistoryBack(TEACHER_DAILY_DUTIES_BASE_PATH);

  const handleTabChange = (tab: DailyDutiesLessonDetailTab) => {
    setPendingTab(tab);
    replaceParams({ tab: tab === 'absence' ? null : tab });
  };

  return (
    <DashboardLayout
      title={
        lesson
          ? tCalendar('lessonTitle', { name: lesson.group?.name || tCalendar('lessonUnknown') })
          : tCommon('loading')
      }
      subtitle={lesson ? formatAppDateTime(lesson.scheduledAt) : tCommon('loading')}
      onBack={handleBack}
      backLabel={tCommon('goBack')}
    >
      <TeacherLessonDetailSheet
        open
        onOpenChange={(open) => {
          if (!open) {
            handleBack();
          }
        }}
        lessonId={resolvedParams.lessonId}
        initialTab={activeTab}
        onTabChange={handleTabChange}
      />
    </DashboardLayout>
  );
}
