import { useQuery } from '@tanstack/react-query';
import { fetchGlobalSearch } from '../api/search.api';
import { normalizeSearchQuery } from '../utils/normalize-search-query';

const STALE_MS = 25_000;

export function useGlobalSearch(debouncedQuery: string, enabled: boolean) {
  const q = normalizeSearchQuery(debouncedQuery);
  return useQuery({
    queryKey: ['global-search', q],
    queryFn: () => fetchGlobalSearch({ query: q, limit: 28 }),
    enabled: enabled && q.length >= 2,
    staleTime: STALE_MS,
  });
}
