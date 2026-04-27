'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { List, LayoutGrid } from 'lucide-react';
import { StatCard, DataTable, Badge, Button, ActionButtons } from '@/shared/components/ui';
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
  const router = useRouter();
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

  const openGroupStatusDialog = (groupId: string, wasActive: boolean) => {
    setStatusDialogError(null);
    setStatusDialog({ groupId, wasActive });
  };

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
        getErrorMessage(err, 'Could not update group status. Please try again.')
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
      router.push(`/${locale}/admin/groups/${centerId}?${next.toString()}`);
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
  const handleEditGroupIdChange = (id: string | null) => {
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
  };

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
    groups.find((g) => g.id === studentsGroupId)?.name ?? studentsGroupData?.name ?? 'Group';

  const openStudentsModal = (groupId: string) => {
    updateUrl({ studentsGroup: groupId, studentId: null });
  };
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

  const groupColumns = [
    {
      key: 'checkbox',
      header: (
        <SelectAllCheckbox
          checked={allGroupsSelected}
          indeterminate={someGroupsSelected}
          onChange={handleSelectAllGroups}
          disabled={deleteGroup.isPending || isLoading}
        />
      ),
      render: (group: Group) => (
        <input
          type="checkbox"
          className="w-4 h-4 rounded border-slate-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          checked={selectedGroupIds.has(group.id)}
          onChange={() => handleToggleSelectGroup(group.id)}
          onClick={(e) => e.stopPropagation()}
          disabled={deleteGroup.isPending || isLoading}
          aria-label={`Select ${group.name}`}
        />
      ),
      className: '!pl-4 !pr-2 w-12',
    },
    {
      key: 'center',
      header: 'Center',
      render: (group: Group) => (
        <span className="text-slate-700">{group.center?.name || '—'}</span>
      ),
    },
    {
      key: 'name',
      header: 'Group',
      render: (group: Group) => (
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 shrink-0" aria-hidden>
            <GroupIconDisplay iconKey={group.iconKey} size={22} />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-slate-800">{group.name}</p>
            <p className="text-sm text-slate-500">{group.description || 'No description'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'level',
      header: 'Level',
      render: (group: Group) => (
        group.level ? (
          <Badge variant="info">{group.level}</Badge>
        ) : (
          <span className="text-slate-400">—</span>
        )
      ),
    },
    {
      key: 'teacher',
      header: 'Teacher',
      render: (group: Group) => {
        if (!group.teacher) {
          return <span className="text-amber-600 text-sm">Not assigned</span>;
        }
        const firstName = group.teacher.user?.firstName || '';
        const lastName = group.teacher.user?.lastName || '';
        const initials = `${firstName[0] || ''}${lastName[0] || ''}` || '?';
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-medium">
              {initials}
            </div>
            <span className="text-slate-700">{firstName} {lastName}</span>
          </div>
        );
      },
    },
    {
      key: 'students',
      header: 'Students',
      className: 'text-center',
      render: (group: Group) => {
        const count = group._count?.students || 0;
        return (
          <div className="text-center">
            <button
              type="button"
              onClick={() => openStudentsModal(group.id)}
              className="underline decoration-slate-400 underline-offset-2 hover:decoration-primary hover:text-primary font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1 rounded inline"
              title="View students in this group"
            >
              {count}/{group.maxStudents}
            </button>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
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
            <span className="text-sm font-medium text-slate-700">{occupancy.label}</span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (group: Group) => (
        <ActionButtons
          onEdit={() => handleEditGroupIdChange(group.id)}
          onDisable={() => openGroupStatusDialog(group.id, group.isActive)}
          onDelete={() => handleDeleteClick(group.id)}
          isActive={group.isActive}
          disableDisabled={isGroupStatusTogglePending}
          ariaLabels={{
            edit: 'Edit group',
            disable: group.isActive ? 'Deactivate group' : 'Activate group',
            delete: 'Delete group',
          }}
          titles={{
            edit: 'Edit group',
            disable: group.isActive ? 'Deactivate group' : 'Activate group',
            delete: 'Delete group',
          }}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {selectedCenterId && viewMode === 'list' && (
        <nav
          className="flex flex-wrap items-center gap-2 text-sm text-slate-600"
          aria-label="Breadcrumb"
        >
          <Link
            href={`/${locale}/admin/groups`}
            className="font-medium text-primary hover:text-primary/80 hover:underline"
          >
            Centers
          </Link>
          <span className="text-slate-300" aria-hidden>
            /
          </span>
          <span className="font-medium text-slate-800">
            {drillDownCenter?.name ?? '…'}
          </span>
          <span className="text-slate-300" aria-hidden>
            /
          </span>
          <span className="text-slate-500">Groups</span>
        </nav>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {showBoardCenterPicker ? (
          <>
            <StatCard title="Centers" value={allCenters.length} />
            <StatCard
              title="Total Groups"
              value={totalGroupsAcrossCenters}
              change={{ value: 'Across all centers', type: 'neutral' }}
            />
            <StatCard title="Students Enrolled" value="—" change={{ value: 'Open a center', type: 'neutral' }} />
            <StatCard title="Avg Group Size" value="—" change={{ value: 'Per-center view', type: 'neutral' }} />
          </>
        ) : (
          <>
            <StatCard
              title="Total Groups"
              value={totalGroups}
            />
            <StatCard
              title="Active Groups"
              value={activeGroups || totalGroups}
              change={{ value: 'Currently running', type: 'positive' }}
            />
            <StatCard
              title="Students Enrolled"
              value={totalStudentsInGroups}
            />
            <StatCard
              title="Avg Group Size"
              value={averageGroupSize}
              change={{ value: 'students per group', type: 'neutral' }}
            />
          </>
        )}
      </div>

      {/* Filters & Actions — above branch tabs so group search sits right above the panel */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 relative min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder={
              viewMode === 'board' && !activeCenterId
                ? 'Search branches by name...'
                : 'Search groups by name...'
            }
            value={searchQuery}
            onChange={onSearchChange}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        {selectedGroupIds.size > 0 && (
          <Button
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium"
            onClick={handleBulkDeleteGroupsClick}
            disabled={deleteGroup.isPending || isLoading}
          >
            Delete All ({selectedGroupIds.size})
          </Button>
        )}
        <div className="inline-flex rounded-lg border-2 border-slate-300 bg-white p-1 shadow-sm">
          <button
            onClick={() => {
              setViewMode('list');
              setPage(0);
              setSelectedGroupIds(new Set());
              setBoardTabCenterId(null);
              updateUrl({ view: 'list', branch: null });
            }}
            className={cn(
              'px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center gap-2',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              viewMode === 'list'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-slate-700 hover:bg-slate-100'
            )}
            aria-pressed={viewMode === 'list'}
          >
            <List className="w-4 h-4" />
            List
          </button>
          <button
            onClick={() => {
              setViewMode('board');
              updateViewModeInUrl('board');
              setPage(0);
              setSelectedGroupIds(new Set());
            }}
            className={cn(
              'px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center gap-2',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              viewMode === 'board'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-slate-700 hover:bg-slate-100'
            )}
            aria-pressed={viewMode === 'board'}
          >
            <LayoutGrid className="w-4 h-4" />
            Board
          </button>
        </div>

        <Button 
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-medium"
          onClick={() => handleCreateGroupOpenChange(true)}
        >
          + Add Group
        </Button>
      </div>

      {/* Board: branch tabs + groups directly underneath */}
      {viewMode === 'board' && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-b from-slate-50/70 to-white px-3 pt-3">
            {isLoadingBranchTabs ? (
              <div className="py-4 text-sm text-slate-500">Loading branches...</div>
            ) : allCenters.length === 0 ? (
              <div className="py-4 text-sm text-slate-500">No branches found. Create a center first.</div>
            ) : (
              <div className="overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <nav
                  className="flex min-w-max items-center gap-2.5"
                  role="tablist"
                  aria-label="Branches"
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
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2',
                          'active:scale-[0.985]',
                          isActive
                            ? 'shadow-[0_4px_14px_rgba(15,23,42,0.14)]'
                            : 'border-slate-200 bg-white text-slate-600 hover:-translate-y-px hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 hover:shadow-sm'
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
                              : 'group-hover:bg-slate-200 group-hover:text-slate-700'
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
              <p className="py-4 text-sm text-slate-500">No branches match your search.</p>
            )}
          </div>

          <div
            className="p-4 sm:p-5"
            role="tabpanel"
            aria-label={activeBranchTabId ? 'Groups for selected branch' : 'Select a branch'}
          >
            {showBoardCenterPicker ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 py-12 text-center">
                <p className="text-sm text-slate-500">
                  Select a branch tab above — groups will appear here.
                </p>
              </div>
            ) : isLoading ? (
              <div className="flex justify-center py-12 text-sm text-slate-500">Loading groups…</div>
            ) : groups.length === 0 ? (
              <div className="flex justify-center py-12 text-sm text-slate-500">
                {searchQuery ? 'No groups match your search' : 'No groups in this branch'}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
            emptyMessage={searchQuery ? "No groups match your search" : "No groups found"}
          />

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>
              Showing {Math.min(page * pageSize + 1, totalGroups)}-{Math.min((page + 1) * pageSize, totalGroups)} of {totalGroups} groups
            </span>
            <div className="flex items-center gap-2">
              <button 
                className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50" 
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
              <span>Page {page + 1} of {totalPages || 1}</span>
              <button 
                className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50"
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
        itemName={selectedGroupIds.size > 0 ? `${selectedGroupIds.size} ${selectedGroupIds.size === 1 ? 'group' : 'groups'}` : undefined}
        isLoading={deleteGroup.isPending}
        error={bulkDeleteError || undefined}
        itemType="group"
        title="Delete Groups"
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
              ? `${deletedCount} ${deletedCount === 1 ? 'group' : 'groups'} deleted successfully!`
              : 'Groups deleted successfully!'}
          </p>
        </div>
      )}
    </div>
  );
}

