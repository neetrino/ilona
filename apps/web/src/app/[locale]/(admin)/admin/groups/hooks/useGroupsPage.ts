'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { 
  useGroups, 
  useDeleteGroup, 
  useToggleGroupActive, 
  type Group 
} from '@/features/groups';
import { 
  useCenters, 
  useDeleteCenter, 
  useToggleCenterActive,
  type CenterWithCount 
} from '@/features/centers';
import { getErrorMessage } from '@/shared/lib/api';
import { groupGroupsByCenter, calculateGroupStats } from '../utils';

type TabType = 'groups' | 'centers';
type ViewMode = 'list' | 'board';

const PAGE_SIZE = 10;

export function useGroupsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('groups');
  
  // Groups state
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [editGroupId, setEditGroupId] = useState<string | null>(null);
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
  const [deleteGroupError, setDeleteGroupError] = useState<string | null>(null);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);
  const [bulkDeleteSuccess, setBulkDeleteSuccess] = useState(false);
  const [deletedCount, setDeletedCount] = useState<number>(0);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  
  // View mode state with URL persistence
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const modeFromUrl = searchParams.get('view');
    if (modeFromUrl === 'list' || modeFromUrl === 'board') {
      return modeFromUrl;
    }
    return 'list'; // Default to list view
  });
  
  // Centers state
  const [centerSearchQuery, setCenterSearchQuery] = useState('');
  const [centerPage, setCenterPage] = useState(0);
  const [createCenterOpen, setCreateCenterOpen] = useState(false);
  const [editCenterId, setEditCenterId] = useState<string | null>(null);
  const [deleteCenterId, setDeleteCenterId] = useState<string | null>(null);
  const [deleteCenterError, setDeleteCenterError] = useState<string | null>(null);
  const [isBulkDeleteCentersDialogOpen, setIsBulkDeleteCentersDialogOpen] = useState(false);
  const [bulkDeleteCentersError, setBulkDeleteCentersError] = useState<string | null>(null);
  const [bulkDeleteCentersSuccess, setBulkDeleteCentersSuccess] = useState(false);
  const [deletedCentersCount, setDeletedCentersCount] = useState<number>(0);
  const [selectedCenterIds, setSelectedCenterIds] = useState<Set<string>>(new Set());

  // Sync view mode from URL
  useEffect(() => {
    const modeFromUrl = searchParams.get('view');
    if (modeFromUrl === 'list' || modeFromUrl === 'board') {
      setViewMode(modeFromUrl);
    } else if (!modeFromUrl) {
      setViewMode('list');
    }
  }, [searchParams]);

  // Fetch groups - for board view, fetch max allowed (100); for list view, use pagination
  const shouldFetchAll = viewMode === 'board';
  const { 
    data: groupsData, 
    isLoading 
  } = useGroups({ 
    skip: shouldFetchAll ? 0 : page * PAGE_SIZE,
    take: shouldFetchAll ? 100 : PAGE_SIZE, // API max is 100
    search: searchQuery || undefined,
  });

  // Fetch all centers for board view (only when in board mode)
  const { 
    data: allCentersData 
  } = useCenters({ 
    isActive: undefined, // Get all centers
    take: viewMode === 'board' ? 100 : undefined, // API max is 100
  });

  // Fetch centers for centers tab
  const { 
    data: centersData, 
    isLoading: isLoadingCenters 
  } = useCenters({ 
    skip: centerPage * PAGE_SIZE,
    take: PAGE_SIZE,
    search: centerSearchQuery || undefined,
  });

  // Mutations
  const deleteGroup = useDeleteGroup();
  const toggleActive = useToggleGroupActive();
  const deleteCenter = useDeleteCenter();
  const toggleCenterActive = useToggleCenterActive();

  const groups = groupsData?.items || [];
  const totalGroups = groupsData?.total || 0;
  const totalPages = groupsData?.totalPages || 1;
  const allCenters = allCentersData?.items || [];
  const centers = centersData?.items || [];
  const totalCenters = centersData?.total || 0;
  const totalCenterPages = centersData?.totalPages || 1;

  // Group groups by center for board view
  const groupsByCenter = useMemo(() => {
    return groupGroupsByCenter(groups, allCenters, viewMode);
  }, [groups, allCenters, viewMode]);

  // Group stats
  const groupStats = useMemo(() => {
    return calculateGroupStats(groups);
  }, [groups]);

  // Centers stats
  const activeCenters = centers.filter(c => c.isActive).length;

  // Selection helpers for groups
  const allGroupsSelected = groups.length > 0 && groups.every((g) => selectedGroupIds.has(g.id));
  const someGroupsSelected = groups.some((g) => selectedGroupIds.has(g.id)) && !allGroupsSelected;

  // Selection helpers for centers
  const allCentersSelected = centers.length > 0 && centers.every((c) => selectedCenterIds.has(c.id));
  const someCentersSelected = centers.some((c) => selectedCenterIds.has(c.id)) && !allCentersSelected;

  // Handlers
  const updateViewModeInUrl = (mode: ViewMode) => {
    const params = new URLSearchParams(searchParams.toString());
    if (mode !== 'list') {
      params.set('view', mode);
    } else {
      params.delete('view');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    updateViewModeInUrl(mode);
    setPage(0);
    setSelectedGroupIds(new Set());
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(0);
    setSelectedGroupIds(new Set());
  };

  const handleCenterSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCenterSearchQuery(e.target.value);
    setCenterPage(0);
    setSelectedCenterIds(new Set());
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

  const handleToggleSelectCenter = (centerId: string) => {
    setSelectedCenterIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(centerId)) {
        newSet.delete(centerId);
      } else {
        newSet.add(centerId);
      }
      return newSet;
    });
  };

  const handleSelectAllCenters = () => {
    const currentPageIds = new Set(centers.map((c) => c.id));
    const allCurrentSelected = centers.length > 0 && centers.every((c) => selectedCenterIds.has(c.id));
    
    if (allCurrentSelected) {
      setSelectedCenterIds((prev) => {
        const newSet = new Set(prev);
        currentPageIds.forEach((id) => newSet.delete(id));
        return newSet;
      });
    } else {
      setSelectedCenterIds((prev) => {
        const newSet = new Set(prev);
        currentPageIds.forEach((id) => newSet.add(id));
        return newSet;
      });
    }
  };

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

  const handleDeleteCenterClick = (id: string) => {
    setDeleteCenterId(id);
    setDeleteCenterError(null);
  };

  const handleDeleteCenterConfirm = async () => {
    if (!deleteCenterId) return;
    
    try {
      await deleteCenter.mutateAsync(deleteCenterId);
      setDeleteCenterId(null);
      setDeleteCenterError(null);
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Failed to delete center. Please try again.');
      setDeleteCenterError(message);
    }
  };

  const handleToggleCenterActive = async (id: string) => {
    try {
      await toggleCenterActive.mutateAsync(id);
    } catch (err) {
      console.error('Failed to toggle center status:', err);
    }
  };

  const handleBulkDeleteCentersClick = () => {
    if (selectedCenterIds.size === 0) return;
    setBulkDeleteCentersError(null);
    setBulkDeleteCentersSuccess(false);
    setIsBulkDeleteCentersDialogOpen(true);
  };

  const handleBulkDeleteCentersConfirm = async () => {
    if (selectedCenterIds.size === 0) return;

    setBulkDeleteCentersError(null);
    setBulkDeleteCentersSuccess(false);

    const idsArray = Array.from(selectedCenterIds);
    const count = idsArray.length;
    let successCount = 0;
    let lastError: string | null = null;

    try {
      for (const id of idsArray) {
        try {
          await deleteCenter.mutateAsync(id);
          successCount++;
        } catch (err: unknown) {
          const message = getErrorMessage(err, 'Failed to delete center.');
          lastError = message;
        }
      }

      if (successCount > 0) {
        setDeletedCentersCount(successCount);
        setBulkDeleteCentersSuccess(true);
        setIsBulkDeleteCentersDialogOpen(false);
        setSelectedCenterIds(new Set());
        
        setTimeout(() => {
          setBulkDeleteCentersSuccess(false);
          setDeletedCentersCount(0);
        }, 3000);
      }

      if (lastError && successCount < count) {
        setBulkDeleteCentersError(`Deleted ${successCount} of ${count} centers. ${lastError}`);
      }
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Failed to delete centers. Please try again.');
      setBulkDeleteCentersError(message);
    }
  };

  return {
    // Tab
    activeTab,
    setActiveTab,
    
    // Groups state
    searchQuery,
    page,
    viewMode,
    createGroupOpen,
    editGroupId,
    deleteGroupId,
    deleteGroupError,
    isBulkDeleteDialogOpen,
    bulkDeleteError,
    bulkDeleteSuccess,
    deletedCount,
    selectedGroupIds,
    allGroupsSelected,
    someGroupsSelected,
    
    // Groups data
    groups,
    totalGroups,
    totalPages,
    groupsByCenter,
    allCenters,
    groupStats,
    
    // Groups loading
    isLoading,
    deleteGroup,
    toggleActive,
    
    // Centers state
    centerSearchQuery,
    centerPage,
    createCenterOpen,
    editCenterId,
    deleteCenterId,
    deleteCenterError,
    isBulkDeleteCentersDialogOpen,
    bulkDeleteCentersError,
    bulkDeleteCentersSuccess,
    deletedCentersCount,
    selectedCenterIds,
    allCentersSelected,
    someCentersSelected,
    
    // Centers data
    centers,
    totalCenters,
    totalCenterPages,
    activeCenters,
    
    // Centers loading
    isLoadingCenters,
    deleteCenter,
    toggleCenterActive,
    
    // Handlers
    handleSearchChange,
    handleCenterSearchChange,
    handleViewModeChange,
    handleToggleSelectGroup,
    handleSelectAllGroups,
    handleToggleSelectCenter,
    handleSelectAllCenters,
    handleDeleteClick,
    handleDeleteConfirm,
    handleToggleActive,
    handleBulkDeleteGroupsClick,
    handleBulkDeleteGroupsConfirm,
    handleDeleteCenterClick,
    handleDeleteCenterConfirm,
    handleToggleCenterActive,
    handleBulkDeleteCentersClick,
    handleBulkDeleteCentersConfirm,
    setPage,
    setCenterPage,
    setCreateGroupOpen,
    setEditGroupId,
    setDeleteGroupId,
    setCreateCenterOpen,
    setEditCenterId,
    setDeleteCenterId,
    setBulkDeleteError,
    setBulkDeleteSuccess,
    setBulkDeleteCentersError,
    setBulkDeleteCentersSuccess,
    setSelectedGroupIds,
    setSelectedCenterIds,
    setIsBulkDeleteDialogOpen,
    setIsBulkDeleteCentersDialogOpen,
  };
}

