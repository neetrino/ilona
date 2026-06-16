'use client';

import { portalPageStackClass } from '@/shared/lib/portal-theme';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { GroupsTab } from './components/GroupsTab';
import { CentersTab } from './components/CentersTab';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useIsLgViewport } from '@/shared/hooks/useIsLgViewport';
import { cn } from '@/shared/lib/utils';

type TabType = 'groups' | 'centers';
type ViewMode = 'list' | 'board';

export default function GroupsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const isLg = useIsLgViewport();
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
  const [renderedTab, setRenderedTab] = useState<TabType>('groups');
  const [isTabContentVisible, setIsTabContentVisible] = useState(true);

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
    const nextQuery = params.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery === currentQuery) {
      return;
    }
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextUrl);
  }, [pathname, router, searchParams]);

  // Update URL when view mode changes
  const updateViewModeInUrl = useCallback((mode: ViewMode) => {
    updateUrl({ view: mode !== 'board' ? mode : null });
  }, [updateUrl]);

  // Update URL when tab changes
  const updateTabInUrl = useCallback((tab: TabType) => {
    updateUrl({ tab: tab !== 'groups' ? tab : null });
  }, [updateUrl]);

  // Force board mode on mobile
  useEffect(() => {
    if (isLg !== false) return;
    if (viewMode !== 'board') {
      setViewMode('board');
    }
    if (searchParams.get('view')) {
      updateUrl({ view: null });
    }
  }, [isLg, searchParams, updateUrl, viewMode]);

  // Sync view mode from URL
  useEffect(() => {
    const modeFromUrl = searchParams.get('view');
    if (isLg === false) {
      if (viewMode !== 'board') {
        setViewMode('board');
      }
      return;
    }

    if (modeFromUrl === 'list' || modeFromUrl === 'board') {
      setViewMode((prev) => (prev === modeFromUrl ? prev : modeFromUrl));
    } else if (!modeFromUrl) {
      setViewMode((prev) => (prev === 'board' ? prev : 'board'));
    }
  }, [isLg, searchParams]);

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

  useEffect(() => {
    if (isLg === false) {
      setRenderedTab(activeTab);
      setIsTabContentVisible(true);
      return;
    }

    if (activeTab === renderedTab) {
      setIsTabContentVisible(true);
      return;
    }

    setIsTabContentVisible(false);
    const timeout = window.setTimeout(() => {
      setRenderedTab(activeTab);
      setIsTabContentVisible(true);
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [activeTab, isLg, renderedTab]);

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
      <div className={portalPageStackClass}>
        {/* Tabs */}
        <div className="border-b border-[rgba(14,14,16,0.07)]">
          {!isManager ? (
            <nav className="flex gap-1">
              <button
                onClick={() => {
                  if (activeTab === 'centers') return;
                  setActiveTab('centers');
                  updateTabInUrl('centers');
                }}
                className={cn(
                  'relative px-4 py-2 text-sm font-medium transition-colors focus:outline-none',
                  'after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-[#1010a3] after:transition-transform after:duration-300 after:ease-[cubic-bezier(0.22,1,0.36,1)]',
                  activeTab === 'centers'
                    ? 'text-[#1010a3] after:scale-x-100'
                    : 'text-[#3b3b40] after:scale-x-0'
                )}
              >
                Centers / Branches
              </button>
              <button
                onClick={() => {
                  if (activeTab === 'groups') return;
                  setActiveTab('groups');
                  updateTabInUrl('groups');
                }}
                className={cn(
                  'relative px-4 py-2 text-sm font-medium transition-colors focus:outline-none',
                  'after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-[#1010a3] after:transition-transform after:duration-300 after:ease-[cubic-bezier(0.22,1,0.36,1)]',
                  activeTab === 'groups'
                    ? 'text-[#1010a3] after:scale-x-100'
                    : 'text-[#3b3b40] after:scale-x-0'
                )}
              >
                Groups
              </button>
            </nav>
          ) : (
            <nav className="flex gap-1">
              <button
                className="relative px-4 py-2 text-sm font-medium text-[#1010a3] focus:outline-none after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-[#1010a3]"
                aria-current="page"
              >
                Groups
              </button>
            </nav>
          )}
        </div>

        <div
          className={
            isLg === false
              ? ''
              : `transform transition-all duration-200 ease-out ${
                  isTabContentVisible ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
                }`
          }
        >
          {!isManager && renderedTab === 'centers' && (
            <CentersTab
              centerSearchQuery={centerSearchQuery}
              onSearchChange={handleCenterSearchChange}
              centerPage={centerPage}
              updateUrl={updateUrl}
              searchParams={searchParams}
            />
          )}

          {renderedTab === 'groups' && (
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
      </div>
    </DashboardLayout>
  );
}
