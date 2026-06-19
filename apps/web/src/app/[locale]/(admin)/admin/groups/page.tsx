'use client';

import { portalPageStackClass } from '@/shared/lib/portal-theme';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  const tabsTrackRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<TabType, HTMLButtonElement | null>>({
    groups: null,
    centers: null,
  });
  const [tabIndicator, setTabIndicator] = useState({ x: 0, width: 0, visible: false });

  // View mode: URL is the source of truth (`view=list` | `view=board`)
  const viewModeFromUrl = useMemo((): ViewMode => {
    const modeFromUrl = searchParams.get('view');
    if (modeFromUrl === 'list' || modeFromUrl === 'board') {
      return modeFromUrl;
    }
    return 'board';
  }, [searchParams]);

  const viewMode: ViewMode = isLg === false ? 'board' : viewModeFromUrl;

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
    router.replace(nextUrl, { scroll: false });
  }, [pathname, router, searchParams]);

  // Update URL when view mode changes
  const updateViewModeInUrl = useCallback((mode: ViewMode) => {
    updateUrl({ view: mode });
  }, [updateUrl]);

  // Keep `view` in the URL so refresh restores the same layout
  useEffect(() => {
    if (isLg === undefined) {
      return;
    }

    const modeFromUrl = searchParams.get('view');

    if (isLg === false) {
      if (modeFromUrl && modeFromUrl !== 'board') {
        updateUrl({ view: 'board' });
      }
      return;
    }

    if (!modeFromUrl) {
      updateUrl({ view: 'board' });
    }
  }, [isLg, searchParams, updateUrl]);

  // Update URL when tab changes
  const updateTabInUrl = useCallback((tab: TabType) => {
    updateUrl({ tab: tab !== 'groups' ? tab : null });
  }, [updateUrl]);

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
    if (isManager) return;

    const syncIndicator = () => {
      const activeTabEl = tabRefs.current[activeTab];
      const tabsTrackEl = tabsTrackRef.current;
      if (!activeTabEl || !tabsTrackEl) {
        setTabIndicator((prev) => ({ ...prev, visible: false }));
        return;
      }
      setTabIndicator({
        x: activeTabEl.offsetLeft,
        width: activeTabEl.offsetWidth,
        visible: true,
      });
    };

    syncIndicator();
    window.addEventListener('resize', syncIndicator);
    return () => window.removeEventListener('resize', syncIndicator);
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
          {!isManager ? (
            <nav ref={tabsTrackRef} className="relative flex gap-1">
              <button
                ref={(node) => {
                  tabRefs.current.centers = node;
                }}
                onClick={() => {
                  if (activeTab === 'centers') return;
                  setActiveTab('centers');
                  updateTabInUrl('centers');
                }}
                className={cn(
                  'relative px-4 py-2 text-sm font-medium transition-colors focus:outline-none',
                  activeTab === 'centers'
                    ? 'text-[#1010a3]'
                    : 'text-[#3b3b40]'
                )}
              >
                Centers / Branches
              </button>
              <button
                ref={(node) => {
                  tabRefs.current.groups = node;
                }}
                onClick={() => {
                  if (activeTab === 'groups') return;
                  setActiveTab('groups');
                  updateTabInUrl('groups');
                }}
                className={cn(
                  'relative px-4 py-2 text-sm font-medium transition-colors focus:outline-none',
                  activeTab === 'groups'
                    ? 'text-[#1010a3]'
                    : 'text-[#3b3b40]'
                )}
              >
                Groups
              </button>
              <span
                aria-hidden
                className="pointer-events-none absolute bottom-0 left-0 h-0.5 bg-[#1010a3] transition-[transform,width,opacity] duration-300 ease-out"
                style={{
                  width: `${tabIndicator.width}px`,
                  transform: `translateX(${tabIndicator.x}px)`,
                  opacity: tabIndicator.visible ? 1 : 0,
                }}
              />
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
