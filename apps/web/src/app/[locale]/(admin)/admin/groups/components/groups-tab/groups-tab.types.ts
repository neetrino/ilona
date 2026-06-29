export interface GroupsTabProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  page: number;
  setPage: (page: number | ((prev: number) => number)) => void;
  viewMode: 'list' | 'board';
  onViewModeChange: (mode: 'list' | 'board', extra?: Record<string, string | null>) => void;
  updateUrl: (updates: Record<string, string | null>, options?: { mode?: 'push' | 'replace' }) => void;
  searchParams: URLSearchParams;
  /** Bumped whenever updateUrl writes to the browser URL (production-safe sync). */
  urlRevision?: number;
  /** When set (center drill-down route), groups are loaded only for this center */
  selectedCenterId?: string | null;
}
