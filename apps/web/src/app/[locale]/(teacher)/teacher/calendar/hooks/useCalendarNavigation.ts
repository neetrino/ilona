import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { readUrlSearchParam, replaceAppSearchUrl } from '@/shared/lib/url-search-params';

type ViewMode = 'week' | 'month' | 'list';

export function useCalendarNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [urlRevision, setUrlRevision] = useState(0);

  const readViewModeFromUrl = useCallback((): ViewMode => {
    const viewFromUrl = readUrlSearchParam('view', searchParams);
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
    replaceAppSearchUrl({
      router,
      pathname,
      updates: { view: mode === 'list' ? null : mode },
      onReplaced: () => setUrlRevision((revision) => revision + 1),
    });
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
