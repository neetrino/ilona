'use client';

import { use, useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from '@/config/navigation';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { Button } from '@/shared/components/ui/button';
import { useLesson } from '@/features/lessons';
import { useTeachers } from '@/features/teachers';
import { readUrlSearchParam } from '@/shared/lib/url-search-params';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { getAdminDailyDutiesBasePath } from '@/shared/lib/role-routes';
import {
  AdminLessonDetailPanel,
  type AdminLessonTab,
} from '../../calendar/components/AdminLessonDetailPanel';

function parseLessonTab(value: string | null): AdminLessonTab {
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

export default function AdminDailyDutiesLessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const t = useTranslations('calendar');
  const tCommon = useTranslations('common');
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const portalBasePath = getAdminDailyDutiesBasePath(user?.role);
  const { searchParams, urlRevision, replaceParams } = useAppSearchUrl();
  const [pendingTab, setPendingTab] = useState<AdminLessonTab | null>(null);

  const readTabFromUrl = useCallback((): AdminLessonTab => {
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
  const { data: teachersData } = useTeachers({ status: 'ACTIVE', take: 100 });
  const teacherOptions = useMemo(() => {
    if (!teachersData?.items) return [];
    return teachersData.items.map((teacher) => ({
      id: teacher.id,
      label: `${teacher.user.firstName} ${teacher.user.lastName}`,
    }));
  }, [teachersData]);

  const handleTabChange = (tab: AdminLessonTab) => {
    setPendingTab(tab);
    replaceParams({ tab: tab === 'absence' ? null : tab });
  };

  const handleDeleted = useCallback(() => {
    router.push(portalBasePath);
  }, [portalBasePath, router]);

  if (isLoading) {
    return (
      <DashboardLayout title={t('lessonLoadingTitle')} subtitle={t('lessonLoadingSubtitle')} mobileFullBleed>
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-none border-0 bg-white lg:rounded-[2rem] lg:border lg:border-[rgba(14,14,16,0.07)]">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
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

  return (
    <DashboardLayout
      title={t('lessonTitle', { name: lesson.group?.name || t('lessonUnknown') })}
      subtitle={`${new Date(lesson.scheduledAt).toLocaleDateString()} at ${new Date(lesson.scheduledAt).toLocaleTimeString()}`}
      mobileFullBleed
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <AdminLessonDetailPanel
          lessonId={resolvedParams.lessonId}
          teacherOptions={teacherOptions}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onDeleted={handleDeleted}
          variant="page"
        />
      </div>
    </DashboardLayout>
  );
}
