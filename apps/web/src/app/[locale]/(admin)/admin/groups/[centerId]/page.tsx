'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams, useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { GroupsTab } from '../components/GroupsTab';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { getAdminPortalBasePath } from '@/shared/lib/role-routes';

type ViewMode = 'list' | 'board';

export default function CenterGroupsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeParams = useParams();
  const locale = useLocale();
  const centerId = routeParams.centerId as string;
  const { user } = useAuthStore();
  const portalBasePath = getAdminPortalBasePath(user?.role);

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);

  const viewMode = useMemo((): ViewMode => {
    const modeFromUrl = searchParams.get('view');
    if (modeFromUrl === 'list' || modeFromUrl === 'board') {
      return modeFromUrl;
    }
    return 'board';
  }, [searchParams]);

  useEffect(() => {
    const managerCenterId = user?.role === 'MANAGER' ? user.managerCenterId : undefined;
    if (managerCenterId && centerId !== managerCenterId) {
      router.replace(`/${locale}${portalBasePath}/groups`);
    }
  }, [user, centerId, router, locale, portalBasePath]);

  const updateUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          nextParams.delete(key);
        } else {
          nextParams.set(key, value);
        }
      });
      const nextQuery = nextParams.toString();
      const currentQuery = searchParams.toString();
      if (nextQuery === currentQuery) {
        return;
      }
      const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      router.replace(nextUrl, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const updateViewModeInUrl = useCallback(
    (mode: ViewMode) => {
      updateUrl({ view: mode });
    },
    [updateUrl]
  );

  useEffect(() => {
    if (!searchParams.get('view')) {
      updateUrl({ view: 'board' });
    }
  }, [searchParams, updateUrl]);

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
        updateViewModeInUrl={updateViewModeInUrl}
        updateUrl={updateUrl}
        searchParams={searchParams}
        selectedCenterId={centerId}
      />
    </DashboardLayout>
  );
}
