import { useState, useMemo } from 'react';
import { useGroups, useDeleteGroup, useToggleGroupActive, type Group } from '@/features/groups';
import { useCenters, type CenterWithCount } from '@/features/centers';
import { getErrorMessage } from '@/shared/lib/api';

const PAGE_SIZE = 10;

export function useGroupsManagement(viewMode: 'list' | 'board', searchQuery: string, page: number) {
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [editGroupId, setEditGroupId] = useState<string | null>(null);
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
  const [deleteGroupError, setDeleteGroupError] = useState<string | null>(null);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);
  const [bulkDeleteSuccess, setBulkDeleteSuccess] = useState(false);
  const [deletedCount, setDeletedCount] = useState<number>(0);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());

  const shouldFetchAll = viewMode === 'board';
  const { 
    data: groupsData, 
    isLoading 
  } = useGroups({ 
    skip: shouldFetchAll ? 0 : page * PAGE_SIZE,
    take: shouldFetchAll ? 100 : PAGE_SIZE,
    search: searchQuery || undefined,
  });

  const { 
    data: allCentersData 
  } = useCenters({ 
    isActive: undefined,
    take: viewMode === 'board' ? 100 : undefined,
  });

  const deleteGroup = useDeleteGroup();
  const toggleActive = useToggleGroupActive();

  const groups = groupsData?.items || [];
  const totalGroups = groupsData?.total || 0;
  const totalPages = groupsData?.totalPages || 1;
  const allCenters = allCentersData?.items || [];

  const groupsByCenter = useMemo(() => {
    if (viewMode !== 'board') return {};
    
    const grouped: Record<string, Group[]> = {};
    
    allCenters.forEach(center => {
      grouped[center.id] = [];
    });
    
    groups.forEach(group => {
      if (!grouped[group.centerId]) {
        grouped[group.centerId] = [];
      }
      grouped[group.centerId].push(group);
    });
    
    return grouped;
  }, [groups, allCenters, viewMode]);

  const activeGroups = groups.filter(g => g.isActive).length;
  const totalStudentsInGroups = groups.reduce((sum, g) => sum + (g._count?.students || 0), 0);
  const averageGroupSize = groups.length > 0 
    ? Math.round(totalStudentsInGroups / groups.length) 
    : 0;

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
    const currentPageIds = new Set(groups.map((g) => g.id));
    const allCurrentSelected = groups.length > 0 && groups.every((g) => selectedGroupIds.has(g.id));
    
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

  const allGroupsSelected = groups.length > 0 && groups.every((g) => selectedGroupIds.has(g.id));
  const someGroupsSelected = groups.some((g) => selectedGroupIds.has(g.id)) && !allGroupsSelected;

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
          setBulkDeleteSuccess(false);
          setDeletedCount(0);
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
    groups,
    totalGroups,
    totalPages,
    allCenters,
    groupsByCenter,
    activeGroups,
    totalStudentsInGroups,
    averageGroupSize,
    isLoading,
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

