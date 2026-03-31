'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { GroupsTab } from './components/GroupsTab';
import { CentersTab } from './components/CentersTab';
import { useAuthStore } from '@/features/auth/store/auth.store';

type TabType = 'groups' | 'centers';
type ViewMode = 'list' | 'board';

export default function GroupsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const isManager = user?.role === 'MANAGER';
  
  // Initialize active tab from URL
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const tabFromUrl = searchParams.get('tab');
    if (!isManager && (tabFromUrl === 'groups' || tabFromUrl === 'centers')) {
      return tabFromUrl;
    }
    return 'groups';
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [centerSearchQuery, setCenterSearchQuery] = useState('');
  const [centerPage, setCenterPage] = useState(0);

  // View mode state with URL persistence
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const modeFromUrl = searchParams.get('view');
    if (modeFromUrl === 'list' || modeFromUrl === 'board') {
      return modeFromUrl;
    }
    return 'board';
  });

  // Update URL helper function
  const updateUrl = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    // Use replace instead of push to avoid history stack issues and prevent flicker
    router.replace(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams]);

  // Update URL when view mode changes
  const updateViewModeInUrl = useCallback((mode: ViewMode) => {
    updateUrl({ view: mode !== 'board' ? mode : null });
  }, [updateUrl]);

  // Update URL when tab changes
  const updateTabInUrl = useCallback((tab: TabType) => {
    updateUrl({ tab: tab !== 'groups' ? tab : null });
  }, [updateUrl]);

  // Sync view mode from URL
  useEffect(() => {
    const modeFromUrl = searchParams.get('view');
    if (modeFromUrl === 'list' || modeFromUrl === 'board') {
      setViewMode(modeFromUrl);
    } else if (!modeFromUrl) {
      setViewMode('board');
    }
  }, [searchParams]);

  // Sync active tab from URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (!isManager && (tabFromUrl === 'groups' || tabFromUrl === 'centers')) {
      setActiveTab(tabFromUrl);
    } else if (!tabFromUrl) {
      setActiveTab('groups');
    } else if (isManager && tabFromUrl === 'centers') {
      setActiveTab('groups');
      updateTabInUrl('groups');
    }
  }, [isManager, searchParams, updateTabInUrl]);

  // Handle search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(0);
  };

  const handleCenterSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCenterSearchQuery(e.target.value);
    setCenterPage(0);
  };

  return (
    <DashboardLayout 
      title="Groups & Centers" 
      subtitle="Manage learning groups and center branches."
    >
      <div className="space-y-6">
        {/* Tabs */}
        <div className="border-b border-slate-200">
          <nav className="flex gap-4">
            {!isManager && (
              <button
                onClick={() => {
                  setActiveTab('centers');
                  updateTabInUrl('centers');
                }}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'centers'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-600 hover:text-slate-800'
                }`}
              >
                Centers / Branches
              </button>
            )}
            <button
              onClick={() => {
                setActiveTab('groups');
                updateTabInUrl('groups');
              }}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'groups'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              Groups
            </button>
          </nav>
        </div>

        {!isManager && activeTab === 'centers' && (
          <CentersTab
            centerSearchQuery={centerSearchQuery}
            onSearchChange={handleCenterSearchChange}
            centerPage={centerPage}
            updateUrl={updateUrl}
            searchParams={searchParams}
          />
        )}

        {activeTab === 'groups' && (
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
          />
        )}
      </div>
    </DashboardLayout>
  );
}
