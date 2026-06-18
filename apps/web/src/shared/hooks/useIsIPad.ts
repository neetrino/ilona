'use client';

import { useEffect, useState } from 'react';

export function useIsIPad(): boolean {
  const [isIPad, setIsIPad] = useState(false);

  useEffect(() => {
    if (typeof navigator === 'undefined') {
      return;
    }

    const platform = navigator.platform ?? '';
    const userAgent = navigator.userAgent ?? '';
    const detectedIPad =
      /iPad/i.test(userAgent) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    setIsIPad(detectedIPad);
  }, []);

  return isIPad;
}
