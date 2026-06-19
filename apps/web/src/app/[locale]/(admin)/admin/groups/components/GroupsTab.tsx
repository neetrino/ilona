'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { StatCard, DataTable, Badge, Button, ActionButtons, ListBoardViewToggle } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { getContrastColor, lightenColor } from '@/shared/lib/utils';
import {
  GroupCard,
  CreateGroupForm,
  EditGroupForm,
  DeleteConfirmationDialog,
  GroupStatusConfirmationDialog,
  useGroup,
  getGroupOccupancyMeta,
  GroupIconDisplay,
  type Group,
} from '@/features/groups';
import { getErrorMessage } from '@/shared/lib/api';
import { useGroupsManagement } from '../hooks/useGroupsManagement';
import { readUrlSearchParam, getLiveSearchParams } from '../utils/url';
import { GroupStudentsModal } from './GroupStudentsModal';
import { StudentDetailsModal } from './StudentDetailsModal';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { getAdminPortalBasePath } from '@/shared/lib/role-routes';
import { useIsLgViewport } from '@/shared/hooks/useIsLgViewport';
import { useIsIPad } from '@/shared/hooks/useIsIPad';
import { useIsIPadPro } from '@/shared/hooks/useIsIPadPro';

interface SelectAllCheckboxProps {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  disabled?: boolean;
  ariaLabel: string;
}

function SelectAllCheckbox({ checked, indeterminate, onChange, disabled, ariaLabel }: SelectAllCheckboxProps) {
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
      className="w-4 h-4 rounded border-[rgba(14,14,16,0.12)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      checked={checked}
      onChange={onChange}
      onClick={(e) => e.stopPropagation()}
      disabled={disabled}
      aria-label={ariaLabel}
    />
  );
}

function getOccupancyLabelKey(
  status: ReturnType<typeof getGroupOccupancyMeta>['status']
): 'occupancyFull' | 'occupancyFilling' | 'occupancyRed' {
  if (status === 'full') return 'occupancyFull';
  if (status === 'filling') return 'occupancyFilling';
  return 'occupancyRed';
}

interface GroupsTabProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  page: number;
  setPage: (page: number | ((prev: number) => number)) => void;
  viewMode: 'list' | 'board';
  onViewModeChange: (mode: 'list' | 'board', extra?: Record<string, string | null>) => void;
  updateUrl: (updates: Record<string, string | null>, options?: { mode?: 'push' | 'replace' }) => void;
  searchParams: URLSearchParams;
  /** Bumped whenever updateUrl writes to the browser URL (production-safe sync). */
  urlRevision?: number;
  /** When set (center drill-down route), groups are loaded only for this center */
  selectedCenterId?: string | null;
}

const MOBILE_BOARD_PAGE_SIZE = 5;
const IPAD_BOARD_PAGE_SIZE = 10;
const DESKTOP_BOARD_PAGE_SIZE = 9;

