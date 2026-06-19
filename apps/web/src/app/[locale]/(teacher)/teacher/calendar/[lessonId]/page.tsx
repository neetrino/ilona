'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { LessonDetailTabs } from '@/shared/components/calendar/LessonDetailTabs';
import { AbsenceTab } from '@/shared/components/calendar/AbsenceTab';
import { FeedbacksTab } from '@/shared/components/calendar/FeedbacksTab';
import { VoiceTab } from '@/shared/components/calendar/VoiceTab';
import { TextTab } from '@/shared/components/calendar/TextTab';
import { DailyPlanTab } from '@/shared/components/calendar/DailyPlanTab';
import { useLesson } from '@/features/lessons';
import { Button } from '@/shared/components/ui/button';
import { readUrlSearchParam, replaceAppSearchUrl } from '@/shared/lib/url-search-params';

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

export default function TeacherLessonDetailPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [urlRevision, setUrlRevision] = useState(0);
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

  const handleTabChange = (tab: LessonTab) => {
    setPendingTab(tab);
    replaceAppSearchUrl({
      router,
      pathname,
      updates: { tab: tab === 'absence' ? null : tab },
      scroll: false,
      onReplaced: () => setUrlRevision((revision) => revision + 1),
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Loading..." subtitle="Loading lesson details...">
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!lesson) {
    return (
      <DashboardLayout title="Lesson Not Found" subtitle="The lesson you're looking for doesn't exist.">
        <div className="text-center p-12">
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={`Lesson: ${lesson.group?.name || 'Unknown'}`}
      subtitle={`${new Date(lesson.scheduledAt).toLocaleDateString()} at ${new Date(lesson.scheduledAt).toLocaleTimeString()}`}
    >
      <div className="bg-white rounded-xl border border-[rgba(14,14,16,0.07)] h-[calc(100vh-200px)] flex flex-col">
        <LessonDetailTabs lesson={lesson} activeTab={activeTab} onTabChange={handleTabChange}>
          {{
            absence: <AbsenceTab lessonId={resolvedParams.lessonId} />,
            feedback: <FeedbacksTab lessonId={resolvedParams.lessonId} />,
            voice: <VoiceTab lessonId={resolvedParams.lessonId} />,
            text: <TextTab lessonId={resolvedParams.lessonId} />,
            dailyPlan: (
              <DailyPlanTab
                lessonId={resolvedParams.lessonId}
                groupId={lesson.groupId}
              />
            ),
          }}
        </LessonDetailTabs>
      </div>
    </DashboardLayout>
  );
}
