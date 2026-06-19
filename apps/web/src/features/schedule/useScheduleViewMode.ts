import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ScheduleViewMode } from '@/features/schedule/schedule-dates';
import { readUrlSearchParam, replaceAppSearchUrl } from '@/shared/lib/url-search-params';

const STORAGE_KEY = 'ilona.schedule.view';

function parseView(value: string | null | undefined): ScheduleViewMode | null {
  if (value === 'week' || value === 'month') return value;
  return null;
}

export function useScheduleViewMode(): {
  viewMode: ScheduleViewMode;
  setViewMode: (mode: ScheduleViewMode) => void;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [urlRevision, setUrlRevision] = useState(0);

  const readViewFromUrl = useCallback((): ScheduleViewMode => {
    return parseView(readUrlSearchParam('view', searchParams, urlRevision)) ?? 'week';
  }, [searchParams, urlRevision]);

  const [pendingViewMode, setPendingViewMode] = useState<ScheduleViewMode | null>(null);
  const viewMode = pendingViewMode ?? readViewFromUrl();

  useEffect(() => {
    if (pendingViewMode === null) {
      return;
    }
    if (readViewFromUrl() === pendingViewMode) {
      setPendingViewMode(null);
    }
  }, [pendingViewMode, readViewFromUrl]);

  const replaceParams = useCallback(
    (updates: Record<string, string | number | null | undefined>) => {
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

  const storageHydrated = useRef(false);
  const skipUrlSync = useRef(true);

  useLayoutEffect(() => {
    if (storageHydrated.current) {
      return;
    }

    const fromUrl = parseView(readUrlSearchParam('view', searchParams));
    if (fromUrl !== null) {
      try {
        localStorage.setItem(STORAGE_KEY, fromUrl);
      } catch {
        // ignore
      }
    } else {
      const fromStorage = parseView(
        typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null,
      );
      if (fromStorage === 'month') {
        setPendingViewMode('month');
        replaceParams({ view: 'month' });
      }
    }
    storageHydrated.current = true;
  }, [pathname, replaceParams, searchParams]);

  useEffect(() => {
    if (skipUrlSync.current) {
      skipUrlSync.current = false;
      return;
    }
    const v = parseView(readUrlSearchParam('view', searchParams));
    if (v === null) {
      try {
        localStorage.setItem(STORAGE_KEY, 'week');
      } catch {
        // ignore
      }
    } else {
      try {
        localStorage.setItem(STORAGE_KEY, v);
      } catch {
        // ignore
      }
    }
  }, [searchParams, urlRevision]);

  const setViewMode = useCallback(
    (mode: ScheduleViewMode) => {
      setPendingViewMode(mode);
      try {
        localStorage.setItem(STORAGE_KEY, mode);
      } catch {
        // ignore
      }
      replaceParams({ view: mode });
    },
    [replaceParams],
  );

  return { viewMode, setViewMode };
}
