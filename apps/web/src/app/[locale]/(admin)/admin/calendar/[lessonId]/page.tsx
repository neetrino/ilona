'use client';

import { use, useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from '@/config/navigation';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { LessonDetailTabs } from '@/shared/components/calendar/LessonDetailTabs';
import { AbsenceTab } from '@/shared/components/calendar/AbsenceTab';
import { FeedbacksTab } from '@/shared/components/calendar/FeedbacksTab';
import { VoiceTab } from '@/shared/components/calendar/VoiceTab';
import { TextTab } from '@/shared/components/calendar/TextTab';
import { DailyPlanTab } from '@/shared/components/calendar/DailyPlanTab';
import { useDeleteLesson, useLesson } from '@/features/lessons';
import { BulkDeleteConfirmationDialog } from '@/features/lessons/components/BulkDeleteConfirmationDialog';
import { Button } from '@/shared/components/ui/button';
import { useTeachers } from '@/features/teachers';
import { SubstituteLessonModal } from '../components/SubstituteLessonModal';
import { readUrlSearchParam } from '@/shared/lib/url-search-params';
import { getErrorMessage } from '@/shared/lib/api';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { getAdminPortalBasePath } from '@/shared/lib/role-routes';

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

export default function AdminLessonDetailPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const t = useTranslations('calendar');
  const tCommon = useTranslations('common');
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const portalBasePath = getAdminPortalBasePath(user?.role);
  const { searchParams, urlRevision, replaceParams } = useAppSearchUrl();
  const [pendingTab, setPendingTab] = useState<LessonTab | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
  const deleteLesson = useDeleteLesson();
  const [substituteOpen, setSubstituteOpen] = useState(false);
  const { data: teachersData } = useTeachers({ status: 'ACTIVE', take: 100 });
  const teacherOptions = useMemo(() => {
    if (!teachersData?.items) return [];
    return teachersData.items.map((teacher) => ({
      id: teacher.id,
      label: `${teacher.user.firstName} ${teacher.user.lastName}`,
    }));
  }, [teachersData]);

  const handleTabChange = (tab: LessonTab) => {
    setPendingTab(tab);
    replaceParams({ tab: tab === 'absence' ? null : tab });
  };

  const handleDeleteDialogOpenChange = useCallback((open: boolean) => {
    setIsDeleteDialogOpen(open);
    if (!open) {
      setDeleteError(null);
    }
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (deleteLesson.isPending) return;
    setDeleteError(null);
    try {
      await deleteLesson.mutateAsync(resolvedParams.lessonId);
      setIsDeleteDialogOpen(false);
      router.push(`${portalBasePath}/calendar`);
    } catch (err: unknown) {
      setDeleteError(getErrorMessage(err, t('failedDeleteLesson')));
    }
  }, [deleteLesson, portalBasePath, resolvedParams.lessonId, router, t]);

  if (isLoading) {
    return (
      <DashboardLayout title={t('lessonLoadingTitle')} subtitle={t('lessonLoadingSubtitle')} mobileFullBleed>
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-none border-0 bg-white lg:rounded-[2rem] lg:border lg:border-[rgba(14,14,16,0.07)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!lesson) {
    return (
      <DashboardLayout title={t('lessonNotFoundTitle')} subtitle={t('lessonNotFoundSubtitle')} mobileFullBleed>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-none border-0 bg-white lg:rounded-[2rem] lg:border lg:border-[rgba(14,14,16,0.07)]">
          <Button onClick={() => router.back()}>{tCommon('goBack')}</Button>
        </div>
      </DashboardLayout>
    );
  }

  const subTeacherName = lesson.substituteTeacher?.user
    ? `${lesson.substituteTeacher.user.firstName} ${lesson.substituteTeacher.user.lastName}`.trim()
    : null;

  return (
    <DashboardLayout
      title={t('lessonTitle', { name: lesson.group?.name || t('lessonUnknown') })}
      subtitle={`${new Date(lesson.scheduledAt).toLocaleDateString()} at ${new Date(lesson.scheduledAt).toLocaleTimeString()}`}
      mobileFullBleed
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-none border-0 bg-white lg:rounded-[2rem] lg:border lg:border-[rgba(14,14,16,0.07)]">
        {subTeacherName && (
          <div className="shrink-0 border-b border-[rgba(14,14,16,0.07)] px-4 py-3 text-sm text-[#3b3b40]">
            <p className="text-amber-900 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 inline-block">
              <span className="font-medium">{t('substituteThisDay')}</span> {subTeacherName}
            </p>
          </div>
        )}
        <div className="flex-1 min-h-0">
          <LessonDetailTabs
            lesson={lesson}
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
        <div className="shrink-0 flex flex-wrap items-center justify-start gap-2 border-t border-[rgba(14,14,16,0.07)] px-4 py-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-[15px] transition-transform duration-200 hover:-translate-y-px"
            onClick={() => setSubstituteOpen(true)}
          >
            {t('substituteTeacherButton')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="rounded-[15px] transition-transform duration-200 hover:-translate-y-px"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            {tCommon('delete')}
          </Button>
        </div>
      </div>

      <SubstituteLessonModal
        open={substituteOpen}
        onOpenChange={setSubstituteOpen}
        lessonId={resolvedParams.lessonId}
        teacherOptions={teacherOptions}
      />

      <BulkDeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={handleDeleteDialogOpenChange}
        onConfirm={handleDeleteConfirm}
        lessonCount={1}
        isLoading={deleteLesson.isPending}
        error={deleteError}
        title={t('deleteThisLessonTitle')}
        description={t('deleteLessonPermanentFor', {
          group: lesson.group?.name ?? t('unknownGroup'),
          datetime: new Date(lesson.scheduledAt).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
          }),
        })}
        confirmLabel={tCommon('delete')}
      />
    </DashboardLayout>
  );
}
