'use client';

import { GroupCard, type Group } from '@/features/groups';
import { cn } from '@/shared/lib/utils';
import { GroupsBranchTabsStrip } from '../GroupsBranchTabsStrip';
import { BoardCardsPagination } from './BoardCardsPagination';
import { DESKTOP_BOARD_PAGE_SIZE } from './groups-tab.constants';
import type { GroupsTabState } from './useGroupsTab';
import type { CenterWithCount } from '@/features/centers';

interface GroupsBoardViewProps {
  centersForBranchTabs: CenterWithCount[];
  allCentersCount: number;
  activeBranchTabId: string | null;
  allGroupsMode: boolean;
  totalGroupsAcrossCenters: number;
  isLoadingBranchTabs: boolean;
  onBranchSelect: (centerId: string) => void;
  onTotalGroupsClick: () => void;
  showBoardCenterPicker: boolean;
  isLoading: boolean;
  groups: Group[];
  searchQuery: string;
  mobileBoardStartRef: React.RefObject<HTMLDivElement | null>;
  desktopBoardStartRef: React.RefObject<HTMLDivElement | null>;
  isCompactIPad: boolean;
  mobileBoardGroups: Group[];
  desktopBoardGroups: Group[];
  mobileBoardPageSize: number;
  safeMobileBoardPage: number;
  safeDesktopBoardPage: number;
  mobileBoardTotalPages: number;
  desktopBoardTotalPages: number;
  onMobileBoardPageChange: (page: number) => void;
  onDesktopBoardPageChange: (page: number) => void;
  onEditGroup: (groupId: string) => void;
  onStudentClick: (studentId: string) => void;
  t: GroupsTabState['t'];
}

export function GroupsBoardView({
  centersForBranchTabs,
  allCentersCount,
  activeBranchTabId,
  allGroupsMode,
  totalGroupsAcrossCenters,
  isLoadingBranchTabs,
  onBranchSelect,
  onTotalGroupsClick,
  showBoardCenterPicker,
  isLoading,
  groups,
  searchQuery,
  mobileBoardStartRef,
  desktopBoardStartRef,
  isCompactIPad,
  mobileBoardGroups,
  desktopBoardGroups,
  mobileBoardPageSize,
  safeMobileBoardPage,
  safeDesktopBoardPage,
  mobileBoardTotalPages,
  desktopBoardTotalPages,
  onMobileBoardPageChange,
  onDesktopBoardPageChange,
  onEditGroup,
  onStudentClick,
  t,
}: GroupsBoardViewProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 animate-in fade-in-0 duration-150 sm:gap-0 sm:overflow-hidden sm:rounded-2xl sm:border sm:border-slate-100 sm:bg-white sm:shadow-sm">
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm sm:rounded-none sm:border-0 sm:shadow-none">
        <div className="bg-gradient-to-b from-[#fafafa] to-white px-3 pt-3 sm:border-b sm:border-[rgba(14,14,16,0.07)]">
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
          />
          {centersForBranchTabs.length === 0 && !isLoadingBranchTabs && allCentersCount > 0 && (
            <p className="pb-3 text-sm text-[#8b8b90]">{t('noBranchesMatch')}</p>
          )}
        </div>
      </div>

      <div
        role="tabpanel"
        aria-label={
          allGroupsMode
            ? t('totalGroups')
            : activeBranchTabId
              ? t('tabpanelGroupsForBranch')
              : t('tabpanelSelectBranch')
        }
        className="min-w-0 sm:p-5"
      >
        {showBoardCenterPicker ? (
          <div className="rounded-lg border border-dashed border-[rgba(14,14,16,0.07)] bg-[#fafafa]/60 py-12 text-center">
            <p className="text-sm text-[#8b8b90]">{t('selectBranchHint')}</p>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-12 text-sm text-[#8b8b90]">{t('loadingGroups')}</div>
        ) : groups.length === 0 ? (
          <div className="flex justify-center py-12 text-sm text-[#8b8b90]">
            {searchQuery ? t('noGroupsMatch') : t('noGroupsInBranch')}
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <div ref={mobileBoardStartRef} className={isCompactIPad ? '' : 'sm:hidden'} />
            <div
              ref={desktopBoardStartRef}
              className={cn('hidden sm:block', isCompactIPad && 'sm:hidden')}
            />

            <div
              className={cn(
                'grid w-full min-w-0 gap-3',
                isCompactIPad ? 'grid-cols-2' : 'grid-cols-1',
                !isCompactIPad && 'sm:hidden',
              )}
            >
              {mobileBoardGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onEdit={() => onEditGroup(group.id)}
                  onStudentClick={onStudentClick}
                />
              ))}
            </div>

            <div
              className={cn(
                'hidden w-full min-w-0 grid-cols-1 gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3',
                isCompactIPad && 'sm:hidden',
              )}
            >
              {desktopBoardGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onEdit={() => onEditGroup(group.id)}
                  onStudentClick={onStudentClick}
                />
              ))}
            </div>

            {!isCompactIPad && (
              <BoardCardsPagination
                currentPage={safeDesktopBoardPage}
                totalPages={desktopBoardTotalPages}
                pageSize={DESKTOP_BOARD_PAGE_SIZE}
                totalItems={groups.length}
                onPageChange={onDesktopBoardPageChange}
                className="hidden sm:flex lg:justify-start lg:gap-4"
                t={t}
              />
            )}

            <BoardCardsPagination
              currentPage={safeMobileBoardPage}
              totalPages={mobileBoardTotalPages}
              pageSize={mobileBoardPageSize}
              totalItems={groups.length}
              onPageChange={onMobileBoardPageChange}
              className={cn(!isCompactIPad && 'sm:hidden')}
              t={t}
            />
          </div>
        )}
      </div>
    </div>
  );
}
