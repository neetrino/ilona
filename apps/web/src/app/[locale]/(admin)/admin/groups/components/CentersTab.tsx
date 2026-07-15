'use client';

import React, { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { AdminPaginationControls, Button, StatCard } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import {
  CreateCenterForm,
  EditCenterForm,
  CenterCard,
  CenterDetailsModal,
  DeactivateCenterDialog,
  type CenterWithCount,
} from '@/features/centers';
import { DeleteConfirmationDialog } from '@/features/groups';
import { getErrorMessage } from '@/shared/lib/api';
import { useCentersManagement } from '../hooks/useCentersManagement';
import { readUrlSearchParam } from '@/shared/lib/url-search-params';
import { useIsLgViewport } from '@/shared/hooks/useIsLgViewport';
import { useIsIPad } from '@/shared/hooks/useIsIPad';
import { useIsIPadPro } from '@/shared/hooks/useIsIPadPro';

const DESKTOP_BOARD_PAGE_SIZE = 9;

interface CentersTabProps {
  centerSearchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  centerPage: number;
  updateUrl: (updates: Record<string, string | null>, options?: { mode?: 'push' | 'replace' }) => void;
  searchParams: URLSearchParams;
}

export function CentersTab({
  centerSearchQuery,
  onSearchChange,
  centerPage,
  updateUrl,
  searchParams,
}: CentersTabProps) {
  const t = useTranslations('groups');
  const isLg = useIsLgViewport();
  const isIPad = useIsIPad();
  const isIPadPro = useIsIPadPro();
  const isCompactIPad = isIPad && !isIPadPro;
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
  const [detailsCenterId, setDetailsCenterId] = React.useState<string | null>(null);
  const [desktopBoardPage, setDesktopBoardPage] = React.useState(0);
  const desktopCentersStartRef = useRef<HTMLDivElement | null>(null);
  const isDesktopBoard = isLg !== false && !isCompactIPad;
  const desktopBoardTotalPages = Math.max(
    1,
    Math.ceil(centers.length / DESKTOP_BOARD_PAGE_SIZE),
  );
  const safeDesktopBoardPage = Math.min(desktopBoardPage, desktopBoardTotalPages - 1);
  const desktopBoardCenters = React.useMemo(
    () =>
      centers.slice(
        safeDesktopBoardPage * DESKTOP_BOARD_PAGE_SIZE,
        safeDesktopBoardPage * DESKTOP_BOARD_PAGE_SIZE + DESKTOP_BOARD_PAGE_SIZE,
      ),
    [centers, safeDesktopBoardPage],
  );
  const visibleCenters = isDesktopBoard ? desktopBoardCenters : centers;

  const goToDesktopCentersPage = (nextPage: number) => {
    setDesktopBoardPage(nextPage);
    requestAnimationFrame(() => {
      desktopCentersStartRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  // Ref to track if we're intentionally closing to prevent effect from reopening
  const isClosingRef = useRef(false);

  // Sync editCenterId from URL on mount and when URL changes
  useEffect(() => {
    if (isClosingRef.current) {
      return;
    }

    const editCenterFromUrl = readUrlSearchParam('editCenter', searchParams);
    if (editCenterFromUrl) {
      setEditCenterId(editCenterFromUrl);
    } else {
      setEditCenterId(null);
    }
  }, [searchParams, setEditCenterId]);

  useEffect(() => {
    setDesktopBoardPage(0);
  }, [centerSearchQuery, centers.length, isDesktopBoard]);

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
      const message = getErrorMessage(err, t('failedDeactivateCenter'));
      setDeactivateError(message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Centers Stats Grid */}
      <div className="grid w-full min-w-0 grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <StatCard
            title={t('totalCenters')}
            value={totalCenters}
          />
          <StatCard
            title={t('activeCenters')}
            value={activeCenters || totalCenters}
            change={{ value: t('currentlyActive'), type: 'positive' }}
          />
        </div>
        <StatCard
          title={t('totalGroups')}
          value={centers.reduce((sum, c) => sum + (c._count?.groups || 0), 0)}
          change={{ value: t('acrossAllCenters'), type: 'neutral' }}
        />
      </div>

      {/* Centers Filters & Actions */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative min-w-0 flex-1 basis-full sm:basis-[12rem]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8b8b90]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder={t('searchCentersPlaceholder')}
            value={centerSearchQuery}
            onChange={onSearchChange}
            className={cn(
              'h-11 min-h-11 w-full rounded-[15px] border border-[rgba(14,14,16,0.07)] bg-white py-0 pl-10 pr-4 text-sm focus:border-[#1010a3] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20',
            )}
          />
        </div>
        <Button
          size="lg"
          className="h-11 min-h-11 w-full rounded-[15px] px-4 py-0 text-sm font-medium bg-[#1010a3] text-white hover:bg-[#1010a3]/90 sm:w-auto"
          onClick={() => setCreateCenterOpen(true)}
        >
          + {t('addCenter')}
        </Button>
      </div>

      <div className="w-full overflow-x-auto">
        {isLoadingCenters ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-[#8b8b90]">{t('loadingCenters')}</div>
          </div>
        ) : centers.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-[#8b8b90]">
              {centerSearchQuery ? t('noCentersMatch') : t('noCentersFound')}
            </div>
          </div>
        ) : (
          <>
            <div ref={desktopCentersStartRef} />
            <div className="grid w-full min-w-0 grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))]">
            {visibleCenters.map((center) => (
              <CenterCard
                key={center.id}
                center={center}
                onEdit={() => handleEditCenterIdChange(center.id)}
                onOpenDetails={() => setDetailsCenterId(center.id)}
              />
            ))}
          </div>
          </>
        )}
      </div>

      {isDesktopBoard && centers.length > DESKTOP_BOARD_PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-center lg:justify-start">
          <AdminPaginationControls
            page={safeDesktopBoardPage}
            totalPages={desktopBoardTotalPages}
            onPageChange={goToDesktopCentersPage}
            previousLabel={t('previousCentersPage')}
            nextLabel={t('nextCentersPage')}
          />
        </div>
      )}

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
          onToggleActive={() => {
            const editingCenter = centers.find((center) => center.id === editCenterId);
            if (editingCenter) {
              handleCenterActivationAction(editingCenter);
            }
          }}
          onDelete={() => handleDeleteCenterClick(editCenterId)}
          isStatusTogglePending={toggleCenterActive.isPending}
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
      <CenterDetailsModal
        centerId={detailsCenterId}
        open={!!detailsCenterId}
        onClose={() => setDetailsCenterId(null)}
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

