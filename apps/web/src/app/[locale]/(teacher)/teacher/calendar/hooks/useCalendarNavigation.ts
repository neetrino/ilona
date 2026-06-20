import { useState, useEffect, useCallback } from 'react';
import { readUrlSearchParam } from '@/shared/lib/url-search-params';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';

type ViewMode = 'week' | 'month' | 'list';

export function useCalendarNavigation() {
  const { searchParams, urlRevision, replaceParams } = useAppSearchUrl();

  const readViewModeFromUrl = useCallback((): ViewMode => {
    const viewFromUrl = readUrlSearchParam('view', searchParams, urlRevision);
    if (viewFromUrl === 'week' || viewFromUrl === 'month' || viewFromUrl === 'list') {
      return viewFromUrl;
    }
    return 'list';
  }, [searchParams, urlRevision]);

  const [pendingViewMode, setPendingViewMode] = useState<ViewMode | null>(null);
  const viewMode = pendingViewMode ?? readViewModeFromUrl();

  useEffect(() => {
    if (pendingViewMode === null) {
      return;
    }
    if (readViewModeFromUrl() === pendingViewMode) {
      setPendingViewMode(null);
    }
  }, [pendingViewMode, readViewModeFromUrl]);

  const [currentDate, setCurrentDate] = useState(new Date());

  const updateViewModeInUrl = (mode: ViewMode) => {
    setPendingViewMode(mode);
    replaceParams({ view: mode === 'list' ? null : mode });
  };

  const goToToday = () => setCurrentDate(new Date());

  const navigate = (direction: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week' || viewMode === 'month') {
      newDate.setDate(newDate.getDate() + direction * 7);
    } else {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    setCurrentDate(newDate);
  };

  return {
    viewMode,
    currentDate,
    updateViewModeInUrl,
    goToToday,
    navigate,
  };
}
