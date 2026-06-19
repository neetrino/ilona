'use client';

import { portalPageStackClass } from '@/shared/lib/portal-theme';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { GroupsTab } from './components/GroupsTab';
import { CentersTab } from './components/CentersTab';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useIsLgViewport } from '@/shared/hooks/useIsLgViewport';
import { useGroupsViewUrl } from './hooks/useGroupsViewUrl';
import { cn } from '@/shared/lib/utils';

type TabType = 'groups' | 'centers';

export default function GroupsPage() {
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

  const { viewMode, updateUrl, handleViewModeChange, searchParams: groupsSearchParams } =
    useGroupsViewUrl();

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
              onViewModeChange={handleViewModeChange}
              updateUrl={updateUrl}
              searchParams={groupsSearchParams}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
