'use client';

import React, { useEffect, useRef } from 'react';
import { StatCard, Button } from '@/shared/components/ui';
import {
  CreateCenterForm,
  EditCenterForm,
  CenterCard,
  DeactivateCenterDialog,
  type CenterWithCount,
} from '@/features/centers';
import { DeleteConfirmationDialog } from '@/features/groups';
import { getErrorMessage } from '@/shared/lib/api';
import { useCentersManagement } from '../hooks/useCentersManagement';

interface CentersTabProps {
  centerSearchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  centerPage: number;
  updateUrl: (updates: Record<string, string | null>) => void;
  searchParams: URLSearchParams;
}

export function CentersTab({
  centerSearchQuery,
  onSearchChange,
  centerPage,
  updateUrl,
  searchParams,
}: CentersTabProps) {
  const {
    centers,
    totalCenters,
    activeCenters,
    isLoadingCenters,
    deleteCenter,
    toggleCenterActive,
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
  } = useCentersManagement('board', centerSearchQuery, centerPage);
  const [deactivateCenter, setDeactivateCenter] = React.useState<CenterWithCount | null>(null);
  const [deactivateError, setDeactivateError] = React.useState<string | null>(null);

  // Ref to track if we're intentionally closing to prevent effect from reopening
  const isClosingRef = useRef(false);

  // Sync editCenterId from URL on mount and when URL changes
  useEffect(() => {
    // Skip sync if we're in the process of closing
    if (isClosingRef.current) {
      return;
    }

    const editCenterFromUrl = searchParams.get('editCenter');
    if (editCenterFromUrl !== editCenterId) {
      if (editCenterFromUrl) {
        setEditCenterId(editCenterFromUrl);
      } else {
        // If URL doesn't have editCenter but state does, clear state
        setEditCenterId(null);
      }
    }
  }, [searchParams, editCenterId, setEditCenterId]);

  // Update URL when editCenterId changes (but not from URL sync)
  const handleEditCenterIdChange = (id: string | null) => {
    if (id === null) {
      // We're closing - set ref to prevent effect from reopening
      isClosingRef.current = true;
      setEditCenterId(null);
      updateUrl({ editCenter: null });
      // Reset ref after a brief delay to allow URL to update
      setTimeout(() => {
        isClosingRef.current = false;
      }, 100);
    } else {
      // Opening - clear ref and update state/URL
      isClosingRef.current = false;
      setEditCenterId(id);
      updateUrl({ editCenter: id });
    }
  };

  const handleCenterActivationAction = async (center: CenterWithCount) => {
    if (center.isActive) {
      setDeactivateError(null);
      setDeactivateCenter(center);
      return;
    }

    try {
      await handleToggleCenterActive(center.id);
    } catch (err) {
      console.error('Failed to activate center:', err);
    }
  };

  const handleDeactivateConfirm = async () => {
    if (!deactivateCenter) return;

    try {
      await handleToggleCenterActive(deactivateCenter.id);
      setDeactivateCenter(null);
      setDeactivateError(null);
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Failed to deactivate center. Please try again.');
      setDeactivateError(message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Centers Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Centers"
          value={totalCenters}
        />
        <StatCard
          title="Active Centers"
          value={activeCenters || totalCenters}
          change={{ value: 'Currently active', type: 'positive' }}
        />
        <StatCard
          title="Total Groups"
          value={centers.reduce((sum, c) => sum + (c._count?.groups || 0), 0)}
          change={{ value: 'across all centers', type: 'neutral' }}
        />
      </div>

      {/* Centers Filters & Actions */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Search centers by name or address..."
            value={centerSearchQuery}
            onChange={onSearchChange}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <Button 
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-medium"
          onClick={() => setCreateCenterOpen(true)}
        >
          + Add Center
        </Button>
      </div>

      <div className="w-full overflow-x-auto">
        {isLoadingCenters ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-500">Loading centers...</div>
          </div>
        ) : centers.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-500">
              {centerSearchQuery ? 'No centers match your search' : 'No centers found'}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {centers.map((center) => (
              <CenterCard
                key={center.id}
                center={center}
                onEdit={() => handleEditCenterIdChange(center.id)}
                onDelete={() => handleDeleteCenterClick(center.id)}
                onToggleActive={() => handleCenterActivationAction(center)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateCenterForm 
        open={createCenterOpen} 
        onOpenChange={setCreateCenterOpen} 
      />
      {editCenterId && (
        <EditCenterForm 
          open={!!editCenterId} 
          onOpenChange={(open) => {
            if (!open) {
              handleEditCenterIdChange(null);
            }
          }} 
          centerId={editCenterId}
        />
      )}
      <DeleteConfirmationDialog
        open={!!deleteCenterId}
        onOpenChange={(open: boolean) => !open && setDeleteCenterId(null)}
        onConfirm={handleDeleteCenterConfirm}
        itemName={centers.find(c => c.id === deleteCenterId)?.name}
        isLoading={deleteCenter.isPending}
        error={deleteCenterError || undefined}
        itemType="center"
      />
      <DeactivateCenterDialog
        open={!!deactivateCenter}
        onOpenChange={(open) => {
          if (!open) {
            setDeactivateCenter(null);
            setDeactivateError(null);
          }
        }}
        onConfirm={handleDeactivateConfirm}
        centerName={deactivateCenter?.name}
        isLoading={toggleCenterActive.isPending}
        error={deactivateError}
      />
    </div>
  );
}

