'use client';

import { useEffect, useState } from 'react';

/** Matches admin portal right-side sheet breakpoint (see PORTAL_DESKTOP_SIDE_SHEET_CLASS). */
export const DESKTOP_SIDE_SHEET_MEDIA_QUERY = '(min-width: 1367px)';

export function useIsDesktopSideSheet(): boolean | undefined {
  const [isDesktopSideSheet, setIsDesktopSideSheet] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_SIDE_SHEET_MEDIA_QUERY);
    const sync = () => setIsDesktopSideSheet(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener('change', sync);
    return () => mediaQuery.removeEventListener('change', sync);
  }, []);

  return isDesktopSideSheet;
}
