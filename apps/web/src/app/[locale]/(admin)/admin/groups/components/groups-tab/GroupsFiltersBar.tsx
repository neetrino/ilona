'use client';

import { Button, ListBoardViewToggle } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import type { GroupsTabState } from './useGroupsTab';

interface GroupsFiltersBarProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  searchPlaceholder: string;
  selectedCount: number;
  allGroupsSelected: boolean;
  onBulkDelete: () => void;
  deletePending: boolean;
  isLoading: boolean;
  isLg: boolean;
  viewMode: 'list' | 'board';
  onViewModeChange: (mode: 'list' | 'board') => void;
  onAddGroup: () => void;
  t: GroupsTabState['t'];
}

export function GroupsFiltersBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  selectedCount,
  allGroupsSelected,
  onBulkDelete,
  deletePending,
  isLoading,
  isLg,
  viewMode,
  onViewModeChange,
  onAddGroup,
  t,
}: GroupsFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative min-w-0 flex-1 basis-full sm:basis-[12rem]">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8b8b90]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="search"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={onSearchChange}
          className={cn(
            'h-11 min-h-11 w-full rounded-[15px] border border-[rgba(14,14,16,0.07)] bg-white py-0 pl-10 pr-4 text-sm focus:border-[#1010a3] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20',
          )}
        />
      </div>

      {selectedCount > 0 && (
        <Button
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium"
          onClick={onBulkDelete}
          disabled={deletePending || isLoading}
        >
          {allGroupsSelected
            ? t('deleteAll', { count: selectedCount })
            : t('deleteSelected', { count: selectedCount })}
        </Button>
      )}

      {isLg ? (
        <div className="flex w-full shrink-0 items-center gap-3 sm:w-auto">
          <ListBoardViewToggle
            value={viewMode}
            onChange={onViewModeChange}
            listLabel={t('listView')}
            boardLabel={t('boardView')}
            className="h-11 min-h-11 w-full rounded-[15px] sm:w-auto"
          />
          <Button
            size="lg"
            className="h-11 min-h-11 rounded-[15px] px-4 py-0 text-sm font-medium bg-[#1010a3] text-white hover:bg-[#1010a3]/90"
            onClick={onAddGroup}
          >
            {t('addGroupButton')}
          </Button>
        </div>
      ) : null}

      <Button
        className="h-11 min-h-11 w-full rounded-[15px] bg-[#1010a3] px-4 py-0 font-medium text-white hover:bg-[#1010a3]/90 sm:hidden"
        onClick={onAddGroup}
      >
        {t('addGroupButton')}
      </Button>
    </div>
  );
}
