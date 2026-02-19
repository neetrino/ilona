'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

type SettingsTab = 'security' | 'notifications' | 'system' | 'percent';

export function useSettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Initialize activeTab from URL params immediately to avoid flash
  const getInitialTab = (): SettingsTab => {
    const tabFromUrl = searchParams.get('tab') as SettingsTab | null;
    if (tabFromUrl && ['security', 'notifications', 'system', 'percent'].includes(tabFromUrl)) {
      return tabFromUrl;
    }
    return 'security';
  };
  
  const [activeTab, setActiveTab] = useState<SettingsTab>(getInitialTab);
  const [isSaving, setIsSaving] = useState(false);

  // Sync activeTab with URL when URL changes (e.g., browser back/forward)
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as SettingsTab | null;
    if (tabFromUrl && ['security', 'notifications', 'system', 'percent'].includes(tabFromUrl)) {
      setActiveTab((currentTab) => {
        // Only update if different to avoid unnecessary re-renders
        return tabFromUrl !== currentTab ? tabFromUrl : currentTab;
      });
    } else {
      // If URL has no tab param, reset to security
      setActiveTab((currentTab) => {
        return currentTab !== 'security' ? 'security' : currentTab;
      });
    }
  }, [searchParams]); // Only depend on searchParams to sync with URL changes

  // Update URL when tab changes
  const handleTabChange = useCallback((tab: SettingsTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  return {
    activeTab,
    isSaving,
    setIsSaving,
    handleTabChange,
  };
}

