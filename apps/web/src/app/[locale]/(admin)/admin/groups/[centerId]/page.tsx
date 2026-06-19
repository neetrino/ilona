'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { GroupsTab } from '../components/GroupsTab';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { getAdminPortalBasePath } from '@/shared/lib/role-routes';
import { useGroupsViewUrl } from '../hooks/useGroupsViewUrl';

export default function CenterGroupsPage() {
  const router = useRouter();
  const routeParams = useParams();
  const locale = useLocale();
  const centerId = routeParams.centerId as string;
  const { user } = useAuthStore();
  const portalBasePath = getAdminPortalBasePath(user?.role);

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);

  const { viewMode, updateUrl, handleViewModeChange, searchParams, urlRevision } = useGroupsViewUrl({
    enforceBoardOnMobile: false,
  });

  useEffect(() => {
    const managerCenterId = user?.role === 'MANAGER' ? user.managerCenterId : undefined;
    if (managerCenterId && centerId !== managerCenterId) {
      router.replace(`/${locale}${portalBasePath}/groups`);
    }
  }, [user, centerId, router, locale, portalBasePath]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(0);
  };

  return (
    <DashboardLayout
      title="Groups by center"
      subtitle="Manage groups for the selected branch."
    >
      <GroupsTab
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        page={page}
        setPage={setPage}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        updateUrl={updateUrl}
        searchParams={searchParams}
        urlRevision={urlRevision}
        selectedCenterId={centerId}
      />
    </DashboardLayout>
  );
}
