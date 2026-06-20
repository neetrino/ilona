export type SearchParamValue = string | number | boolean | null | undefined;
export type SearchParamUpdates = Record<string, SearchParamValue>;
export type UrlStateMode = 'push' | 'replace';

/** Browser pathname is the source of truth in production (localePrefix: never). */
function resolveAppPathname(fallbackPathname: string): string {
  if (typeof window !== 'undefined' && window.location.pathname) {
    return window.location.pathname;
  }
  return fallbackPathname;
}

function getBrowserUrl(): string {
  return `${window.location.pathname}${window.location.search}`;
}

export function getLiveSearchParams(searchParams: URLSearchParams): URLSearchParams {
  if (typeof window !== 'undefined') {
    return new URLSearchParams(window.location.search);
  }
  return new URLSearchParams(searchParams.toString());
}

/** Read a query param from the live browser URL first (production-safe), then from Next searchParams. */
export function readUrlSearchParam(
  key: string,
  searchParams: URLSearchParams,
  urlSyncRevision?: number,
): string | null {
  void urlSyncRevision;
  return getLiveSearchParams(searchParams).get(key);
}

export function applySearchParamUpdates(
  baseSearch: string,
  updates: SearchParamUpdates,
): string {
  const normalizedBase = baseSearch.startsWith('?') ? baseSearch.slice(1) : baseSearch;
  const params = new URLSearchParams(normalizedBase);

  Object.entries(updates).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '' || value === false) {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  });

  return params.toString();
}

interface ReplaceAppSearchUrlOptions {
  pathname: string;
  updates: SearchParamUpdates;
  mode?: UrlStateMode;
  onReplaced?: () => void;
}

/** Apply query updates with the native History API so query-only UI state does not trigger App Router navigation. */
export function replaceAppSearchUrl({
  pathname,
  updates,
  mode = 'replace',
  onReplaced,
}: ReplaceAppSearchUrlOptions): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const appPathname = resolveAppPathname(pathname);
  const currentSearch = window.location.search.startsWith('?')
    ? window.location.search.slice(1)
    : window.location.search;
  const nextQuery = applySearchParamUpdates(currentSearch, updates);
  const nextUrl = nextQuery ? `${appPathname}?${nextQuery}` : appPathname;
  const currentUrl = getBrowserUrl();

  if (currentUrl === nextUrl) {
    onReplaced?.();
    return false;
  }

  if (mode === 'push') {
    window.history.pushState(window.history.state, '', nextUrl);
  } else {
    window.history.replaceState(window.history.state, '', nextUrl);
  }
  onReplaced?.();
  return true;
}

interface ReplaceAppSearchParamsOptions {
  pathname: string;
  params: URLSearchParams;
  mode?: UrlStateMode;
  onReplaced?: () => void;
}

/** Replace the full query string (for hooks that mutate URLSearchParams in place). */
export function replaceAppSearchParams({
  pathname,
  params,
  mode = 'replace',
  onReplaced,
}: ReplaceAppSearchParamsOptions): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const appPathname = resolveAppPathname(pathname);
  const nextQuery = params.toString();
  const nextUrl = nextQuery ? `${appPathname}?${nextQuery}` : appPathname;
  const currentUrl = getBrowserUrl();

  if (currentUrl === nextUrl) {
    onReplaced?.();
    return false;
  }

  if (mode === 'push') {
    window.history.pushState(window.history.state, '', nextUrl);
  } else {
    window.history.replaceState(window.history.state, '', nextUrl);
  }
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
