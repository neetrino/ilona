'use client';

import { portalPageStackClass } from '@/shared/lib/portal-theme';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { GroupsTab } from './components/GroupsTab';
import { CentersTab } from './components/CentersTab';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useIsLgViewport } from '@/shared/hooks/useIsLgViewport';

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
  const navRef = useRef<HTMLElement | null>(null);
  const centersLabelRef = useRef<HTMLSpanElement | null>(null);
  const groupsLabelRef = useRef<HTMLSpanElement | null>(null);
  const [tabIndicatorStyle, setTabIndicatorStyle] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

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
      setViewMode(modeFromUrl);
    } else if (!modeFromUrl) {
      setViewMode('board');
    }
  }, [isLg, searchParams, viewMode]);

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

  useEffect(() => {
    const updateIndicator = () => {
      const navEl = navRef.current;
      const targetLabelEl = activeTab === 'centers' ? centersLabelRef.current : groupsLabelRef.current;
      if (!navEl || !targetLabelEl) return;

      const navRect = navEl.getBoundingClientRect();
      const labelRect = targetLabelEl.getBoundingClientRect();
      const extraUnderlinePadding = 6;
      setTabIndicatorStyle({
        left: labelRect.left - navRect.left - extraUnderlinePadding,
        width: labelRect.width + extraUnderlinePadding * 2,
        ready: true,
      });
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeTab, isManager]);

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
          <nav ref={navRef} className="relative flex gap-1">
            <span
              aria-hidden
              className={`pointer-events-none absolute -bottom-[1px] h-0.5 bg-[#1010a3] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                tabIndicatorStyle.ready ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                left: `${tabIndicatorStyle.left}px`,
                width: `${tabIndicatorStyle.width}px`,
              }}
            />
            {!isManager && (
              <button
                onClick={() => {
                  setActiveTab('centers');
                  updateTabInUrl('centers');
                }}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeTab === 'centers'
                    ? 'text-[#1010a3]'
                    : 'text-[#3b3b40] hover:text-[#3b3b40]'
                }`}
              >
                <span ref={centersLabelRef} className="relative inline-block">
                  Centers / Branches
                </span>
              </button>
            )}
            <button
              onClick={() => {
                setActiveTab('groups');
                updateTabInUrl('groups');
              }}
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                activeTab === 'groups'
                  ? 'text-[#1010a3]'
                  : 'text-[#3b3b40] hover:text-[#3b3b40]'
              }`}
            >
              <span ref={groupsLabelRef} className="relative inline-block">Groups</span>
            </button>
          </nav>
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
