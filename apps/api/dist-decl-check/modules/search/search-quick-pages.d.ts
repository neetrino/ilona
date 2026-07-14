import { UserRole } from '@ilona/database';
import type { GlobalSearchResult } from './types/search-result.type';
export declare function matchQuickPages(role: UserRole, query: string, take: number): GlobalSearchResult[];
