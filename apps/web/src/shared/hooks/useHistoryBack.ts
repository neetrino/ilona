'use client';

import { useCallback } from 'react';
import { useRouter } from '@/config/navigation';

export function useHistoryBack(fallbackPath: string) {
  const router = useRouter();

  return useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackPath);
  }, [fallbackPath, router]);
}
