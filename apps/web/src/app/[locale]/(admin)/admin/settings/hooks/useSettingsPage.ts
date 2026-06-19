'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { readUrlSearchParam, replaceAppSearchParams, getLiveSearchParams } from '@/shared/lib/url-search-params';

type SettingsTab =
  | 'security'
  | 'notifications'
  | 'system'
  | 'penalty'
  | 'manager'
  | 'dashboard-banner';

export function useSettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Initialize activeTab from URL params immediately to avoid flash
  const getInitialTab = (): SettingsTab => {
    const tabFromUrl = searchParams.get('tab') as SettingsTab | null;
    if (
      tabFromUrl &&
      ['security', 'notifications', 'system', 'penalty', 'manager', 'dashboard-banner'].includes(tabFromUrl)
    ) {
      return tabFromUrl;
    }
    return 'security';
  };
  
  const [activeTab, setActiveTab] = useState<SettingsTab>(getInitialTab);
  const [isSaving, setIsSaving] = useState(false);
  const [urlRevision, setUrlRevision] = useState(0);

  // Sync activeTab with URL when URL changes (e.g., browser back/forward)
  useEffect(() => {
    const tabFromUrl = readUrlSearchParam('tab', searchParams) as SettingsTab | null;
    if (
      tabFromUrl &&
      ['security', 'notifications', 'system', 'penalty', 'manager', 'dashboard-banner'].includes(tabFromUrl)
    ) {
      setActiveTab((currentTab) => (tabFromUrl !== currentTab ? tabFromUrl : currentTab));
    } else {
      setActiveTab((currentTab) => (currentTab !== 'security' ? 'security' : currentTab));
    }
  }, [searchParams, urlRevision]);

  const updateParams = useCallback((mutate: (params: URLSearchParams) => void) => {
    const params = getLiveSearchParams(searchParams);
    mutate(params);
    replaceAppSearchParams({
      router,
      pathname,
      params,
      scroll: false,
      onReplaced: () => setUrlRevision((revision) => revision + 1),
    });
  }, [router, pathname, searchParams]);

  // Update URL when tab changes
  const handleTabChange = useCallback((tab: SettingsTab) => {
    setActiveTab(tab);
    updateParams((params) => {
      params.set('tab', tab);
    });
  }, [updateParams]);

  return {
    activeTab,
    isSaving,
    setIsSaving,
    handleTabChange,
  };
}

