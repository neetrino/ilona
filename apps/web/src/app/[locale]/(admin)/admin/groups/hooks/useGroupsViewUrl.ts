'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useIsLgViewport } from '@/shared/hooks/useIsLgViewport';
import { readGroupsViewMode, readUrlSearchParam, replaceAppSearchUrl } from '@/shared/lib/url-search-params';

export type GroupsViewMode = 'list' | 'board';

interface UseGroupsViewUrlOptions {
  /** When true (default), mobile viewports always use board and cannot persist list in the URL. */
  enforceBoardOnMobile?: boolean;
  /** When true (default), add `view=board` if the param is missing on desktop. */
  normalizeMissingView?: boolean;
}

export function useGroupsViewUrl(options: UseGroupsViewUrlOptions = {}) {
  const { enforceBoardOnMobile = true, normalizeMissingView = true } = options;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isLg = useIsLgViewport();
  const [pendingViewMode, setPendingViewMode] = useState<GroupsViewMode | null>(null);
  const [urlRevision, setUrlRevision] = useState(0);

  useEffect(() => {
    if (pendingViewMode === null) {
      return;
    }

    const modeFromLocation = readGroupsViewMode(searchParams);
    if (modeFromLocation === pendingViewMode) {
      setPendingViewMode(null);
    }
  }, [pendingViewMode, searchParams, urlRevision]);

  const viewModeFromUrl = readGroupsViewMode(searchParams);

  const viewMode: GroupsViewMode =
    enforceBoardOnMobile && isLg === false ? 'board' : (pendingViewMode ?? viewModeFromUrl);

  const updateUrl = useCallback(
    (updates: Record<string, string | null>) => {
      replaceAppSearchUrl({
        router,
        pathname,
        updates,
        scroll: false,
        onReplaced: () => setUrlRevision((revision) => revision + 1),
      });
    },
    [pathname, router],
  );

  const handleViewModeChange = useCallback(
    (mode: GroupsViewMode, extra?: Record<string, string | null>) => {
      setPendingViewMode(mode);
      updateUrl({ view: mode, ...(extra ?? {}) });
    },
    [updateUrl],
  );

  useEffect(() => {
    if (!normalizeMissingView || isLg === undefined) {
      return;
    }

    const modeFromUrl = readGroupsViewMode(searchParams);

    if (enforceBoardOnMobile && isLg === false) {
      if (modeFromUrl !== 'board') {
        updateUrl({ view: 'board' });
      }
      return;
    }

    if (!readUrlSearchParam('view', searchParams)) {
      updateUrl({ view: 'board' });
    }
  }, [enforceBoardOnMobile, isLg, normalizeMissingView, searchParams, updateUrl]);

  return {
    viewMode,
    updateUrl,
    handleViewModeChange,
    searchParams,
    urlRevision,
  };
}
