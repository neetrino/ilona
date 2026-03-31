import { useState, useMemo, startTransition } from 'react';
import { useGroups, useDeleteGroup, useToggleGroupActive, type Group } from '@/features/groups';
import { useCenters, useCenter } from '@/features/centers';
import { getErrorMessage } from '@/shared/lib/api';
import { useAuthStore } from '@/features/auth/store/auth.store';

const PAGE_SIZE = 10;

export function useGroupsManagement(
  viewMode: 'list' | 'board',
  searchQuery: string,
  page: number,
  /** Center id from `/admin/groups/[centerId]` */
  routeSelectedCenterId: string | null | undefined,
  /** Selected branch tab on main board (no route) */
  boardTabCenterId: string | null | undefined
) {
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [editGroupId, setEditGroupId] = useState<string | null>(null);
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
  const [deleteGroupError, setDeleteGroupError] = useState<string | null>(null);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);
  const [bulkDeleteSuccess, setBulkDeleteSuccess] = useState(false);
  const [deletedCount, setDeletedCount] = useState<number>(0);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());

  const { user } = useAuthStore();
  const managerCenterId = user?.role === 'MANAGER' ? user.managerCenterId : undefined;

  const activeCenterId = routeSelectedCenterId ?? boardTabCenterId ?? null;

  const showBoardCenterPicker = viewMode === 'board' && !activeCenterId;

  const shouldFetchGroups =
    viewMode === 'list' || (viewMode === 'board' && !!activeCenterId);

  const groupCenterFilter = activeCenterId ?? managerCenterId ?? undefined;

  const shouldFetchAll = viewMode === 'board' && !!activeCenterId;

  const {
    data: groupsData,
    isLoading: isLoadingGroups,
  } = useGroups(
    {
      skip: shouldFetchAll ? 0 : page * PAGE_SIZE,
      take: shouldFetchAll ? 100 : PAGE_SIZE,
      search: searchQuery || undefined,
      centerId: groupCenterFilter,
    },
    shouldFetchGroups
  );

  const {
    data: allCentersData,
    isLoading: isLoadingBoardCenters,
  } = useCenters(
    {
      isActive: undefined,
      take: 100,
    },
    viewMode === 'board'
  );

  const {
    data: drillDownCenter,
    isLoading: isLoadingDrillDownCenter,
  } = useCenter(routeSelectedCenterId ?? '', !!routeSelectedCenterId);

  const deleteGroup = useDeleteGroup();
  const toggleActive = useToggleGroupActive();

  const groups = useMemo(() => groupsData?.items || [], [groupsData?.items]);

  /** Board + branch tab: only show groups for the selected center (filter, not just API trust). */
  const displayGroups = useMemo(() => {
    if (viewMode === 'board' && activeCenterId) {
      return groups.filter((g) => g.centerId === activeCenterId);
    }
    return groups;
  }, [groups, viewMode, activeCenterId]);

  const totalGroups = groupsData?.total || 0;
  const totalPages = groupsData?.totalPages || 1;

  const allCenters = useMemo(() => {
    const centers = allCentersData?.items || [];
    if (!managerCenterId) return centers;
    return centers.filter((c) => c.id === managerCenterId);
  }, [allCentersData?.items, managerCenterId]);

  const totalGroupsAcrossCenters = useMemo(
    () => allCenters.reduce((sum, c) => sum + (c._count?.groups ?? 0), 0),
    [allCenters]
  );

  const groupsByCenter = useMemo(() => {
    if (viewMode !== 'board') return {};
    if (!activeCenterId) {
      const grouped: Record<string, Group[]> = {};
      allCenters.forEach((center) => {
        grouped[center.id] = [];
      });
      groups.forEach((group) => {
        if (!grouped[group.centerId]) {
          grouped[group.centerId] = [];
        }
        grouped[group.centerId].push(group);
      });
      return grouped;
    }
    const centerMeta =
      routeSelectedCenterId && drillDownCenter
        ? drillDownCenter
        : allCenters.find((c) => c.id === activeCenterId);
    if (!centerMeta) return {};
    const only = displayGroups.filter((g) => g.centerId === activeCenterId);
    return { [centerMeta.id]: only };
  }, [
    groups,
    displayGroups,
    allCenters,
    viewMode,
    activeCenterId,
    routeSelectedCenterId,
    drillDownCenter,
  ]);

  const activeGroups = displayGroups.filter((g) => g.isActive).length;
  const totalStudentsInGroups = displayGroups.reduce((sum, g) => sum + (g._count?.students || 0), 0);
  const averageGroupSize =
    displayGroups.length > 0 ? Math.round(totalStudentsInGroups / displayGroups.length) : 0;

  const isLoading =
    (viewMode === 'board' && isLoadingBoardCenters) ||
    (shouldFetchGroups && isLoadingGroups) ||
    (!!routeSelectedCenterId && isLoadingDrillDownCenter && !drillDownCenter);

  const handleDeleteClick = (id: string) => {
    setDeleteGroupId(id);
    setDeleteGroupError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteGroupId) return;

    try {
      await deleteGroup.mutateAsync(deleteGroupId);
      setDeleteGroupId(null);
      setDeleteGroupError(null);
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Failed to delete group. Please try again.');
      setDeleteGroupError(message);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await toggleActive.mutateAsync(id);
    } catch (err) {
      console.error('Failed to toggle group status:', err);
    }
  };

  const handleToggleSelectGroup = (groupId: string) => {
    setSelectedGroupIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleSelectAllGroups = () => {
    const currentPageIds = new Set(displayGroups.map((g) => g.id));
    const allCurrentSelected =
      displayGroups.length > 0 && displayGroups.every((g) => selectedGroupIds.has(g.id));

    if (allCurrentSelected) {
      setSelectedGroupIds((prev) => {
        const newSet = new Set(prev);
        currentPageIds.forEach((id) => newSet.delete(id));
        return newSet;
      });
    } else {
      setSelectedGroupIds((prev) => {
        const newSet = new Set(prev);
        currentPageIds.forEach((id) => newSet.add(id));
        return newSet;
      });
    }
  };

  const allGroupsSelected =
    displayGroups.length > 0 && displayGroups.every((g) => selectedGroupIds.has(g.id));
  const someGroupsSelected =
    displayGroups.some((g) => selectedGroupIds.has(g.id)) && !allGroupsSelected;

  const handleBulkDeleteGroupsClick = () => {
    if (selectedGroupIds.size === 0) return;
    setBulkDeleteError(null);
    setBulkDeleteSuccess(false);
    setIsBulkDeleteDialogOpen(true);
  };

  const handleBulkDeleteGroupsConfirm = async () => {
    if (selectedGroupIds.size === 0) return;

    setBulkDeleteError(null);
    setBulkDeleteSuccess(false);

    const idsArray = Array.from(selectedGroupIds);
    const count = idsArray.length;
    let successCount = 0;
    let lastError: string | null = null;

    try {
      for (const id of idsArray) {
        try {
          await deleteGroup.mutateAsync(id);
          successCount++;
        } catch (err: unknown) {
          const message = getErrorMessage(err, 'Failed to delete group.');
          lastError = message;
        }
      }

      if (successCount > 0) {
        setDeletedCount(successCount);
        setBulkDeleteSuccess(true);
        setIsBulkDeleteDialogOpen(false);
        setSelectedGroupIds(new Set());

        setTimeout(() => {
          startTransition(() => {
            setBulkDeleteSuccess(false);
            setDeletedCount(0);
          });
        }, 3000);
      }

      if (lastError && successCount < count) {
        setBulkDeleteError(`Deleted ${successCount} of ${count} groups. ${lastError}`);
      }
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Failed to delete groups. Please try again.');
      setBulkDeleteError(message);
    }
  };

  return {
    groups: displayGroups,
    totalGroups,
    totalPages,
    allCenters,
    groupsByCenter,
    drillDownCenter,
    activeCenterId,
    showBoardCenterPicker,
    totalGroupsAcrossCenters,
    activeGroups,
    totalStudentsInGroups,
    averageGroupSize,
    isLoading,
    isLoadingBranchTabs: viewMode === 'board' && isLoadingBoardCenters,
      deleteGroup,
    createGroupOpen,
    setCreateGroupOpen,
    editGroupId,
    setEditGroupId,
    deleteGroupId,
    setDeleteGroupId,
    deleteGroupError,
    handleDeleteClick,
    handleDeleteConfirm,
    handleToggleActive,
    selectedGroupIds,
    setSelectedGroupIds,
    handleToggleSelectGroup,
    handleSelectAllGroups,
    allGroupsSelected,
    someGroupsSelected,
    isBulkDeleteDialogOpen,
    setIsBulkDeleteDialogOpen,
    bulkDeleteError,
    setBulkDeleteError,
    bulkDeleteSuccess,
    setBulkDeleteSuccess,
    deletedCount,
    handleBulkDeleteGroupsClick,
    handleBulkDeleteGroupsConfirm,
  };
}
