'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams, useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { GroupsTab } from '../components/GroupsTab';
import { useAuthStore } from '@/features/auth/store/auth.store';

type ViewMode = 'list' | 'board';

export default function CenterGroupsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeParams = useParams();
  const locale = useLocale();
  const centerId = routeParams.centerId as string;
  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const modeFromUrl = searchParams.get('view');
    if (modeFromUrl === 'list' || modeFromUrl === 'board') {
      return modeFromUrl;
    }
    return 'list';
  });

  useEffect(() => {
    const managerCenterId = user?.role === 'MANAGER' ? user.managerCenterId : undefined;
    if (managerCenterId && centerId !== managerCenterId) {
      router.replace(`/${locale}/admin/groups`);
    }
  }, [user, centerId, router, locale]);

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
      router.replace(`${pathname}?${nextParams.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const updateViewModeInUrl = useCallback(
    (mode: ViewMode) => {
      updateUrl({ view: mode !== 'list' ? mode : null });
    },
    [updateUrl]
  );

  useEffect(() => {
    const modeFromUrl = searchParams.get('view');
    if (modeFromUrl === 'list' || modeFromUrl === 'board') {
      setViewMode(modeFromUrl);
    } else if (!modeFromUrl) {
      setViewMode('list');
    }
  }, [searchParams]);

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
        setViewMode={setViewMode}
        updateViewModeInUrl={updateViewModeInUrl}
        updateUrl={updateUrl}
        searchParams={searchParams}
        selectedCenterId={centerId}
      />
    </DashboardLayout>
  );
}
