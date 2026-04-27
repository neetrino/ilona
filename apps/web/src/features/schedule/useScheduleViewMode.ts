import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ScheduleViewMode } from '@/features/schedule/schedule-dates';

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

  const [viewMode, setViewModeState] = useState<ScheduleViewMode>(() => {
    return parseView(searchParams.get('view')) ?? 'week';
  });

  const storageHydrated = useRef(false);
  const skipUrlSync = useRef(true);

  useLayoutEffect(() => {
    if (storageHydrated.current) {
      return;
    }

    const fromUrl = parseView(searchParams.get('view'));
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
        setViewModeState('month');
        const p = new URLSearchParams(searchParams);
        p.set('view', 'month');
        const q = p.toString();
        router.replace(q ? `${pathname}?${q}` : pathname);
      }
    }
    storageHydrated.current = true;
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (skipUrlSync.current) {
      skipUrlSync.current = false;
      return;
    }
    const v = parseView(searchParams.get('view'));
    if (v === null) {
      setViewModeState((c) => {
        if (c === 'week') return c;
        return 'week';
      });
      try {
        localStorage.setItem(STORAGE_KEY, 'week');
      } catch {
        // ignore
      }
    } else {
      setViewModeState((c) => (c === v ? c : v));
      try {
        localStorage.setItem(STORAGE_KEY, v);
      } catch {
        // ignore
      }
    }
  }, [searchParams]);

  const setViewMode = useCallback(
    (mode: ScheduleViewMode) => {
      setViewModeState(mode);
      try {
        localStorage.setItem(STORAGE_KEY, mode);
      } catch {
        // ignore
      }
      const p = new URLSearchParams(searchParams);
      p.set('view', mode);
      const q = p.toString();
      router.replace(q ? `${pathname}?${q}` : pathname);
    },
    [pathname, router, searchParams],
  );

  return { viewMode, setViewMode };
}
