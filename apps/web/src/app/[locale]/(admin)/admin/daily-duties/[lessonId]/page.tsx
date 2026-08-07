'use client';

import { use, useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import { useRouter } from '@/config/navigation';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { ChatBackButton } from '@/shared/components/ui/chat-back-button';
import { useHistoryBack } from '@/shared/hooks/useHistoryBack';
import { useLesson } from '@/features/lessons';
import { useTeachers } from '@/features/teachers';
import { readUrlSearchParam } from '@/shared/lib/url-search-params';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { getAdminDailyDutiesBasePath } from '@/shared/lib/role-routes';
import { formatAppDateTime } from '@/shared/lib/app-timezone';
import { cn } from '@/shared/lib/utils';
import {
  AdminLessonDetailPanel,
  type AdminLessonTab,
} from '../../daily-duties/components/AdminLessonDetailPanel';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';

function AdminLessonDetailShell({
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
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col overflow-hidden rounded-none border-0 bg-white lg:rounded-[2rem] lg:border lg:border-[rgba(14,14,16,0.07)]',
        className,
      )}
    >
      <div className="flex shrink-0 items-center border-b border-[rgba(14,14,16,0.07)] px-3 py-3 sm:px-4">
        <ChatBackButton onClick={onBack} aria-label={backLabel} />
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

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
  const t = useTranslations('dailyDuties');
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
  const handleBack = useHistoryBack(portalBasePath);
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
        <AdminLessonDetailShell onBack={handleBack} backLabel={tCommon('goBack')}>
          <div className="flex flex-1 items-center justify-center p-12">
            <LoadingSpinner size="md" />
          </div>
        </AdminLessonDetailShell>
      </DashboardLayout>
    );
  }

  if (!lesson) {
    return (
      <DashboardLayout title={t('lessonNotFoundTitle')} subtitle={t('lessonNotFoundSubtitle')} mobileFullBleed>
        <AdminLessonDetailShell onBack={handleBack} backLabel={tCommon('goBack')}>
          <div className="flex flex-1 flex-col items-center justify-center p-12">
            <ChatBackButton onClick={handleBack} aria-label={tCommon('goBack')} />
          </div>
        </AdminLessonDetailShell>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={t('lessonTitle', { name: lesson.group?.name || t('lessonUnknown') })}
      subtitle={formatAppDateTime(lesson.scheduledAt)}
      mobileFullBleed
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <AdminLessonDetailPanel
          lessonId={resolvedParams.lessonId}
          teacherOptions={teacherOptions}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onDeleted={handleDeleted}
          onBack={handleBack}
          backLabel={tCommon('goBack')}
          variant="page"
        />
      </div>
    </DashboardLayout>
  );
}
