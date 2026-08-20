'use client';

import { useRef } from 'react';
import { AdminPaginationControls, DataTable } from '@/shared/components/ui';
import { scrollListStartSoon } from '@/shared/lib/scroll-element-to-list-start';
import { type Group } from '@/features/groups';
import { GroupsBranchTabsStrip } from '../GroupsBranchTabsStrip';
import type { GroupsTabState } from './useGroupsTab';
import type { CenterWithCount } from '@/features/centers';

interface GroupsListViewProps {
  selectedCenterId: string | null;
  centersForBranchTabs: CenterWithCount[];
  allCentersCount: number;
  activeBranchTabId: string | null;
  allGroupsMode: boolean;
  totalGroupsAcrossCenters: number;
  isLoadingBranchTabs: boolean;
  onBranchSelect: (centerId: string) => void;
  onTotalGroupsClick: () => void;
  columns: ReturnType<typeof import('./useGroupsListColumns').useGroupsListColumns>;
  groups: Group[];
  isLoading: boolean;
  searchQuery: string;
  activeCenterId: string | null;
  onRowClick: (groupId: string) => void;
  page: number;
  pageSize: number;
  totalGroups: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onClearSelection: () => void;
  t: GroupsTabState['t'];
}

export function GroupsListView({
  selectedCenterId,
  centersForBranchTabs,
  allCentersCount,
  activeBranchTabId,
  allGroupsMode,
  totalGroupsAcrossCenters,
  isLoadingBranchTabs,
  onBranchSelect,
  onTotalGroupsClick,
  columns,
  groups,
  isLoading,
  searchQuery,
  activeCenterId,
  onRowClick,
  page,
  pageSize: _pageSize,
  totalGroups: _totalGroups,
  totalPages,
  onPageChange,
  onClearSelection,
  t,
}: GroupsListViewProps) {
  const listStartRef = useRef<HTMLDivElement | null>(null);
  const visibleColumns =
    activeCenterId && !allGroupsMode
      ? columns.filter((col) => col.key !== 'center')
      : columns;

  return (
    <div
      ref={listStartRef}
      className="animate-in fade-in-0 duration-150 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
    >
      {!selectedCenterId ? (
        <div className="border-b border-[rgba(14,14,16,0.07)] bg-gradient-to-b from-[#fafafa] to-white px-3 pt-3">
          <GroupsBranchTabsStrip
            centers={centersForBranchTabs}
            totalCentersCount={allCentersCount}
            activeCenterId={activeBranchTabId}
            allGroupsActive={allGroupsMode}
            totalGroupsAcrossCenters={totalGroupsAcrossCenters}
            isLoading={isLoadingBranchTabs}
            onCenterSelect={onBranchSelect}
            onTotalGroupsClick={onTotalGroupsClick}
            t={t}
            tabIdPrefix="list-branch-tab"
          />
          {centersForBranchTabs.length === 0 && !isLoadingBranchTabs && allCentersCount > 0 && (
            <p className="pb-3 text-sm text-[#8b8b90]">{t('noBranchesMatch')}</p>
          )}
        </div>
      ) : null}

      <div className="p-4 sm:p-5">
        <DataTable
          columns={visibleColumns}
          data={groups}
          keyExtractor={(group) => group.id}
          isLoading={isLoading}
          emptyMessage={searchQuery ? t('noGroupsMatch') : t('noGroupsFound')}
          onRowClick={(group) => onRowClick(group.id)}
          embedInParentCard
        />

        <div className="mt-4 flex items-center justify-center lg:justify-start">
          <AdminPaginationControls
            page={page}
            totalPages={totalPages}
            onPageChange={(nextPage) => {
              onPageChange(nextPage);
              onClearSelection();
              scrollListStartSoon(listStartRef.current);
            }}
            previousLabel={t('previousPage')}
            nextLabel={t('nextPage')}
          />
        </div>
      </div>
    </div>
  );
}
