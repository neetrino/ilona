'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useIsLgViewport } from '@/shared/hooks/useIsLgViewport';

export type GroupsViewMode = 'list' | 'board';

function readViewModeFromLocation(searchParams: URLSearchParams): GroupsViewMode {
  if (typeof window !== 'undefined') {
    const mode = new URLSearchParams(window.location.search).get('view');
    if (mode === 'list' || mode === 'board') {
      return mode;
    }
  }

  const modeFromUrl = searchParams.get('view');
  if (modeFromUrl === 'list' || modeFromUrl === 'board') {
    return modeFromUrl;
  }

  return 'board';
}

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

  useEffect(() => {
    if (pendingViewMode === null) {
      return;
    }

    const modeFromLocation = readViewModeFromLocation(searchParams);
    if (modeFromLocation === pendingViewMode) {
      setPendingViewMode(null);
    }
  }, [pendingViewMode, searchParams]);

  const viewModeFromUrl = readViewModeFromLocation(searchParams);

  const viewMode: GroupsViewMode =
    enforceBoardOnMobile && isLg === false ? 'board' : (pendingViewMode ?? viewModeFromUrl);

  const updateUrl = useCallback(
    (updates: Record<string, string | null>) => {
      if (typeof window === 'undefined') {
        return;
      }

      const params = new URLSearchParams(window.location.search);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      const nextQuery = params.toString();
      const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      const currentUrl = `${pathname}${window.location.search}`;

      if (currentUrl === nextUrl) {
        return;
      }

      // Sync the browser URL immediately; router.replace alone can lag in production builds.
      window.history.replaceState(window.history.state, '', nextUrl);
      router.replace(nextUrl, { scroll: false });
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

    const modeFromUrl = searchParams.get('view');

    if (enforceBoardOnMobile && isLg === false) {
      if (modeFromUrl && modeFromUrl !== 'board') {
        updateUrl({ view: 'board' });
      }
      return;
    }

    if (!modeFromUrl) {
      updateUrl({ view: 'board' });
    }
  }, [enforceBoardOnMobile, isLg, normalizeMissingView, searchParams, updateUrl]);

  return {
    viewMode,
    updateUrl,
    handleViewModeChange,
    searchParams,
  };
}
