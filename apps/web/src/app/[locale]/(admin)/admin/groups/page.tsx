'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { GroupsTab } from './components/GroupsTab';
import { CentersTab } from './components/CentersTab';

type TabType = 'groups' | 'centers';
type ViewMode = 'list' | 'board';

export default function GroupsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState<TabType>('groups');
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
    return 'list';
  });

  // Update URL when view mode changes
  const updateViewModeInUrl = (mode: ViewMode) => {
    const params = new URLSearchParams(searchParams.toString());
    if (mode !== 'list') {
      params.set('view', mode);
    } else {
      params.delete('view');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  // Sync view mode from URL
  useEffect(() => {
    const modeFromUrl = searchParams.get('view');
    if (modeFromUrl === 'list' || modeFromUrl === 'board') {
      setViewMode(modeFromUrl);
    } else if (!modeFromUrl) {
      setViewMode('list');
    }
  }, [searchParams]);

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
            <button
              onClick={() => setActiveTab('centers')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'centers'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              Centers / Branches
            </button>
            <button
              onClick={() => setActiveTab('groups')}
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

        {activeTab === 'centers' && (
          <CentersTab
            centerSearchQuery={centerSearchQuery}
            onSearchChange={handleCenterSearchChange}
            centerPage={centerPage}
            setCenterPage={setCenterPage}
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
          />
        )}
      </div>
    </DashboardLayout>
  );
}
