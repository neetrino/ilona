'use client';

import { use, useEffect, useMemo, useState } from 'react';
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
import { useTeachers } from '@/features/teachers';
import { SubstituteLessonModal } from '../components/SubstituteLessonModal';

export default function AdminLessonDetailPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  type LessonTab = 'absence' | 'feedback' | 'voice' | 'text' | 'dailyPlan';
  const tabParam = searchParams.get('tab') as LessonTab | null;
  
  const { data: lesson, isLoading } = useLesson(resolvedParams.lessonId);
  const [activeTab, setActiveTab] = useState<LessonTab>(
    tabParam || 'absence'
  );
  const [substituteOpen, setSubstituteOpen] = useState(false);
  const { data: teachersData } = useTeachers({ status: 'ACTIVE', take: 100 });
  const teacherOptions = useMemo(() => {
    if (!teachersData?.items) return [];
    return teachersData.items.map((t) => ({
      id: t.id,
      label: `${t.user.firstName} ${t.user.lastName}`,
    }));
  }, [teachersData]);

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: LessonTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
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

  const mainTeacherName = lesson.teacher?.user
    ? `${lesson.teacher.user.firstName} ${lesson.teacher.user.lastName}`.trim()
    : null;
  const subTeacherName = lesson.substituteTeacher?.user
    ? `${lesson.substituteTeacher.user.firstName} ${lesson.substituteTeacher.user.lastName}`.trim()
    : null;

  return (
    <DashboardLayout
      title={`Lesson: ${lesson.group?.name || 'Unknown'}`}
      subtitle={`${new Date(lesson.scheduledAt).toLocaleDateString()} at ${new Date(lesson.scheduledAt).toLocaleTimeString()}`}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-700 space-y-1">
          {mainTeacherName && (
            <p>
              <span className="font-medium text-slate-900">Main teacher:</span> {mainTeacherName}
            </p>
          )}
          {subTeacherName ? (
            <p className="text-amber-900 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 inline-block">
              <span className="font-medium">Substitute (this day):</span> {subTeacherName}
            </p>
          ) : (
            <p className="text-slate-500">No substitute assigned for this lesson.</p>
          )}
        </div>
        <Button type="button" variant="outline" onClick={() => setSubstituteOpen(true)}>
          Substitute teacher…
        </Button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 h-[calc(100vh-200px)] flex flex-col">
        <LessonDetailTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
        >
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

      <SubstituteLessonModal
        open={substituteOpen}
        onOpenChange={setSubstituteOpen}
        lessonId={resolvedParams.lessonId}
        teacherOptions={teacherOptions}
      />
    </DashboardLayout>
  );
}

