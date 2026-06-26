'use client';



import { use, useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';

import { useRouter } from '@/config/navigation';

import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';

import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';

import { LessonDetailTabs } from '@/shared/components/calendar/LessonDetailTabs';

import { AbsenceTab } from '@/shared/components/calendar/AbsenceTab';

import { FeedbacksTab } from '@/shared/components/calendar/FeedbacksTab';

import { VoiceTab } from '@/shared/components/calendar/VoiceTab';

import { TextTab } from '@/shared/components/calendar/TextTab';

import { DailyPlanTab } from '@/shared/components/calendar/DailyPlanTab';

import { useLesson } from '@/features/lessons';

import { Button } from '@/shared/components/ui/button';

import { readUrlSearchParam } from '@/shared/lib/url-search-params';



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
  const tCommon = useTranslations('common');
  const tCalendar = useTranslations('calendar');
  const resolvedParams = use(params);

  const router = useRouter();

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



  const handleTabChange = (tab: LessonTab) => {

    setPendingTab(tab);

    replaceParams({ tab: tab === 'absence' ? null : tab });

  };



  if (isLoading) {

    return (

      <DashboardLayout title={tCommon('loading')} subtitle={tCommon('loading')}>

        <div className="flex items-center justify-center p-12">

          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>

        </div>

      </DashboardLayout>

    );

  }



  if (!lesson) {

    return (

      <DashboardLayout title={tCalendar('lessonNotFoundTitle')} subtitle={tCalendar('lessonNotFoundSubtitle')}>

        <div className="text-center p-12">

          <Button onClick={() => router.back()}>{tCommon('goBack')}</Button>

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

