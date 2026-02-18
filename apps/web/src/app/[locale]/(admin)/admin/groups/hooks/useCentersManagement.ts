import { useState } from 'react';
import { useCenters, useDeleteCenter, useToggleCenterActive, type CenterWithCount } from '@/features/centers';
import { getErrorMessage } from '@/shared/lib/api';

const PAGE_SIZE = 10;

export function useCentersManagement(centerSearchQuery: string, centerPage: number) {
  const [createCenterOpen, setCreateCenterOpen] = useState(false);
  const [editCenterId, setEditCenterId] = useState<string | null>(null);
  const [deleteCenterId, setDeleteCenterId] = useState<string | null>(null);
  const [deleteCenterError, setDeleteCenterError] = useState<string | null>(null);
  const [isBulkDeleteCentersDialogOpen, setIsBulkDeleteCentersDialogOpen] = useState(false);
  const [bulkDeleteCentersError, setBulkDeleteCentersError] = useState<string | null>(null);
  const [bulkDeleteCentersSuccess, setBulkDeleteCentersSuccess] = useState(false);
  const [deletedCentersCount, setDeletedCentersCount] = useState<number>(0);
  const [selectedCenterIds, setSelectedCenterIds] = useState<Set<string>>(new Set());

  const { 
    data: centersData, 
    isLoading: isLoadingCenters 
  } = useCenters({ 
    skip: centerPage * PAGE_SIZE,
    take: PAGE_SIZE,
    search: centerSearchQuery || undefined,
  });

  const deleteCenter = useDeleteCenter();
  const toggleCenterActive = useToggleCenterActive();

  const centers = centersData?.items || [];
  const totalCenters = centersData?.total || 0;
  const totalCenterPages = centersData?.totalPages || 1;

  const activeCenters = centers.filter(c => c.isActive).length;

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

  const allCentersSelected = centers.length > 0 && centers.every((c) => selectedCenterIds.has(c.id));
  const someCentersSelected = centers.some((c) => selectedCenterIds.has(c.id)) && !allCentersSelected;

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

  return {
    centers,
    totalCenters,
    totalCenterPages,
    activeCenters,
    isLoadingCenters,
    deleteCenter,
    createCenterOpen,
    setCreateCenterOpen,
    editCenterId,
    setEditCenterId,
    deleteCenterId,
    setDeleteCenterId,
    deleteCenterError,
    handleDeleteCenterClick,
    handleDeleteCenterConfirm,
    handleToggleCenterActive,
    selectedCenterIds,
    setSelectedCenterIds,
    handleToggleSelectCenter,
    handleSelectAllCenters,
    allCentersSelected,
    someCentersSelected,
    isBulkDeleteCentersDialogOpen,
    setIsBulkDeleteCentersDialogOpen,
    bulkDeleteCentersError,
    setBulkDeleteCentersError,
    bulkDeleteCentersSuccess,
    setBulkDeleteCentersSuccess,
    deletedCentersCount,
    handleBulkDeleteCentersClick,
    handleBulkDeleteCentersConfirm,
  };
}

