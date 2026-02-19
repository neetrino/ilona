import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

type ViewMode = 'week' | 'month' | 'list';

export function useCalendarNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Initialize view mode from URL query params, with fallback to 'list'
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const viewFromUrl = searchParams.get('view');
    if (viewFromUrl === 'week' || viewFromUrl === 'month' || viewFromUrl === 'list') {
      return viewFromUrl;
    }
    return 'list'; // Default to list view
  });
  
  const [currentDate, setCurrentDate] = useState(new Date());

  // Update URL when view mode changes
  const updateViewModeInUrl = (mode: ViewMode) => {
    // Update state immediately for responsive UI
    setViewMode(mode);
    
    // Update URL to persist the selection
    const params = new URLSearchParams(searchParams.toString());
    if (mode === 'list') {
      // Remove 'view' param for default list view to keep URL clean
      params.delete('view');
    } else {
      params.set('view', mode);
    }
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // Sync view mode from URL (for browser back/forward navigation)
  useEffect(() => {
    const viewFromUrl = searchParams.get('view');
    if (viewFromUrl === 'week' || viewFromUrl === 'month' || viewFromUrl === 'list') {
      setViewMode(viewFromUrl);
    } else if (!viewFromUrl) {
      setViewMode('list');
    }
  }, [searchParams]);

  const goToToday = () => setCurrentDate(new Date());
  
  const navigate = (direction: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
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