export function GroupsTab({
  searchQuery,
  onSearchChange,
  page,
  setPage,
  viewMode,
  onViewModeChange,
  updateUrl,
  searchParams,
  urlRevision = 0,
  selectedCenterId = null,
}: GroupsTabProps) {
  const locale = useLocale();
  const t = useTranslations('groups');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { user } = useAuthStore();
  const portalBasePath = getAdminPortalBasePath(user?.role);
  const isLg = useIsLgViewport();
  const isIPad = useIsIPad();
  const isIPadPro = useIsIPadPro();
  const isCompactIPad = isIPad && !isIPadPro;
  const mobileBoardPageSize = isCompactIPad ? IPAD_BOARD_PAGE_SIZE : MOBILE_BOARD_PAGE_SIZE;
  const [mobileBoardPage, setMobileBoardPage] = useState(0);
  const [desktopBoardPage, setDesktopBoardPage] = useState(0);
  const mobileBoardStartRef = useRef<HTMLDivElement | null>(null);
  const desktopBoardStartRef = useRef<HTMLDivElement | null>(null);
  const [boardTabCenterId, setBoardTabCenterId] = useState<string | null>(null);
  /** Captured at open; optimistic updates must not change dialog copy */
  const [statusDialog, setStatusDialog] = useState<{
    groupId: string;
    wasActive: boolean;
  } | null>(null);
  const [statusDialogError, setStatusDialogError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedCenterId) {
      setBoardTabCenterId(null);
    }
  }, [selectedCenterId]);

  useEffect(() => {
    const branch = readUrlSearchParam('branch', searchParams);
    if (!selectedCenterId) {
      setBoardTabCenterId(branch);
    }
  }, [searchParams, selectedCenterId, urlRevision]);

  const {
    groups,
    totalGroups,
    totalPages,
    allCenters,
    drillDownCenter,
    activeCenterId,
    showBoardCenterPicker,
    isLoadingBranchTabs,
    totalGroupsAcrossCenters,
    activeGroups,
    totalStudentsInGroups,
    averageGroupSize,
    isLoading,
    deleteGroup,
    editGroupId,
    setEditGroupId,
    deleteGroupId,
    setDeleteGroupId,
    deleteGroupError,
    handleDeleteClick,
    handleDeleteConfirm,
    toggleGroupActive,
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
  } = useGroupsManagement(viewMode, searchQuery, page, selectedCenterId, boardTabCenterId);

  const openGroupStatusDialog = useCallback((groupId: string, wasActive: boolean) => {
    setStatusDialogError(null);
    setStatusDialog({ groupId, wasActive });
  }, []);

  const closeGroupStatusDialog = (open: boolean) => {
    if (!open) {
      if (toggleGroupActive.isPending) return;
      setStatusDialog(null);
      setStatusDialogError(null);
    }
  };

  const handleConfirmGroupStatus = async () => {
    if (!statusDialog) return;
    setStatusDialogError(null);
    try {
      await toggleGroupActive.mutateAsync(statusDialog.groupId);
      setStatusDialog(null);
    } catch (err: unknown) {
      setStatusDialogError(
        getErrorMessage(err, t('statusUpdateFailed'))
      );
    }
  };

  const isGroupStatusTogglePending = toggleGroupActive.isPending;

  useEffect(() => {
    if (viewMode !== 'board' || selectedCenterId || isLoadingBranchTabs) {
      return;
    }

    if (readUrlSearchParam('branch', searchParams) || boardTabCenterId) {
      return;
    }

    const firstCenterId = allCenters[0]?.id;
    if (!firstCenterId) {
      return;
    }

    setBoardTabCenterId(firstCenterId);
    updateUrl({ branch: firstCenterId });
  }, [
    viewMode,
    selectedCenterId,
    isLoadingBranchTabs,
    searchParams,
    boardTabCenterId,
    allCenters,
    updateUrl,
  ]);

  const activeBranchTabId = selectedCenterId ?? boardTabCenterId;
  /** Branch tabs when no group context yet — filter by branch name */
  const centersForBranchTabs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allCenters;
    return allCenters.filter((c) => c.name.toLowerCase().includes(q));
  }, [allCenters, searchQuery]);
  const mobileBoardTotalPages = Math.max(
    1,
    Math.ceil(groups.length / mobileBoardPageSize),
  );
  const safeMobileBoardPage = Math.min(mobileBoardPage, mobileBoardTotalPages - 1);
  const mobileBoardGroups = useMemo(
    () =>
      groups.slice(
        safeMobileBoardPage * mobileBoardPageSize,
        safeMobileBoardPage * mobileBoardPageSize + mobileBoardPageSize,
      ),
    [groups, safeMobileBoardPage, mobileBoardPageSize],
  );
  const desktopBoardTotalPages = Math.max(
    1,
    Math.ceil(groups.length / DESKTOP_BOARD_PAGE_SIZE),
  );
  const safeDesktopBoardPage = Math.min(
    desktopBoardPage,
    desktopBoardTotalPages - 1,
  );
  const desktopBoardGroups = useMemo(
    () =>
      groups.slice(
        safeDesktopBoardPage * DESKTOP_BOARD_PAGE_SIZE,
        safeDesktopBoardPage * DESKTOP_BOARD_PAGE_SIZE + DESKTOP_BOARD_PAGE_SIZE,
      ),
    [groups, safeDesktopBoardPage],
  );

  useEffect(() => {
    setMobileBoardPage(0);
  }, [viewMode, activeBranchTabId, searchQuery, groups.length]);

  useEffect(() => {
    setDesktopBoardPage(0);
  }, [viewMode, activeBranchTabId, searchQuery, groups.length]);

  const goToMobileBoardPage = (nextPage: number) => {
    setMobileBoardPage(nextPage);
    requestAnimationFrame(() => {
      mobileBoardStartRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  const goToDesktopBoardPage = (nextPage: number) => {
    setDesktopBoardPage(nextPage);
    requestAnimationFrame(() => {
      desktopBoardStartRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  const handleBranchTabClick = (centerId: string) => {
    setPage(0);
    setSelectedGroupIds(new Set());
    if (selectedCenterId) {
      const next = getLiveSearchParams(searchParams);
      next.delete('view');
      router.push(`/${locale}${portalBasePath}/groups/${centerId}?${next.toString()}`);
    } else {
      setBoardTabCenterId(centerId);
      updateUrl({ branch: centerId });
    }
  };

  // Ref to track edit modal closing to prevent effect from reopening
  const isClosingRef = useRef(false);

  // Sync editGroupId from URL on mount and when URL changes
  useEffect(() => {
    if (isClosingRef.current) {
      return;
    }

    const editGroupFromUrl = readUrlSearchParam('editGroup', searchParams);
    if (editGroupFromUrl) {
      setEditGroupId(editGroupFromUrl);
      return;
    }

    setEditGroupId(null);
  }, [searchParams, urlRevision, setEditGroupId]);

  // Update URL when editGroupId changes (but not from URL sync)
  const handleEditGroupIdChange = useCallback((id: string | null) => {
    if (id === null) {
      // We're closing - set ref to prevent effect from reopening
      isClosingRef.current = true;
      setEditGroupId(null);
      updateUrl({ editGroup: null });
      // Reset ref after a brief delay to allow URL to update
      setTimeout(() => {
        isClosingRef.current = false;
      }, 100);
    } else {
      // Opening - clear ref and update state/URL
      isClosingRef.current = false;
      setEditGroupId(id);
      updateUrl({ editGroup: id });
    }
  }, [setEditGroupId, updateUrl]);

  const isAddGroupOpen = readUrlSearchParam('modal', searchParams) === 'add-group';

  const handleCreateGroupOpenChange = (open: boolean) => {
    if (!open) {
      updateUrl({ modal: null }, { mode: 'replace' });
      return;
    }

    updateUrl({ modal: 'add-group' }, { mode: 'push' });
  };

  const pageSize = 10;

  useEffect(() => {
    if (isLg === false && viewMode !== 'board') {
      onViewModeChange('board');
      setPage(0);
      setSelectedGroupIds(new Set());
    }
  }, [isLg, onViewModeChange, setPage, setSelectedGroupIds, viewMode]);

  // Students modal state from URL so it survives refresh
  const [pendingStudentsGroupId, setPendingStudentsGroupId] = useState<string | null>(null);
  const [pendingStudentId, setPendingStudentId] = useState<string | null>(null);
  const studentsGroupId =
    pendingStudentsGroupId ?? readUrlSearchParam('studentsGroup', searchParams);
  const selectedStudentId =
    pendingStudentId ?? readUrlSearchParam('studentId', searchParams);

  useEffect(() => {
    if (pendingStudentsGroupId !== null) {
      const fromUrl = readUrlSearchParam('studentsGroup', searchParams);
      if (fromUrl === pendingStudentsGroupId || (!fromUrl && pendingStudentsGroupId === '')) {
        setPendingStudentsGroupId(null);
      }
    }
    if (pendingStudentId !== null) {
      const fromUrl = readUrlSearchParam('studentId', searchParams);
      if (fromUrl === pendingStudentId || (!fromUrl && pendingStudentId === '')) {
        setPendingStudentId(null);
      }
    }
  }, [pendingStudentId, pendingStudentsGroupId, searchParams, urlRevision]);
  const { data: studentsGroupData } = useGroup(studentsGroupId ?? '', !!studentsGroupId);
  const studentsModalGroupName =
    groups.find((g) => g.id === studentsGroupId)?.name ?? studentsGroupData?.name ?? t('groupFallback');

  const openStudentsModal = useCallback((groupId: string) => {
    setPendingStudentsGroupId(groupId);
    setPendingStudentId('');
    updateUrl({ studentsGroup: groupId, studentId: null });
  }, [updateUrl]);
  const openStudentDetails = (studentId: string) => {
    setPendingStudentId(studentId);
    updateUrl({ studentId });
  };
  /** From group card: open student profile without opening the group list first */
  const openStudentFromGroupCard = (studentId: string) => {
    setPendingStudentsGroupId('');
    setPendingStudentId(studentId);
    updateUrl({ studentsGroup: null, studentId });
  };
  const closeStudentDetails = () => {
    setPendingStudentId('');
    updateUrl({ studentId: null });
  };
  const closeStudentsModal = () => {
    setPendingStudentsGroupId('');
    setPendingStudentId('');
    updateUrl({ studentsGroup: null, studentId: null });
  };

  /** Board with a selected branch: only one column — that branch only (never all centers). */
  const groupColumns = useMemo(
    () => [
      {
        key: 'checkbox',
        header: (
          <SelectAllCheckbox
            checked={allGroupsSelected}
            indeterminate={someGroupsSelected}
            onChange={handleSelectAllGroups}
            disabled={deleteGroup.isPending || isLoading}
            ariaLabel={t('selectAll')}
          />
        ),
        render: (group: Group) => (
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-[rgba(14,14,16,0.12)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            checked={selectedGroupIds.has(group.id)}
            onChange={() => handleToggleSelectGroup(group.id)}
            onClick={(e) => e.stopPropagation()}
            disabled={deleteGroup.isPending || isLoading}
            aria-label={t('selectGroupAria', { name: group.name })}
          />
        ),
        className: '!pl-4 !pr-2 w-12',
      },
      {
        key: 'center',
        header: tCommon('center'),
        render: (group: Group) => (
          <span className="text-[#3b3b40]">{group.center?.name || '—'}</span>
        ),
      },
      {
        key: 'name',
        header: tCommon('group'),
        render: (group: Group) => (
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 shrink-0" aria-hidden>
              <GroupIconDisplay iconKey={group.iconKey} size={22} />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-[#3b3b40]">{group.name}</p>
              <p className="text-sm text-[#8b8b90]">{group.description || t('noDescription')}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'level',
        header: tCommon('level'),
        render: (group: Group) => (
          group.level ? (
            <Badge variant="info">{group.level}</Badge>
          ) : (
            <span className="text-[#8b8b90]">—</span>
          )
        ),
      },
      {
        key: 'teacher',
        header: tCommon('teacher'),
        render: (group: Group) => {
          if (!group.teacher) {
            return <span className="text-amber-600 text-sm">{tCommon('notAssigned')}</span>;
          }
          const firstName = group.teacher.user?.firstName || '';
          const lastName = group.teacher.user?.lastName || '';
          const initials = `${firstName[0] || ''}${lastName[0] || ''}` || '?';
          return (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#f1f1f2] flex items-center justify-center text-[#3b3b40] text-sm font-medium">
                {initials}
              </div>
              <span className="text-[#3b3b40]">{firstName} {lastName}</span>
            </div>
          );
        },
      },
      {
        key: 'students',
        header: t('studentsCount'),
        className: 'text-center',
        render: (group: Group) => {
          const count = group._count?.students || 0;
          return (
            <div className="text-center">
              <button
                type="button"
                onClick={() => openStudentsModal(group.id)}
                className="underline decoration-[#8b8b90] underline-offset-2 hover:decoration-[#1010a3] hover:text-[#1010a3] font-medium text-[#3b3b40] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20 focus:ring-offset-1 rounded inline"
                title={t('viewStudentsInGroup')}
              >
                {count}/{group.maxStudents}
              </button>
            </div>
          );
        },
      },
      {
        key: 'status',
        header: tCommon('status'),
        className: 'text-center',
        render: (group: Group) => {
          const count = group._count?.students || 0;
          const occupancy = getGroupOccupancyMeta(count);
          const dotColorClass =
            occupancy.status === 'full'
              ? 'bg-green-500'
              : occupancy.status === 'filling'
                ? 'bg-yellow-500'
                : 'bg-red-500';

          return (
            <div className="flex items-center justify-center gap-2">
              <span
                className={cn('inline-flex h-2.5 w-2.5 rounded-full', dotColorClass)}
                aria-hidden="true"
              />
              <span className="text-sm font-medium text-[#3b3b40]">
                {t(getOccupancyLabelKey(occupancy.status))}
              </span>
            </div>
          );
        },
      },
      {
        key: 'actions',
        header: tCommon('actions'),
        render: (group: Group) => (
          <ActionButtons
            onEdit={() => handleEditGroupIdChange(group.id)}
            onDisable={() => openGroupStatusDialog(group.id, group.isActive)}
            onDelete={() => handleDeleteClick(group.id)}
            isActive={group.isActive}
            disableDisabled={isGroupStatusTogglePending}
            ariaLabels={{
              edit: t('editGroup'),
              disable: group.isActive ? t('deactivateGroup') : t('activateGroup'),
              delete: t('deleteGroup'),
            }}
            titles={{
              edit: t('editGroup'),
              disable: group.isActive ? t('deactivateGroup') : t('activateGroup'),
              delete: t('deleteGroup'),
            }}
          />
        ),
      },
    ],
    [
      allGroupsSelected,
      someGroupsSelected,
      handleSelectAllGroups,
      deleteGroup.isPending,
      isLoading,
      selectedGroupIds,
      handleToggleSelectGroup,
      t,
      tCommon,
      openStudentsModal,
      handleEditGroupIdChange,
      openGroupStatusDialog,
      handleDeleteClick,
      isGroupStatusTogglePending,
    ]
  );

  return (
    <div className="space-y-6">
      {selectedCenterId && viewMode === 'list' && (
        <nav
          className="flex flex-wrap items-center gap-2 text-sm text-[#3b3b40]"
          aria-label={t('breadcrumb')}
        >
          <Link
            href={`/${locale}${portalBasePath}/groups`}
            className="font-medium text-[#1010a3] hover:text-[#1010a3]/80 hover:underline"
          >
            {t('centers')}
          </Link>
          <span className="text-[#8b8b90]" aria-hidden>
            /
          </span>
          <span className="font-medium text-[#3b3b40]">
            {drillDownCenter?.name ?? '…'}
          </span>
          <span className="text-[#8b8b90]" aria-hidden>
            /
          </span>
          <span className="text-[#8b8b90]">{t('groupsLabel')}</span>
        </nav>
      )}

      {/* Stats Grid */}
      <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {showBoardCenterPicker ? (
          <>
            <StatCard title={t('centers')} value={allCenters.length} />
            <StatCard
              title={t('totalGroups')}
              value={totalGroupsAcrossCenters}
              change={{ value: t('acrossAllCenters'), type: 'neutral' }}
            />
            <StatCard title={t('studentsEnrolled')} value="—" change={{ value: t('openACenter'), type: 'neutral' }} />
            <StatCard title={t('avgGroupSize')} value="—" change={{ value: t('perCenterView'), type: 'neutral' }} />
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:col-span-2 lg:col-span-2">
              <StatCard
                title={t('totalGroups')}
                value={totalGroups}
              />
              <StatCard
                title={t('activeGroups')}
                value={activeGroups || totalGroups}
                change={{ value: t('currentlyRunning'), type: 'positive' }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:col-span-2 lg:col-span-2">
              <StatCard
                title={t('studentsEnrolled')}
                value={totalStudentsInGroups}
              />
              <StatCard
                title={t('avgGroupSize')}
                value={averageGroupSize}
                change={{ value: t('studentsPerGroup'), type: 'neutral' }}
              />
            </div>
          </>
        )}
      </div>

      {/* Filters & Actions — above branch tabs so group search sits right above the panel */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative min-w-0 flex-1 basis-full sm:basis-[12rem]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8b8b90]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder={
              viewMode === 'board' && !activeCenterId
                ? t('searchBranchesPlaceholder')
                : t('searchGroupsPlaceholder')
            }
            value={searchQuery}
            onChange={onSearchChange}
            className="w-full pl-10 pr-4 py-3 bg-white border border-[rgba(14,14,16,0.07)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20 focus:border-[#1010a3]"
          />
        </div>
        {selectedGroupIds.size > 0 && (
          <Button
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium"
            onClick={handleBulkDeleteGroupsClick}
            disabled={deleteGroup.isPending || isLoading}
          >
            {t('deleteAll', { count: selectedGroupIds.size })}
          </Button>
        )}
        {isLg ? (
          <div className="flex w-full shrink-0 items-center gap-3 sm:w-auto">
            <ListBoardViewToggle
              value={viewMode}
              onChange={(mode) => {
                if (mode === viewMode) {
                  return;
                }

                setPage(0);
                setSelectedGroupIds(new Set());

                if (mode === 'list') {
                  onViewModeChange('list');
                  return;
                }

                const nextBoardCenterId =
                  selectedCenterId ??
                  readUrlSearchParam('branch', searchParams) ??
                  boardTabCenterId ??
                  allCenters[0]?.id ??
                  null;

                if (!selectedCenterId) {
                  setBoardTabCenterId(nextBoardCenterId);
                }

                onViewModeChange('board', {
                  branch: selectedCenterId ? null : nextBoardCenterId,
                });
              }}
              listLabel={t('listView')}
              boardLabel={t('boardView')}
              className="w-full sm:w-auto"
            />
            <Button
              className="h-10 whitespace-nowrap rounded-lg bg-[#1010a3] px-4 text-sm font-medium text-white hover:bg-[#1010a3]/90"
              onClick={() => handleCreateGroupOpenChange(true)}
            >
              {t('addGroupButton')}
            </Button>
          </div>
        ) : null}

        <Button 
          className="h-12 w-full rounded-lg bg-[#1010a3] px-4 font-medium text-white hover:bg-[#1010a3]/90 sm:hidden"
          onClick={() => handleCreateGroupOpenChange(true)}
        >
          {t('addGroupButton')}
        </Button>
      </div>

      {/* Board: branch tabs + groups directly underneath */}
      {viewMode === 'board' && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm animate-in fade-in-0 duration-150">
          <div className="border-b border-[rgba(14,14,16,0.07)] bg-gradient-to-b from-[#fafafa] to-white px-3 pt-3">
            {isLoadingBranchTabs ? (
              <div className="py-4 text-sm text-[#8b8b90]">{t('loadingBranches')}</div>
            ) : allCenters.length === 0 ? (
              <div className="py-4 text-sm text-[#8b8b90]">{t('noBranchesCreateCenter')}</div>
            ) : (
              <div className="overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <nav
                  className="flex min-w-max items-center gap-2.5"
                  role="tablist"
                  aria-label={t('branches')}
                >
                  {centersForBranchTabs.map((center) => {
                    const count = center._count?.groups ?? 0;
                    const isActive = activeBranchTabId === center.id;
                    const primaryColor = center.colorHex || '#253046';
                    const softColor = lightenColor(primaryColor, 0.65);
                    const chipColor = lightenColor(primaryColor, 0.45);
                    const softBorderColor = lightenColor(primaryColor, 0.35);
                    const activeTextColor = getContrastColor(primaryColor) === 'white' ? '#ffffff' : '#0f172a';
                    return (
                      <button
                        type="button"
                        key={center.id}
                        role="tab"
                        aria-selected={isActive}
                        id={`branch-tab-${center.id}`}
                        onClick={() => handleBranchTabClick(center.id)}
                        className={cn(
                          'group inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm transition-all duration-200',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1010a3]/60 focus-visible:ring-offset-2',
                          'active:scale-[0.985]',
                          isActive
                            ? ''
                            : 'border-[rgba(14,14,16,0.07)] bg-white text-[#3b3b40] hover:-translate-y-px hover:border-[rgba(14,14,16,0.12)] hover:bg-[#fafafa] hover:text-[#3b3b40] hover:shadow-sm'
                        )}
                        style={
                          isActive
                            ? {
                                backgroundColor: primaryColor,
                                color: activeTextColor,
                                borderColor: primaryColor,
                              }
                            : {
                                backgroundColor: softColor,
                                color: '#334155',
                                borderColor: softBorderColor,
                              }
                        }
                      >
                        <span className="max-w-[12rem] truncate font-semibold tracking-[0.01em] sm:max-w-[14rem]">
                          {center.name}
                        </span>
                        <span
                          className={cn(
                            'inline-flex min-w-[1.6rem] items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
                            isActive
                              ? ''
                              : 'group-hover:bg-[#f6f6f7] group-hover:text-[#3b3b40]'
                          )}
                          style={
                            isActive
                              ? {
                                  backgroundColor: lightenColor(primaryColor, 0.22),
                                  color: activeTextColor,
                                }
                              : {
                                  backgroundColor: chipColor,
                                  color: '#1e293b',
                                }
                          }
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            )}
            {centersForBranchTabs.length === 0 && !isLoadingBranchTabs && allCenters.length > 0 && (
              <p className="py-4 text-sm text-[#8b8b90]">{t('noBranchesMatch')}</p>
            )}
          </div>

          <div
            className="p-4 sm:p-5"
            role="tabpanel"
            aria-label={activeBranchTabId ? t('tabpanelGroupsForBranch') : t('tabpanelSelectBranch')}
          >
            {showBoardCenterPicker ? (
              <div className="rounded-lg border border-dashed border-[rgba(14,14,16,0.07)] bg-[#fafafa]/60 py-12 text-center">
                <p className="text-sm text-[#8b8b90]">
                  {t('selectBranchHint')}
                </p>
              </div>
            ) : isLoading ? (
              <div className="flex justify-center py-12 text-sm text-[#8b8b90]">{t('loadingGroups')}</div>
            ) : groups.length === 0 ? (
              <div className="flex justify-center py-12 text-sm text-[#8b8b90]">
                {searchQuery ? t('noGroupsMatch') : t('noGroupsInBranch')}
              </div>
            ) : (
              <div className="space-y-4">
                <div ref={mobileBoardStartRef} className={isCompactIPad ? '' : 'sm:hidden'} />
                <div ref={desktopBoardStartRef} className={cn('hidden sm:block', isCompactIPad && 'sm:hidden')} />
                <div
                  className={cn(
                    'grid w-full min-w-0 gap-4',
                    isCompactIPad ? 'grid-cols-2' : 'grid-cols-1',
                    !isCompactIPad && 'sm:hidden',
                  )}
                >
                  {mobileBoardGroups.map((group) => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      onEdit={() => handleEditGroupIdChange(group.id)}
                      onDelete={() => handleDeleteClick(group.id)}
                      onToggleActive={() => openGroupStatusDialog(group.id, group.isActive)}
                      onStudentClick={openStudentFromGroupCard}
                      isStatusTogglePending={isGroupStatusTogglePending}
                    />
                  ))}
                </div>
                <div className={cn('hidden w-full min-w-0 grid-cols-1 gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3', isCompactIPad && 'sm:hidden')}>
                  {desktopBoardGroups.map((group) => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      onEdit={() => handleEditGroupIdChange(group.id)}
                      onDelete={() => handleDeleteClick(group.id)}
                      onToggleActive={() => openGroupStatusDialog(group.id, group.isActive)}
                      onStudentClick={openStudentFromGroupCard}
                      isStatusTogglePending={isGroupStatusTogglePending}
                    />
                  ))}
                </div>
                {!isCompactIPad && groups.length > DESKTOP_BOARD_PAGE_SIZE && (
                  <div className="hidden items-center justify-between text-sm text-[#8b8b90] sm:flex lg:justify-start lg:gap-4">
                    <span>
                      {safeDesktopBoardPage * DESKTOP_BOARD_PAGE_SIZE + 1}-
                      {Math.min((safeDesktopBoardPage + 1) * DESKTOP_BOARD_PAGE_SIZE, groups.length)} / {groups.length}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                          safeDesktopBoardPage === 0
                            ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
                            : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]'
                        }`}
                        disabled={safeDesktopBoardPage === 0}
                        onClick={() =>
                          goToDesktopBoardPage(Math.max(0, safeDesktopBoardPage - 1))
                        }
                        aria-label="Previous cards page"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-[#1010a3] px-3 text-xs font-semibold text-white">
                        {safeDesktopBoardPage + 1}
                      </span>
                      <button
                        type="button"
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                          safeDesktopBoardPage >= desktopBoardTotalPages - 1
                            ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
                            : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]'
                        }`}
                        disabled={safeDesktopBoardPage >= desktopBoardTotalPages - 1}
                        onClick={() =>
                          goToDesktopBoardPage(
                            Math.min(desktopBoardTotalPages - 1, safeDesktopBoardPage + 1),
                          )
                        }
                        aria-label="Next cards page"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
                {groups.length > mobileBoardPageSize && (
                  <div className={cn('flex items-center justify-between text-sm text-[#8b8b90]', !isCompactIPad && 'sm:hidden')}>
                    <span>
                      {safeMobileBoardPage * mobileBoardPageSize + 1}-
                      {Math.min((safeMobileBoardPage + 1) * mobileBoardPageSize, groups.length)} / {groups.length}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                          safeMobileBoardPage === 0
                            ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
                            : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]'
                        }`}
                        disabled={safeMobileBoardPage === 0}
                        onClick={() => goToMobileBoardPage(Math.max(0, safeMobileBoardPage - 1))}
                        aria-label="Previous cards page"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-[#1010a3] px-3 text-xs font-semibold text-white">
                        {safeMobileBoardPage + 1}
                      </span>
                      <button
                        type="button"
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                          safeMobileBoardPage >= mobileBoardTotalPages - 1
                            ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
                            : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]'
                        }`}
                        disabled={safeMobileBoardPage >= mobileBoardTotalPages - 1}
                        onClick={() =>
                          goToMobileBoardPage(
                            Math.min(mobileBoardTotalPages - 1, safeMobileBoardPage + 1),
                          )
                        }
                        aria-label="Next cards page"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Groups View */}
      {viewMode === 'list' ? (
        <div className="animate-in fade-in-0 duration-150">
          {/* Groups Table */}
          <DataTable
            columns={
              activeCenterId
                ? groupColumns.filter((col) => col.key !== 'center')
                : groupColumns
            }
            data={groups}
            keyExtractor={(group) => group.id}
            isLoading={isLoading}
            emptyMessage={searchQuery ? t('noGroupsMatch') : t('noGroupsFound')}
          />

          {/* Pagination */}
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
                  setPage(p => Math.max(0, p - 1));
                  setSelectedGroupIds(new Set());
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
                  setPage(p => Math.min(totalPages - 1, p + 1));
                  setSelectedGroupIds(new Set());
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modals */}
      <CreateGroupForm 
        open={isAddGroupOpen} 
        onOpenChange={handleCreateGroupOpenChange}
        defaultCenterId={activeCenterId ?? undefined}
      />
      {editGroupId && (
        <EditGroupForm 
          open={!!editGroupId} 
          onOpenChange={(open) => {
            if (!open) {
              handleEditGroupIdChange(null);
            }
          }} 
          groupId={editGroupId}
        />
      )}
      <GroupStatusConfirmationDialog
        open={!!statusDialog}
        onOpenChange={closeGroupStatusDialog}
        onConfirm={handleConfirmGroupStatus}
        action={statusDialog ? (statusDialog.wasActive ? 'deactivate' : 'activate') : 'activate'}
        groupName={statusDialog ? groups.find((g) => g.id === statusDialog.groupId)?.name : undefined}
        isLoading={toggleGroupActive.isPending}
        error={statusDialogError ?? undefined}
      />
      <DeleteConfirmationDialog
        open={!!deleteGroupId}
        onOpenChange={(open) => !open && setDeleteGroupId(null)}
        onConfirm={handleDeleteConfirm}
        itemName={groups.find(g => g.id === deleteGroupId)?.name}
        isLoading={deleteGroup.isPending}
        error={deleteGroupError || undefined}
        itemType="group"
      />
      <DeleteConfirmationDialog
        open={isBulkDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsBulkDeleteDialogOpen(open);
          if (!open) {
            setBulkDeleteError(null);
            setBulkDeleteSuccess(false);
          }
        }}
        onConfirm={handleBulkDeleteGroupsConfirm}
        itemName={selectedGroupIds.size > 0 ? `${selectedGroupIds.size} ${selectedGroupIds.size === 1 ? t('groupWord') : t('groupsWord')}` : undefined}
        isLoading={deleteGroup.isPending}
        error={bulkDeleteError || undefined}
        itemType="group"
        title={t('deleteGroupsTitle')}
      />

      <GroupStudentsModal
        open={!!studentsGroupId}
        onOpenChange={(open) => !open && closeStudentsModal()}
        groupId={studentsGroupId ?? null}
        groupName={studentsModalGroupName}
        onStudentSelect={openStudentDetails}
      />

      <StudentDetailsModal
        open={!!selectedStudentId}
        onOpenChange={(open) => {
          if (!open) closeStudentDetails();
        }}
        studentId={selectedStudentId}
      />

      {/* Success Messages */}
      {bulkDeleteSuccess && (
        <div className="fixed bottom-4 right-4 p-4 bg-green-50 border border-green-200 rounded-lg shadow-lg z-50">
          <p className="text-sm text-green-600 font-medium">
            {deletedCount > 0
              ? t('groupDeletedCount', { count: deletedCount })
              : t('groupsDeletedSuccess')}
          </p>
        </div>
      )}
    </div>
  );
}

