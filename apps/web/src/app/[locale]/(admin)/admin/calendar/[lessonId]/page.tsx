'use client';

import { use, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { LessonDetailTabs } from '@/shared/components/calendar/LessonDetailTabs';
import { AbsenceTab } from '@/shared/components/calendar/AbsenceTab';
import { FeedbacksTab } from '@/shared/components/calendar/FeedbacksTab';
import { VoiceTab } from '@/shared/components/calendar/VoiceTab';
import { TextTab } from '@/shared/components/calendar/TextTab';
import { useLesson } from '@/features/lessons';
import { Button } from '@/shared/components/ui/button';

export default function AdminLessonDetailPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as 'absence' | 'feedback' | 'voice' | 'text' | null;
  
  const { data: lesson, isLoading } = useLesson(resolvedParams.lessonId);
  const [activeTab, setActiveTab] = useState<'absence' | 'feedback' | 'voice' | 'text'>(
    tabParam || 'absence'
  );

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

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
      <div className="bg-white rounded-xl border border-slate-200 h-[calc(100vh-200px)] flex flex-col">
        <LessonDetailTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
        >
          {{
            absence: <AbsenceTab lessonId={resolvedParams.lessonId} />,
            feedback: <FeedbacksTab lessonId={resolvedParams.lessonId} />,
            voice: <VoiceTab lessonId={resolvedParams.lessonId} />,
            text: <TextTab lessonId={resolvedParams.lessonId} />,
          }}
        </LessonDetailTabs>
      </div>
    </DashboardLayout>
  );
}

