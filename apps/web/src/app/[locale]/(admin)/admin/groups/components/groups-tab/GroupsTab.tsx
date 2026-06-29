'use client';

import { GroupsSearchResultsBar } from '../GroupsSearchResultsBar';
import { GroupsBoardView } from './GroupsBoardView';
import { GroupsDrillDownBreadcrumb } from './GroupsDrillDownBreadcrumb';
import { GroupsFiltersBar } from './GroupsFiltersBar';
import { GroupsListView } from './GroupsListView';
import { GroupsStatsGrid } from './GroupsStatsGrid';
import { GroupsTabModals } from './GroupsTabModals';
import type { GroupsTabProps } from './groups-tab.types';
import { useGroupsListColumns } from './useGroupsListColumns';
import { useGroupsTab } from './useGroupsTab';

export function GroupsTab(props: GroupsTabProps) {
  const { searchQuery, onSearchChange } = props;
  const state = useGroupsTab(props);

  const groupColumns = useGroupsListColumns({
    allGroupsSelected: state.allGroupsSelected,
    someGroupsSelected: state.someGroupsSelected,
    handleSelectAllGroups: state.handleSelectAllGroups,
    deletePending: state.deleteGroup.isPending,
    isLoading: state.isLoading,
    selectedGroupIds: state.selectedGroupIds,
    handleToggleSelectGroup: state.handleToggleSelectGroup,
    openStudentsModal: state.openStudentsModal,
    t: state.t,
    tCommon: state.tCommon,
  });

  const searchPlaceholder =
    state.viewMode === 'board' && !state.activeCenterId && !state.allGroupsMode
      ? state.t('searchBranchesPlaceholder')
      : state.t('searchGroupsPlaceholder');

  return (
    <div className="space-y-6">
      {state.selectedCenterId && state.viewMode === 'list' && (
        <GroupsDrillDownBreadcrumb
          locale={state.locale}
          portalBasePath={state.portalBasePath}
          centerName={state.drillDownCenter?.name}
          t={state.t}
        />
      )}

      <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        <GroupsStatsGrid
          showBoardCenterPicker={state.showBoardCenterPicker}
          allCentersCount={state.allCenters.length}
          totalGroupsAcrossCenters={state.totalGroupsAcrossCenters}
          totalGroups={state.totalGroups}
          activeGroups={state.activeGroups}
          totalStudentsInGroups={state.totalStudentsInGroups}
          averageGroupSize={state.averageGroupSize}
          t={state.t}
        />
      </div>

      <GroupsFiltersBar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        searchPlaceholder={searchPlaceholder}
        selectedCount={state.selectedGroupIds.size}
        allGroupsSelected={state.allGroupsSelected}
        onBulkDelete={state.handleBulkDeleteGroupsClick}
        deletePending={state.deleteGroup.isPending}
        isLoading={state.isLoading}
        isLg={state.isLg ?? false}
        viewMode={state.viewMode}
        onViewModeChange={state.handleViewModeChange}
        onAddGroup={() => state.handleCreateGroupOpenChange(true)}
        t={state.t}
      />

      {state.isSearchingBranches && !state.isLoadingBranchTabs && (
        <GroupsSearchResultsBar
          count={state.centersForBranchTabs.length}
          label={state.tCommon('searchResults')}
          unitLabel={
            state.centersForBranchTabs.length === 1
              ? state.t('branchSingular')
              : state.t('branches').toLowerCase()
          }
          aria-label={state.t('branchesSearchFound', {
            count: state.centersForBranchTabs.length,
          })}
        />
      )}

      {state.isSearchingGroups && !state.isLoading && (
        <GroupsSearchResultsBar
          count={state.totalGroups}
          label={state.tCommon('searchResults')}
          unitLabel={state.totalGroups === 1 ? state.t('groupWord') : state.t('groupsWord')}
          aria-label={state.t('groupsSearchFound', { count: state.totalGroups })}
        />
      )}

      {state.viewMode === 'board' && (
        <GroupsBoardView
          centersForBranchTabs={state.centersForBranchTabs}
          allCentersCount={state.allCenters.length}
          activeBranchTabId={state.activeBranchTabId}
          allGroupsMode={state.allGroupsMode}
          totalGroupsAcrossCenters={state.totalGroupsAcrossCenters}
          isLoadingBranchTabs={state.isLoadingBranchTabs}
          onBranchSelect={state.handleBranchTabClick}
          onTotalGroupsClick={state.handleTotalGroupsClick}
          showBoardCenterPicker={state.showBoardCenterPicker}
          isLoading={state.isLoading}
          groups={state.groups}
          searchQuery={searchQuery}
          mobileBoardStartRef={state.mobileBoardStartRef}
          desktopBoardStartRef={state.desktopBoardStartRef}
          isCompactIPad={state.isCompactIPad}
          mobileBoardGroups={state.mobileBoardGroups}
          desktopBoardGroups={state.desktopBoardGroups}
          mobileBoardPageSize={state.mobileBoardPageSize}
          safeMobileBoardPage={state.safeMobileBoardPage}
          safeDesktopBoardPage={state.safeDesktopBoardPage}
          mobileBoardTotalPages={state.mobileBoardTotalPages}
          desktopBoardTotalPages={state.desktopBoardTotalPages}
          onMobileBoardPageChange={state.goToMobileBoardPage}
          onDesktopBoardPageChange={state.goToDesktopBoardPage}
          onEditGroup={state.handleEditGroupIdChange}
          onStudentClick={state.openStudentFromGroupCard}
          t={state.t}
        />
      )}

      {state.viewMode === 'list' && (
        <GroupsListView
          selectedCenterId={state.selectedCenterId}
          centersForBranchTabs={state.centersForBranchTabs}
          allCentersCount={state.allCenters.length}
          activeBranchTabId={state.activeBranchTabId}
          allGroupsMode={state.allGroupsMode}
          totalGroupsAcrossCenters={state.totalGroupsAcrossCenters}
          isLoadingBranchTabs={state.isLoadingBranchTabs}
          onBranchSelect={state.handleBranchTabClick}
          onTotalGroupsClick={state.handleTotalGroupsClick}
          columns={groupColumns}
          groups={state.groups}
          isLoading={state.isLoading}
          searchQuery={searchQuery}
          activeCenterId={state.activeCenterId}
          onRowClick={state.handleEditGroupIdChange}
          page={state.page}
          pageSize={state.pageSize}
          totalGroups={state.totalGroups}
          totalPages={state.totalPages}
          onPageChange={state.setPage}
          onClearSelection={() => state.setSelectedGroupIds(new Set())}
          t={state.t}
        />
      )}

      <GroupsTabModals
        isAddGroupOpen={state.isAddGroupOpen}
        onCreateGroupOpenChange={state.handleCreateGroupOpenChange}
        editGroupId={state.editGroupId}
        onEditGroupOpenChange={(open) => {
          if (!open) state.handleEditGroupIdChange(null);
        }}
        groups={state.groups}
        onToggleActiveFromEdit={() => {
          const editingGroup = state.groups.find((group) => group.id === state.editGroupId);
          if (state.editGroupId) {
            state.openGroupStatusDialog(state.editGroupId, editingGroup?.isActive ?? true);
          }
        }}
        onDeleteFromEdit={() => {
          if (state.editGroupId) {
            state.handleDeleteClick(state.editGroupId);
          }
        }}
        isStatusTogglePending={state.isGroupStatusTogglePending}
        statusDialog={state.statusDialog}
        onStatusDialogOpenChange={state.closeGroupStatusDialog}
        onConfirmGroupStatus={state.handleConfirmGroupStatus}
        statusTogglePending={state.isGroupStatusTogglePending}
        statusDialogError={state.statusDialogError}
        deleteGroupId={state.deleteGroupId}
        onDeleteGroupIdChange={(open) => !open && state.setDeleteGroupId(null)}
        onDeleteConfirm={state.handleDeleteConfirm}
        deleteGroupName={state.groups.find((g) => g.id === state.deleteGroupId)?.name}
        deletePending={state.deleteGroup.isPending}
        deleteError={state.deleteGroupError}
        isBulkDeleteDialogOpen={state.isBulkDeleteDialogOpen}
        onBulkDeleteOpenChange={(open) => {
          state.setIsBulkDeleteDialogOpen(open);
          if (!open) {
            state.setBulkDeleteError(null);
            state.setBulkDeleteSuccess(false);
          }
        }}
        onBulkDeleteConfirm={state.handleBulkDeleteGroupsConfirm}
        bulkDeleteItemName={
          state.selectedGroupIds.size > 0
            ? `${state.selectedGroupIds.size} ${
                state.selectedGroupIds.size === 1 ? state.t('groupWord') : state.t('groupsWord')
              }`
            : undefined
        }
        bulkDeleteError={state.bulkDeleteError}
        bulkDeleteSuccess={state.bulkDeleteSuccess}
        deletedCount={state.deletedCount}
        studentsGroupId={state.studentsGroupId}
        studentsModalGroupName={state.studentsModalGroupName}
        onStudentsModalOpenChange={(open) => !open && state.closeStudentsModal()}
        onStudentSelect={state.openStudentDetails}
        selectedStudentId={state.selectedStudentId}
        onStudentDetailsOpenChange={(open) => {
          if (!open) state.closeStudentDetails();
        }}
        t={state.t}
      />
    </div>
  );
}
