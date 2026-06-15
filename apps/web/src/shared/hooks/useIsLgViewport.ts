'use client';

import { useEffect, useState } from 'react';
import { PORTAL_DESKTOP_MIN_WIDTH } from '@/shared/lib/role-routes';

const LG_MEDIA_QUERY = `(min-width: ${PORTAL_DESKTOP_MIN_WIDTH}px)`;

export function useIsLgViewport(): boolean | undefined {
  const [isLg, setIsLg] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mediaQuery = window.matchMedia(LG_MEDIA_QUERY);
    const sync = () => setIsLg(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener('change', sync);
    return () => mediaQuery.removeEventListener('change', sync);
  }, []);

  return isLg;
}
