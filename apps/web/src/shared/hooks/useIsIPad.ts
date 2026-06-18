'use client';

import { useEffect, useState } from 'react';

export function useIsIPad(): boolean {
  const [isIPad, setIsIPad] = useState(false);

  useEffect(() => {
    if (typeof navigator === 'undefined' || typeof window === 'undefined') {
      return;
    }

    const detectIPad = () => {
      const platform = navigator.platform ?? '';
      const userAgent = navigator.userAgent ?? '';
      const isAppleIPadUa =
        /iPad/i.test(userAgent) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isTabletTouchViewport = window.matchMedia(
        '(pointer: coarse) and (min-width: 768px) and (max-width: 1366px)',
      ).matches;
      setIsIPad(isAppleIPadUa || isTabletTouchViewport);
    };

    detectIPad();
    window.addEventListener('resize', detectIPad);
    return () => window.removeEventListener('resize', detectIPad);
  }, []);

  return isIPad;
}
