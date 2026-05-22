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
import { GroupStudentsModal } from './GroupStudentsModal';
import { StudentDetailsModal } from './StudentDetailsModal';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { getAdminPortalBasePath } from '@/shared/lib/role-routes';

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
  setViewMode: (mode: 'list' | 'board') => void;
  updateViewModeInUrl: (mode: 'list' | 'board') => void;
  updateUrl: (updates: Record<string, string | null>) => void;
  searchParams: URLSearchParams;
  /** When set (center drill-down route), groups are loaded only for this center */
  selectedCenterId?: string | null;
}

export function GroupsTab({
  searchQuery,
  onSearchChange,
  page,
  setPage,
  viewMode,
  setViewMode,
  updateViewModeInUrl,
  updateUrl,
  searchParams,
  selectedCenterId = null,
}: GroupsTabProps) {
  const locale = useLocale();
  const t = useTranslations('groups');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { user } = useAuthStore();
  const portalBasePath = getAdminPortalBasePath(user?.role);
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
    const branch = searchParams.get('branch');
    if (viewMode === 'board' && !selectedCenterId) {
      setBoardTabCenterId(branch);
    }
  }, [searchParams, viewMode, selectedCenterId]);

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
    createGroupOpen,
    setCreateGroupOpen,
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

    if (searchParams.get('branch') || boardTabCenterId) {
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

  const handleBranchTabClick = (centerId: string) => {
    setPage(0);
    setSelectedGroupIds(new Set());
    if (selectedCenterId) {
      const next = new URLSearchParams(searchParams.toString());
      next.delete('view');
      router.push(`/${locale}${portalBasePath}/groups/${centerId}?${next.toString()}`);
    } else {
      setBoardTabCenterId(centerId);
      updateUrl({ branch: centerId });
    }
  };

  // Ref to track edit modal closing to prevent effect from reopening
  const isClosingRef = useRef(false);
  // Ref to track create modal closing to prevent effect from reopening
  const isCreateClosingRef = useRef(false);

  // Sync editGroupId from URL on mount and when URL changes
  useEffect(() => {
    // Skip sync if we're in the process of closing
    if (isClosingRef.current) {
      return;
    }

    const editGroupFromUrl = searchParams.get('editGroup');
    if (editGroupFromUrl !== editGroupId) {
      if (editGroupFromUrl) {
        setEditGroupId(editGroupFromUrl);
      } else {
        // If URL doesn't have editGroup but state does, clear state
        setEditGroupId(null);
      }
    }
  }, [searchParams, editGroupId, setEditGroupId]);

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

  // Sync createGroupOpen from URL so create modal survives refresh
  useEffect(() => {
    if (isCreateClosingRef.current) {
      return;
    }

    const shouldOpenCreateGroup = searchParams.get('createGroup') === '1';
    if (createGroupOpen !== shouldOpenCreateGroup) {
      setCreateGroupOpen(shouldOpenCreateGroup);
    }
  }, [searchParams, createGroupOpen, setCreateGroupOpen]);

  const handleCreateGroupOpenChange = (open: boolean) => {
    if (!open) {
      isCreateClosingRef.current = true;
      setCreateGroupOpen(false);
      updateUrl({ createGroup: null });
      setTimeout(() => {
        isCreateClosingRef.current = false;
      }, 100);
      return;
    }

    isCreateClosingRef.current = false;
    setCreateGroupOpen(true);
    updateUrl({ createGroup: '1' });
  };

  const pageSize = 10;

  // Students modal state from URL so it survives refresh
  const studentsGroupId = searchParams.get('studentsGroup');
  const selectedStudentId = searchParams.get('studentId');
  const { data: studentsGroupData } = useGroup(studentsGroupId ?? '', !!studentsGroupId);
  const studentsModalGroupName =
    groups.find((g) => g.id === studentsGroupId)?.name ?? studentsGroupData?.name ?? t('groupFallback');

  const openStudentsModal = useCallback((groupId: string) => {
    updateUrl({ studentsGroup: groupId, studentId: null });
  }, [updateUrl]);
  const openStudentDetails = (studentId: string) => {
    updateUrl({ studentId });
  };
  /** From group card: open student profile without opening the group list first */
  const openStudentFromGroupCard = (studentId: string) => {
    updateUrl({ studentsGroup: null, studentId });
  };
  const closeStudentDetails = () => {
    updateUrl({ studentId: null });
  };
  const closeStudentsModal = () => {
    updateUrl({ studentsGroup: null, studentId: null });
  };

  /** Board with a selected branch: only one column — that branch only (never all centers). */
  /** Branch tabs when no group context yet — filter by branch name */
  const centersForBranchTabs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allCenters;
    return allCenters.filter((c) => c.name.toLowerCase().includes(q));
  }, [allCenters, searchQuery]);

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
            <StatCard
              title={t('totalGroups')}
              value={totalGroups}
            />
            <StatCard
              title={t('activeGroups')}
              value={activeGroups || totalGroups}
              change={{ value: t('currentlyRunning'), type: 'positive' }}
            />
            <StatCard
              title={t('studentsEnrolled')}
              value={totalStudentsInGroups}
            />
            <StatCard
              title={t('avgGroupSize')}
              value={averageGroupSize}
              change={{ value: t('studentsPerGroup'), type: 'neutral' }}
            />
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
        <ListBoardViewToggle
          value={viewMode}
          onChange={(mode) => {
            if (mode === 'list') {
              setViewMode('list');
              setPage(0);
              setSelectedGroupIds(new Set());
              setBoardTabCenterId(null);
              updateUrl({ view: 'list', branch: null });
              return;
            }

            setViewMode('board');
            updateViewModeInUrl('board');
            setPage(0);
            setSelectedGroupIds(new Set());
          }}
          listLabel={t('listView')}
          boardLabel={t('boardView')}
        />

        <Button 
          className="bg-[#1010a3] hover:bg-[#1010a3]/90 text-white px-6 py-3 rounded-xl font-medium"
          onClick={() => handleCreateGroupOpenChange(true)}
        >
          {t('addGroupButton')}
        </Button>
      </div>

      {/* Board: branch tabs + groups directly underneath */}
      {viewMode === 'board' && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-[rgba(14,14,16,0.07)]/90 bg-white shadow-sm">
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
                            ? 'shadow-[0_4px_14px_rgba(15,23,42,0.14)]'
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
                              ? 'shadow-sm'
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
              <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groups.map((group) => (
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
            )}
          </div>
        </div>
      )}

      {/* Groups View */}
      {viewMode === 'list' ? (
        <>
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
          <div className="flex items-center justify-between text-sm text-[#8b8b90]">
            <span>
              {t('showingGroups', {
                start: Math.min(page * pageSize + 1, totalGroups),
                end: Math.min((page + 1) * pageSize, totalGroups),
                total: totalGroups,
              })}
            </span>
            <div className="flex items-center gap-2">
              <button 
                className="p-2 rounded-lg hover:bg-[#f6f6f7] disabled:opacity-50" 
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
              <span>{t('pageOf', { current: page + 1, total: totalPages || 1 })}</span>
              <button 
                className="p-2 rounded-lg hover:bg-[#f6f6f7] disabled:opacity-50"
                disabled={page >= totalPages - 1}
                onClick={() => {
                  setPage(p => p + 1);
                  setSelectedGroupIds(new Set());
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </>
      ) : null}

      {/* Modals */}
      <CreateGroupForm 
        open={createGroupOpen} 
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

