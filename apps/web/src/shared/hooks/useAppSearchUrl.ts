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
  type UrlStateMode,
} from '@/shared/lib/url-search-params';

interface UpdateSearchParamsOptions {
  mode?: UrlStateMode;
}

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

  const setParams = useCallback(
    (updates: SearchParamUpdates, options: UpdateSearchParamsOptions = {}) => {
      replaceAppSearchUrl({
        pathname,
        updates,
        mode: options.mode ?? 'replace',
        onReplaced: () => setUrlRevision((revision) => revision + 1),
      });
    },
    [pathname],
  );

  const removeParams = useCallback(
    (keys: string[], options: UpdateSearchParamsOptions = {}) => {
      const updates = keys.reduce<Record<string, null>>((acc, key) => {
        acc[key] = null;
        return acc;
      }, {});
      setParams(updates, options);
    },
    [setParams],
  );

  const toggleParam = useCallback(
    (key: string, value: string, options: UpdateSearchParamsOptions = {}) => {
      const currentValue = readUrlSearchParam(key, searchParams, urlRevision);
      setParams({ [key]: currentValue === value ? null : value }, options);
    },
    [searchParams, setParams, urlRevision],
  );

  const replaceAllParams = useCallback(
    (mutate: (params: URLSearchParams) => void, options: UpdateSearchParamsOptions = {}) => {
      const params = getLiveSearchParams(searchParams);
      mutate(params);
      replaceAppSearchParams({
        pathname,
        params,
        mode: options.mode ?? 'replace',
        onReplaced: () => setUrlRevision((revision) => revision + 1),
      });
    },
    [pathname, searchParams],
  );

  return {
    pathname,
    router,
    searchParams,
    urlRevision,
    readParam,
    hasParam: (key: string, value?: string) => {
      const currentValue = readUrlSearchParam(key, searchParams, urlRevision);
      return value === undefined ? currentValue !== null : currentValue === value;
    },
    setParams,
    removeParams,
    toggleParam,
    replaceParams: setParams,
    replaceAllParams,
  };
}
