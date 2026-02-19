'use client';

import React, { useEffect } from 'react';
import { Pencil, Trash2, Ban } from 'lucide-react';
import { StatCard, DataTable, Button } from '@/shared/components/ui';
import { CreateCenterForm, EditCenterForm, type CenterWithCount } from '@/features/centers';
import { DeleteConfirmationDialog } from '@/features/groups';
import { useCentersManagement } from '../hooks/useCentersManagement';

interface SelectAllCheckboxProps {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  disabled?: boolean;
}

function SelectAllCheckbox({ checked, indeterminate, onChange, disabled }: SelectAllCheckboxProps) {
  const checkboxRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      className="w-4 h-4 rounded border-slate-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      checked={checked}
      onChange={onChange}
      onClick={(e) => e.stopPropagation()}
      disabled={disabled}
      aria-label="Select all"
    />
  );
}

interface CentersTabProps {
  centerSearchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  centerPage: number;
  setCenterPage: (page: number | ((prev: number) => number)) => void;
  updateUrl: (updates: Record<string, string | null>) => void;
  searchParams: URLSearchParams;
}

export function CentersTab({
  centerSearchQuery,
  onSearchChange,
  centerPage,
  setCenterPage,
  updateUrl,
  searchParams,
}: CentersTabProps) {
  const {
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
  } = useCentersManagement(centerSearchQuery, centerPage);

  // Sync editCenterId from URL on mount and when URL changes
  useEffect(() => {
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
    setEditCenterId(id);
    updateUrl({ editCenter: id });
  };

  const pageSize = 10;

  const centerColumns = [
    {
      key: 'checkbox',
      header: (
        <SelectAllCheckbox
          checked={allCentersSelected}
          indeterminate={someCentersSelected}
          onChange={handleSelectAllCenters}
          disabled={deleteCenter.isPending || isLoadingCenters}
        />
      ),
      render: (center: CenterWithCount) => (
        <input
          type="checkbox"
          className="w-4 h-4 rounded border-slate-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          checked={selectedCenterIds.has(center.id)}
          onChange={() => handleToggleSelectCenter(center.id)}
          onClick={(e) => e.stopPropagation()}
          disabled={deleteCenter.isPending || isLoadingCenters}
          aria-label={`Select ${center.name}`}
        />
      ),
      className: '!pl-4 !pr-2 w-12',
    },
    {
      key: 'name',
      header: 'Center Name',
      render: (center: CenterWithCount) => (
        <div>
          <p className="font-semibold text-slate-800">{center.name}</p>
          {center.address && (
            <p className="text-sm text-slate-500">{center.address}</p>
          )}
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (center: CenterWithCount) => (
        <div className="space-y-1">
          {center.phone && (
            <p className="text-sm text-slate-700">{center.phone}</p>
          )}
          {center.email && (
            <p className="text-sm text-slate-600">{center.email}</p>
          )}
          {!center.phone && !center.email && (
            <span className="text-slate-400 text-sm">—</span>
          )}
        </div>
      ),
    },
    {
      key: 'groups',
      header: 'Groups',
      className: 'text-center',
      render: (center: CenterWithCount) => (
        <span className="text-slate-700">{center._count?.groups || 0}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (center: CenterWithCount) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleEditCenterIdChange(center.id)}
            className="p-2 text-slate-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            aria-label="Edit center"
            title="Edit center"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteCenterClick(center.id)}
            className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="Delete center"
            title="Delete center"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleCenterActive(center.id)}
            className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            aria-label={center.isActive ? 'Deactivate center' : 'Activate center'}
            title={center.isActive ? 'Deactivate center' : 'Activate center'}
          >
            <Ban className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

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
        {selectedCenterIds.size > 0 && (
          <Button
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium"
            onClick={handleBulkDeleteCentersClick}
            disabled={deleteCenter.isPending || isLoadingCenters}
          >
            Delete All ({selectedCenterIds.size})
          </Button>
        )}
        <Button 
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-medium"
          onClick={() => setCreateCenterOpen(true)}
        >
          + Add Center
        </Button>
      </div>

      {/* Centers Table */}
      <DataTable
        columns={centerColumns}
        data={centers}
        keyExtractor={(center) => center.id}
        isLoading={isLoadingCenters}
        emptyMessage={centerSearchQuery ? "No centers match your search" : "No centers found"}
      />

      {/* Centers Pagination */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          Showing {Math.min(centerPage * pageSize + 1, totalCenters)}-{Math.min((centerPage + 1) * pageSize, totalCenters)} of {totalCenters} centers
        </span>
        <div className="flex items-center gap-2">
          <button 
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50" 
            disabled={centerPage === 0}
            onClick={() => {
              setCenterPage(p => Math.max(0, p - 1));
              setSelectedCenterIds(new Set());
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span>Page {centerPage + 1} of {totalCenterPages || 1}</span>
          <button 
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50"
            disabled={centerPage >= totalCenterPages - 1}
            onClick={() => {
              setCenterPage(p => p + 1);
              setSelectedCenterIds(new Set());
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
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
      <DeleteConfirmationDialog
        open={isBulkDeleteCentersDialogOpen}
        onOpenChange={(open: boolean) => {
          setIsBulkDeleteCentersDialogOpen(open);
          if (!open) {
            setBulkDeleteCentersError(null);
            setBulkDeleteCentersSuccess(false);
          }
        }}
        onConfirm={handleBulkDeleteCentersConfirm}
        itemName={selectedCenterIds.size > 0 ? `${selectedCenterIds.size} ${selectedCenterIds.size === 1 ? 'center' : 'centers'}` : undefined}
        isLoading={deleteCenter.isPending}
        error={bulkDeleteCentersError || undefined}
        itemType="center"
        title="Delete Centers"
      />

      {/* Success Messages */}
      {bulkDeleteCentersSuccess && (
        <div className="fixed bottom-4 right-4 p-4 bg-green-50 border border-green-200 rounded-lg shadow-lg z-50">
          <p className="text-sm text-green-600 font-medium">
            {deletedCentersCount > 0 
              ? `${deletedCentersCount} ${deletedCentersCount === 1 ? 'center' : 'centers'} deleted successfully!`
              : 'Centers deleted successfully!'}
          </p>
        </div>
      )}
    </div>
  );
}

