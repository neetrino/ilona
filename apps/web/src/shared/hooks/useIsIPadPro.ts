'use client';

import { useEffect, useState } from 'react';

export function useIsIPadPro(): boolean {
  const [isIPadPro, setIsIPadPro] = useState(false);

  useEffect(() => {
    if (typeof navigator === 'undefined' || typeof window === 'undefined') {
      return;
    }

    const detectIPadPro = () => {
      const platform = navigator.platform ?? '';
      const userAgent = navigator.userAgent ?? '';
      const touchPoints = navigator.maxTouchPoints ?? 0;

      const isAppleIPadUa =
        /iPad/i.test(userAgent) ||
        (platform === 'MacIntel' && touchPoints > 1) ||
        (/Macintosh/i.test(userAgent) && /Mobile/i.test(userAgent));

      if (!isAppleIPadUa) {
        setIsIPadPro(false);
        return;
      }

      const minScreen = Math.min(window.screen.width, window.screen.height);
      const maxScreen = Math.max(window.screen.width, window.screen.height);

      const isKnownIPadProSize =
        (minScreen === 1024 && maxScreen === 1366) ||
        (minScreen === 834 && maxScreen === 1194);

      setIsIPadPro(isKnownIPadProSize);
    };

    detectIPadPro();
    window.addEventListener('resize', detectIPadPro);
    return () => window.removeEventListener('resize', detectIPadPro);
  }, []);

  return isIPadPro;
}
