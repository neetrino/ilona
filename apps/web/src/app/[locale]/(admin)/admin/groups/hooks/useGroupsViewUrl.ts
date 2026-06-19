'use client';

import { useCallback, useEffect, useState } from 'react';
import { useIsLgViewport } from '@/shared/hooks/useIsLgViewport';
import { readGroupsViewMode, readUrlSearchParam } from '@/shared/lib/url-search-params';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';

export type GroupsViewMode = 'list' | 'board';

interface UseGroupsViewUrlOptions {
  /** When true (default), mobile viewports always use board and cannot persist list in the URL. */
  enforceBoardOnMobile?: boolean;
  /** When true (default), add `view=board` if the param is missing on desktop. */
  normalizeMissingView?: boolean;
}

export function useGroupsViewUrl(options: UseGroupsViewUrlOptions = {}) {
  const { enforceBoardOnMobile = true, normalizeMissingView = true } = options;
  const { searchParams, urlRevision, replaceParams } = useAppSearchUrl();
  const isLg = useIsLgViewport();
  const [pendingViewMode, setPendingViewMode] = useState<GroupsViewMode | null>(null);

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

  const viewMode: GroupsViewMode = pendingViewMode ?? viewModeFromUrl;

  const updateUrl = useCallback(
    (updates: Record<string, string | null>) => {
      replaceParams(updates);
    },
    [replaceParams],
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
      const explicitView = readUrlSearchParam('view', searchParams, urlRevision);
      if (explicitView === 'list' || explicitView === 'board') {
        return;
      }
      if (modeFromUrl !== 'board') {
        updateUrl({ view: 'board' });
      }
      return;
    }

    if (!readUrlSearchParam('view', searchParams, urlRevision)) {
      updateUrl({ view: 'board' });
    }
  }, [enforceBoardOnMobile, isLg, normalizeMissingView, searchParams, updateUrl, urlRevision]);

  return {
    viewMode,
    updateUrl,
    handleViewModeChange,
    searchParams,
    urlRevision,
  };
}
