'use client';

import { DataTable } from '@/shared/components/ui';
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
  pageSize,
  totalGroups,
  totalPages,
  onPageChange,
  onClearSelection,
  t,
}: GroupsListViewProps) {
  const visibleColumns =
    activeCenterId && !allGroupsMode
      ? columns.filter((col) => col.key !== 'center')
      : columns;

  return (
    <div className="animate-in fade-in-0 duration-150 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
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

        <div className="mt-4 flex items-center justify-between text-sm text-[#8b8b90] lg:justify-start lg:gap-4">
          <span>
            {t('showingGroups', {
              start: Math.min(page * pageSize + 1, totalGroups),
              end: Math.min((page + 1) * pageSize, totalGroups),
              total: totalGroups,
            })}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                page === 0
                  ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
                  : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]'
              }`}
              disabled={page === 0}
              onClick={() => {
                onPageChange(Math.max(0, page - 1));
                onClearSelection();
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-[#1010a3] px-3 text-xs font-semibold text-white">
              {page + 1}
            </span>
            <button
              type="button"
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                page >= totalPages - 1
                  ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
                  : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]'
              }`}
              disabled={page >= totalPages - 1}
              onClick={() => {
                onPageChange(Math.min(totalPages - 1, page + 1));
                onClearSelection();
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
