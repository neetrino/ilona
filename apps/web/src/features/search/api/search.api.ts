import { api } from '@/shared/lib/api';
import type { GlobalSearchResult } from '../types/search.types';
import { normalizeSearchQuery } from '../utils/normalize-search-query';

export async function fetchGlobalSearch(params: { query: string; limit?: number }): Promise<GlobalSearchResult[]> {
  const searchParams = new URLSearchParams();
  searchParams.set('query', normalizeSearchQuery(params.query));
  if (params.limit != null) {
    searchParams.set('limit', String(params.limit));
  }
  return api.get<GlobalSearchResult[]>(`/search?${searchParams.toString()}`);
}
