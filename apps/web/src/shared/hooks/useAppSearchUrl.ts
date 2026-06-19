'use client';

import { useCallback, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  getLiveSearchParams,
  readUrlSearchParam,
  replaceAppSearchUrl,
  replaceAppSearchParams,
  type SearchParamUpdates,
} from '@/shared/lib/url-search-params';

export function useAppSearchUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [urlRevision, setUrlRevision] = useState(0);

  const readParam = useCallback(
    (key: string) => readUrlSearchParam(key, searchParams),
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
