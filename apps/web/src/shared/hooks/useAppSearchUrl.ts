'use client';

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/config/navigation';
import {
  getLiveSearchParams,
  readUrlSearchParam,
  replaceAppSearchUrl,
  replaceAppSearchParams,
  type SearchParamUpdates,
} from '@/shared/lib/url-search-params';

/** Re-render URL-driven UI after browser back/forward (Next searchParams can lag). */
export function usePopstateUrlSync(setRevision: Dispatch<SetStateAction<number>>): void {
  useEffect(() => {
    const bumpRevision = () => setRevision((revision) => revision + 1);
    window.addEventListener('popstate', bumpRevision);
    return () => window.removeEventListener('popstate', bumpRevision);
  }, [setRevision]);
}

export function useAppSearchUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [urlRevision, setUrlRevision] = useState(0);

  usePopstateUrlSync(setUrlRevision);

  const readParam = useCallback(
    (key: string, fallback?: string) => {
      const value = readUrlSearchParam(key, searchParams, urlRevision);
      return value ?? fallback ?? null;
    },
    [searchParams, urlRevision],
  );

  const replaceParams = useCallback(
    (updates: SearchParamUpdates) => {
      replaceAppSearchUrl({
        router,
        pathname,
        updates,
        scroll: false,
        onReplaced: () => setUrlRevision((revision) => revision + 1),
      });
    },
    [pathname, router],
  );

  const replaceAllParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = getLiveSearchParams(searchParams);
      mutate(params);
      replaceAppSearchParams({
        router,
        pathname,
        params,
        scroll: false,
        onReplaced: () => setUrlRevision((revision) => revision + 1),
      });
    },
    [pathname, router, searchParams],
  );

  return {
    pathname,
    router,
    searchParams,
    urlRevision,
    readParam,
    replaceParams,
    replaceAllParams,
  };
}
