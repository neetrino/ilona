'use client';

import { useState, useCallback, useMemo } from 'react';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';
import { readUrlSearchParam } from '@/shared/lib/url-search-params';

type SettingsTab =
  | 'security'
  | 'notifications'
  | 'system'
  | 'penalty'
  | 'manager'
  | 'dashboard-banner'
  | 'sidebar-visibility'
  | 'footer-icon-links';

const VALID_TABS: ReadonlySet<string> = new Set([
  'security',
  'notifications',
  'system',
  'penalty',
  'manager',
  'dashboard-banner',
  'sidebar-visibility',
  'footer-icon-links',
]);

function parseSettingsTab(value: string | null): SettingsTab {
  if (value && VALID_TABS.has(value)) {
    return value as SettingsTab;
  }
  return 'security';
}

export function useSettingsPage() {
  const { searchParams, urlRevision, replaceAllParams } = useAppSearchUrl();
  const [isSaving, setIsSaving] = useState(false);

  const activeTab = useMemo(
    () => parseSettingsTab(readUrlSearchParam('tab', searchParams, urlRevision)),
    [searchParams, urlRevision],
  );

  const handleTabChange = useCallback(
    (tab: SettingsTab) => {
      replaceAllParams((params) => {
        if (tab === 'security') {
          params.delete('tab');
        } else {
          params.set('tab', tab);
        }
      });
    },
    [replaceAllParams],
  );

  return {
    activeTab,
    isSaving,
    setIsSaving,
    handleTabChange,
  };
}
