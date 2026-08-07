'use client';

import { useCallback, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Pencil } from 'lucide-react';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { ChatBackButton } from '@/shared/components/ui/chat-back-button';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { getAdminPortalBasePath } from '@/shared/lib/role-routes';
import { ADMIN_OUTLINE_BUTTON_CLASS } from '@/shared/lib/admin-control-theme';
import { cn } from '@/shared/lib/utils';
import { useGroup } from '../../hooks';
import { GroupIconDisplay } from '../../group-icon-registry';
import { EditGroupForm } from '../EditGroupForm';
import { GroupDetailTabs } from './GroupDetailTabs';
import { GroupDetailGeneralTab } from './GroupDetailGeneralTab';
import { GroupDetailStudentsTab } from './GroupDetailStudentsTab';
import { GroupDetailDailyPlansTab } from './GroupDetailDailyPlansTab';
import {
  isGroupDetailTab,
  type GroupDetailTab,
} from './group-detail.constants';

export function GroupDetailPageContent() {
  const t = useTranslations('groups');
  const tCommon = useTranslations('common');
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const groupId = params.groupId as string;
  const { user } = useAuthStore();
  const portalBasePath = getAdminPortalBasePath(user?.role);
  const groupsHref = `/${locale}${portalBasePath}/groups`;
  const [isEditOpen, setIsEditOpen] = useState(false);

  const tabFromUrl = searchParams.get('tab');
  const activeTab: GroupDetailTab = isGroupDetailTab(tabFromUrl) ? tabFromUrl : 'general';

  const { data: group, isLoading, isError, error, refetch } = useGroup(groupId);

  const tabLabels = useMemo(
    (): Record<GroupDetailTab, string> => ({
      general: t('detailTabGeneral'),
      students: t('detailTabStudents'),
      'daily-plans': t('detailTabDailyPlans'),
    }),
    [t],
  );

  const setTab = useCallback(
    (tab: GroupDetailTab) => {
      const next = new URLSearchParams(searchParams.toString());
      if (tab === 'general') {
        next.delete('tab');
      } else {
        next.set('tab', tab);
      }
      const query = next.toString();
      router.replace(`${groupsHref}/view/${groupId}${query ? `?${query}` : ''}`, {
        scroll: false,
      });
    },
    [groupId, groupsHref, router, searchParams],
  );

  const goBack = () => {
    router.push(groupsHref);
  };

  const openStudent = (studentId: string) => {
    router.push(`/${locale}${portalBasePath}/students/${studentId}`);
  };

  return (
    <DashboardLayout
      title={group?.name || t('groupDetails')}
      subtitle={t('detailSubtitle')}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-start gap-3">
          <ChatBackButton onClick={goBack} aria-label={t('detailBackToGroups')} />
          <div className="min-w-0 flex-1">
            {isLoading ? (
              <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
            ) : group ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#ecefff] text-[#1010a3]">
                  <GroupIconDisplay iconKey={group.iconKey} size={22} />
                </span>
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-bold text-[#0e0e10] sm:text-2xl">
                    {group.name}
                  </h1>
                  <p className="mt-0.5 text-sm text-[#8b8b90]">
                    {[group.center?.name, group.level].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
                    group.isActive
                      ? 'bg-green-50 text-green-700'
                      : 'bg-slate-100 text-slate-600',
                  )}
                >
                  {group.isActive ? t('detailStatusActive') : t('detailStatusInactive')}
                </span>
              </div>
            ) : null}
          </div>
          {group ? (
            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className={cn(ADMIN_OUTLINE_BUTTON_CLASS, 'inline-flex items-center gap-2')}
            >
              <Pencil className="h-4 w-4" aria-hidden />
              {tCommon('edit')}
            </button>
          ) : null}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        ) : isError || !group ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-10 text-center text-sm text-red-600">
            {error instanceof Error ? error.message : t('detailNotFound')}
          </div>
        ) : (
          <>
            <GroupDetailTabs
              activeTab={activeTab}
              onTabChange={setTab}
              labels={tabLabels}
            />
            {activeTab === 'general' ? <GroupDetailGeneralTab group={group} /> : null}
            {activeTab === 'students' ? (
              <GroupDetailStudentsTab groupId={group.id} onStudentSelect={openStudent} />
            ) : null}
            {activeTab === 'daily-plans' ? (
              <GroupDetailDailyPlansTab groupId={group.id} />
            ) : null}
          </>
        )}
      </div>

      {isEditOpen && group ? (
        <EditGroupForm
          open={isEditOpen}
          onOpenChange={(open) => {
            setIsEditOpen(open);
            if (!open) {
              void refetch();
            }
          }}
          groupId={group.id}
        />
      ) : null}
    </DashboardLayout>
  );
}
