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
      const touchPoints = navigator.maxTouchPoints ?? 0;
      const hasTouch = touchPoints > 1 || window.matchMedia('(pointer: coarse)').matches;
      const isAppleIPadUa =
        /iPad/i.test(userAgent) ||
        (platform === 'MacIntel' && touchPoints > 1) ||
        (/Macintosh/i.test(userAgent) && /Mobile/i.test(userAgent));
      const isTabletTouchViewport = window.matchMedia(
        '(min-width: 768px) and (max-width: 1368px)',
      ).matches;
      setIsIPad(isAppleIPadUa || (hasTouch && isTabletTouchViewport));
    };

    detectIPad();
    window.addEventListener('resize', detectIPad);
    return () => window.removeEventListener('resize', detectIPad);
  }, []);

  return isIPad;
}
