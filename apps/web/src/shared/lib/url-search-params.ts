import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export type SearchParamUpdates = Record<string, string | number | null | undefined>;

export function getLiveSearchParams(searchParams: URLSearchParams): URLSearchParams {
  if (typeof window !== 'undefined') {
    return new URLSearchParams(window.location.search);
  }
  return new URLSearchParams(searchParams.toString());
}

/** Read a query param from the live browser URL first (production-safe), then from Next searchParams. */
export function readUrlSearchParam(key: string, searchParams: URLSearchParams): string | null {
  return getLiveSearchParams(searchParams).get(key);
}

export function applySearchParamUpdates(
  baseSearch: string,
  updates: SearchParamUpdates,
): string {
  const normalizedBase = baseSearch.startsWith('?') ? baseSearch.slice(1) : baseSearch;
  const params = new URLSearchParams(normalizedBase);

  Object.entries(updates).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  });

  return params.toString();
}

interface ReplaceAppSearchUrlOptions {
  router: Pick<AppRouterInstance, 'replace'>;
  pathname: string;
  updates: SearchParamUpdates;
  scroll?: boolean;
  onReplaced?: () => void;
}

/** Apply query updates using the live URL, sync the address bar immediately, then notify Next.js. */
export function replaceAppSearchUrl({
  router,
  pathname,
  updates,
  scroll = false,
  onReplaced,
}: ReplaceAppSearchUrlOptions): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const currentSearch = window.location.search.startsWith('?')
    ? window.location.search.slice(1)
    : window.location.search;
  const nextQuery = applySearchParamUpdates(currentSearch, updates);
  const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
  const currentUrl = `${pathname}${window.location.search}`;

  if (currentUrl === nextUrl) {
    return false;
  }

  window.history.replaceState(window.history.state, '', nextUrl);
  router.replace(nextUrl, { scroll });
  onReplaced?.();
  return true;
}

interface ReplaceAppSearchParamsOptions {
  router: Pick<AppRouterInstance, 'replace'>;
  pathname: string;
  params: URLSearchParams;
  scroll?: boolean;
  onReplaced?: () => void;
}

/** Replace the full query string (for hooks that mutate URLSearchParams in place). */
export function replaceAppSearchParams({
  router,
  pathname,
  params,
  scroll = false,
  onReplaced,
}: ReplaceAppSearchParamsOptions): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const nextQuery = params.toString();
  const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
  const currentUrl = `${pathname}${window.location.search}`;

  if (currentUrl === nextUrl) {
    return false;
  }

  window.history.replaceState(window.history.state, '', nextUrl);
  router.replace(nextUrl, { scroll });
  onReplaced?.();
  return true;
}

export function readGroupsViewMode(searchParams: URLSearchParams): 'list' | 'board' {
  const mode = readUrlSearchParam('view', searchParams);
  if (mode === 'list' || mode === 'board') {
    return mode;
  }
  return 'board';
}
