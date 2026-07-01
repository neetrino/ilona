'use client';

import { useCallback } from 'react';
import { useRouter } from '@/config/navigation';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';
import { readUrlSearchParam } from '@/shared/lib/url-search-params';
import { resolveReturnToPath } from '@/shared/lib/return-navigation';
import { RETURN_TO_QUERY_KEY } from '@/features/daily-duties/components/daily-duties-url.util';

export function useHistoryBack(fallbackPath: string) {
  const router = useRouter();
  const { searchParams, urlRevision } = useAppSearchUrl();

  return useCallback(() => {
    const returnToParam = readUrlSearchParam(RETURN_TO_QUERY_KEY, searchParams, urlRevision);
    const returnTo = returnToParam ? decodeURIComponent(returnToParam) : null;
    const safeReturnTo = resolveReturnToPath(returnTo);
    if (safeReturnTo) {
      router.push(safeReturnTo);
      return;
    }

    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackPath);
  }, [fallbackPath, router, searchParams, urlRevision]);
}
