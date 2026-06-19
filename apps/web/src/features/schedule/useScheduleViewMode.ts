import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import type { ScheduleViewMode } from '@/features/schedule/schedule-dates';
import { readUrlSearchParam } from '@/shared/lib/url-search-params';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';

function parseView(value: string | null | undefined): ScheduleViewMode | null {
  if (value === 'week' || value === 'month') return value;
  return null;
}

export function useScheduleViewMode(): {
  viewMode: ScheduleViewMode;
  setViewMode: (mode: ScheduleViewMode) => void;
} {
  const { searchParams, urlRevision, replaceParams } = useAppSearchUrl();

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

  const setViewMode = useCallback(
    (mode: ScheduleViewMode) => {
      setPendingViewMode(mode);
      replaceParams({ view: mode }, { mode: 'replace' });
    },
    [replaceParams],
  );

  return { viewMode, setViewMode };
}
