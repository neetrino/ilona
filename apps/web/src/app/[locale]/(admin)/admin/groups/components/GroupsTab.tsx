'use client';

import React, { useEffect } from 'react';
import { List, LayoutGrid } from 'lucide-react';
import { StatCard, DataTable, Badge, Button, ActionButtons } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { GroupCard, CreateGroupForm, EditGroupForm, DeleteConfirmationDialog, type Group } from '@/features/groups';
import { useGroupsManagement } from '../hooks/useGroupsManagement';

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
}: GroupsTabProps) {
  const {
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
  } = useGroupsManagement(viewMode, searchQuery, page);

  // Sync editGroupId from URL on mount and when URL changes
  useEffect(() => {
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
    setEditGroupId(id);
    updateUrl({ editGroup: id });
  };

  const pageSize = 10;

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
        <div>
          <p className="font-semibold text-slate-800">{group.name}</p>
          <p className="text-sm text-slate-500">{group.description || 'No description'}</p>
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
      render: (group: Group) => (
        <div className="text-center">
          <span className="font-medium text-slate-800">{group._count?.students || 0}</span>
          <span className="text-slate-400">/{group.maxStudents}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (group: Group) => (
        <ActionButtons
          onEdit={() => handleEditGroupIdChange(group.id)}
          onDisable={() => handleToggleActive(group.id)}
          onDelete={() => handleDeleteClick(group.id)}
          isActive={group.isActive}
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
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
      </div>

      {/* Filters & Actions */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Search groups by name..."
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
        {/* View Mode Toggle */}
        <div className="inline-flex rounded-lg border-2 border-slate-300 bg-white p-1 shadow-sm">
          <button
            onClick={() => {
              setViewMode('list');
              updateViewModeInUrl('list');
              setPage(0);
              setSelectedGroupIds(new Set());
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
          onClick={() => setCreateGroupOpen(true)}
        >
          + Add Group
        </Button>
      </div>

      {/* Groups View */}
      {viewMode === 'list' ? (
        <>
          {/* Groups Table */}
          <DataTable
            columns={groupColumns}
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
      ) : (
        /* Board View */
        <div className="w-full overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-slate-500">Loading groups...</div>
            </div>
          ) : allCenters.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-slate-500">No centers found. Please create a center first.</div>
            </div>
          ) : (
            <div className="flex gap-4 pb-4 min-w-max">
              {allCenters
                .filter((center) => {
                  if (searchQuery) {
                    const centerGroups = groupsByCenter[center.id] || [];
                    return centerGroups.length > 0;
                  }
                  return true;
                })
                .map((center) => {
                  const centerGroups = groupsByCenter[center.id] || [];
                  return (
                    <div
                      key={center.id}
                      className="flex-shrink-0 w-80 bg-slate-50 rounded-xl border border-slate-200 flex flex-col"
                    >
                      {/* Column Header */}
                      <div className="p-4 border-b border-slate-200 bg-white rounded-t-xl">
                        <h3 className="font-semibold text-slate-800">{center.name}</h3>
                        <p className="text-sm text-slate-500 mt-1">
                          {centerGroups.length} {centerGroups.length === 1 ? 'group' : 'groups'}
                        </p>
                      </div>

                      {/* Column Content */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[400px] max-h-[calc(100vh-400px)]">
                        {centerGroups.length === 0 ? (
                          <div className="text-center py-8 text-slate-400 text-sm">
                            No groups
                          </div>
                        ) : (
                          centerGroups.map((group) => (
                            <GroupCard
                              key={group.id}
                              group={group}
                              onEdit={() => handleEditGroupIdChange(group.id)}
                              onDelete={() => handleDeleteClick(group.id)}
                              onToggleActive={() => handleToggleActive(group.id)}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              {searchQuery && allCenters.filter((center) => {
                const centerGroups = groupsByCenter[center.id] || [];
                return centerGroups.length > 0;
              }).length === 0 && (
                <div className="flex items-center justify-center py-12 w-full">
                  <div className="text-slate-500">No groups match your search</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800 mb-2">Bulk Student Assignment</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Quickly assign multiple students to groups using our batch assignment tool.
              </p>
              <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/90">
                Open Assignment Tool
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800 mb-2">Schedule Templates</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Create recurring lesson schedules for groups automatically.
              </p>
              <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/90">
                Manage Schedules
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateGroupForm 
        open={createGroupOpen} 
        onOpenChange={setCreateGroupOpen} 
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

