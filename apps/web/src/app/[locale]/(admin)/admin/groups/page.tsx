'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Pencil, Trash2, Ban, List, LayoutGrid } from 'lucide-react';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { StatCard, DataTable, Badge, Button } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';

// Component for select all checkbox with indeterminate state
function SelectAllCheckbox({
  checked,
  indeterminate,
  onChange,
  disabled,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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
import { 
  useGroups, 
  useDeleteGroup, 
  useToggleGroupActive, 
  CreateGroupForm, 
  EditGroupForm,
  DeleteConfirmationDialog,
  type Group 
} from '@/features/groups';
import { 
  useCenters, 
  useDeleteCenter, 
  useToggleCenterActive,
  CreateCenterForm,
  EditCenterForm,
  type CenterWithCount 
} from '@/features/centers';

type TabType = 'groups' | 'centers';
type ViewMode = 'list' | 'board';

interface GroupCardProps {
  group: Group;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}

function GroupCard({ group, onEdit, onDelete, onToggleActive }: GroupCardProps) {
  const teacherName = group.teacher
    ? `${group.teacher.user.firstName} ${group.teacher.user.lastName}`
    : null;
  const studentCount = group._count?.students || 0;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Group Header */}
      <div className="mb-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="font-semibold text-slate-800 text-sm leading-tight flex-1">
            {group.name}
          </h4>
          <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onEdit}
              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              aria-label="Edit group"
              title="Edit group"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onToggleActive}
              className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
              aria-label={group.isActive ? 'Deactivate group' : 'Activate group'}
              title={group.isActive ? 'Deactivate group' : 'Activate group'}
            >
              <Ban className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              aria-label="Delete group"
              title="Delete group"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {group.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mt-1" title={group.description}>
            {group.description}
          </p>
        )}
      </div>

      {/* Group Details */}
      <div className="space-y-2 text-xs">
        {group.level && (
          <div className="flex items-center gap-2">
            <Badge variant="info" className="text-xs py-0.5 px-2">
              {group.level}
            </Badge>
          </div>
        )}

        {teacherName && (
          <div className="flex items-center gap-2 text-slate-600">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="truncate" title={teacherName}>{teacherName}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-slate-600">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span>
            {studentCount}/{group.maxStudents} students
          </span>
        </div>

        {!group.isActive && (
          <div className="pt-1">
            <Badge variant="warning" className="text-xs py-0.5 px-2">
              Inactive
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GroupsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState<TabType>('groups');
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
  const pageSize = 10;

  // View mode state with URL persistence
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const modeFromUrl = searchParams.get('view');
    if (modeFromUrl === 'list' || modeFromUrl === 'board') {
      return modeFromUrl;
    }
    return 'list'; // Default to list view
  });

  // Update URL when view mode changes
  const updateViewModeInUrl = (mode: ViewMode) => {
    const params = new URLSearchParams(searchParams.toString());
    if (mode !== 'list') {
      params.set('view', mode);
    } else {
      params.delete('view');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

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
    skip: shouldFetchAll ? 0 : page * pageSize,
    take: shouldFetchAll ? 100 : pageSize, // API max is 100
    search: searchQuery || undefined,
  });

  // Fetch all centers for board view (only when in board mode)
  const { 
    data: allCentersData 
  } = useCenters({ 
    isActive: undefined, // Get all centers
    take: viewMode === 'board' ? 100 : undefined, // API max is 100
  });

  // Mutations
  const deleteGroup = useDeleteGroup();
  const toggleActive = useToggleGroupActive();

  const groups = groupsData?.items || [];
  const totalGroups = groupsData?.total || 0;
  const totalPages = groupsData?.totalPages || 1;
  const allCenters = allCentersData?.items || [];

  // Group groups by center for board view
  const groupsByCenter = useMemo(() => {
    if (viewMode !== 'board') return {};
    
    const grouped: Record<string, Group[]> = {};
    
    // Initialize all centers
    allCenters.forEach(center => {
      grouped[center.id] = [];
    });
    
    // Assign groups to their centers
    groups.forEach(group => {
      if (!grouped[group.centerId]) {
        grouped[group.centerId] = [];
      }
      grouped[group.centerId].push(group);
    });
    
    return grouped;
  }, [groups, allCenters, viewMode]);

  // Handle search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(0);
    // Clear selection on search change
    setSelectedGroupIds(new Set());
  };

  // Handle delete
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
    } catch (err: any) {
      const message = err?.message || err?.response?.data?.message || 'Failed to delete group. Please try again.';
      setDeleteGroupError(Array.isArray(message) ? message[0] : message);
    }
  };

  // Handle toggle active
  const handleToggleActive = async (id: string) => {
    try {
      await toggleActive.mutateAsync(id);
    } catch (err) {
      console.error('Failed to toggle group status:', err);
    }
  };

  // Handle individual checkbox toggle for groups
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

  // Handle select all toggle for groups
  const handleSelectAllGroups = () => {
    const currentPageIds = new Set(groups.map((g) => g.id));
    const allCurrentSelected = groups.length > 0 && groups.every((g) => selectedGroupIds.has(g.id));
    
    if (allCurrentSelected) {
      // Deselect all current visible groups (but keep selections from other pages)
      setSelectedGroupIds((prev) => {
        const newSet = new Set(prev);
        currentPageIds.forEach((id) => newSet.delete(id));
        return newSet;
      });
    } else {
      // Select all visible groups
      setSelectedGroupIds((prev) => {
        const newSet = new Set(prev);
        currentPageIds.forEach((id) => newSet.add(id));
        return newSet;
      });
    }
  };

  // Check if all visible groups are selected
  const allGroupsSelected = groups.length > 0 && groups.every((g) => selectedGroupIds.has(g.id));
  // Check if some (but not all) are selected (indeterminate state)
  const someGroupsSelected = groups.some((g) => selectedGroupIds.has(g.id)) && !allGroupsSelected;

  // Handle bulk delete click for groups
  const handleBulkDeleteGroupsClick = () => {
    if (selectedGroupIds.size === 0) return;
    setBulkDeleteError(null);
    setBulkDeleteSuccess(false);
    setIsBulkDeleteDialogOpen(true);
  };

  // Handle bulk delete confirmation for groups
  const handleBulkDeleteGroupsConfirm = async () => {
    if (selectedGroupIds.size === 0) return;

    setBulkDeleteError(null);
    setBulkDeleteSuccess(false);

    const idsArray = Array.from(selectedGroupIds);
    const count = idsArray.length;
    let successCount = 0;
    let lastError: string | null = null;

    try {
      // Delete groups one by one
      for (const id of idsArray) {
        try {
          await deleteGroup.mutateAsync(id);
          successCount++;
        } catch (err: any) {
          const message = err?.message || err?.response?.data?.message || 'Failed to delete group.';
          lastError = message;
        }
      }

      if (successCount > 0) {
        setDeletedCount(successCount);
        setBulkDeleteSuccess(true);
        setIsBulkDeleteDialogOpen(false);
        setSelectedGroupIds(new Set());
        
        // Clear success message after a delay
        setTimeout(() => {
          setBulkDeleteSuccess(false);
          setDeletedCount(0);
        }, 3000);
      }

      if (lastError && successCount < count) {
        setBulkDeleteError(`Deleted ${successCount} of ${count} groups. ${lastError}`);
      }
    } catch (err: any) {
      const message = err?.message || err?.response?.data?.message || 'Failed to delete groups. Please try again.';
      setBulkDeleteError(message);
    }
  };

  // Stats
  const activeGroups = groups.filter(g => g.isActive).length;
  const totalStudentsInGroups = groups.reduce((sum, g) => sum + (g._count?.students || 0), 0);
  const averageGroupSize = groups.length > 0 
    ? Math.round(totalStudentsInGroups / groups.length) 
    : 0;

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
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setEditGroupId(group.id)}
            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            aria-label="Edit group"
            title="Edit group"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleActive(group.id)}
            className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            aria-label={group.isActive ? 'Deactivate group' : 'Activate group'}
            title={group.isActive ? 'Deactivate group' : 'Activate group'}
          >
            <Ban className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteClick(group.id)}
            className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="Delete group"
            title="Delete group"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // Centers state and handlers
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

  const { 
    data: centersData, 
    isLoading: isLoadingCenters 
  } = useCenters({ 
    skip: centerPage * pageSize,
    take: pageSize,
    search: centerSearchQuery || undefined,
  });

  const deleteCenter = useDeleteCenter();
  const toggleCenterActive = useToggleCenterActive();

  const centers = centersData?.items || [];
  const totalCenters = centersData?.total || 0;
  const totalCenterPages = centersData?.totalPages || 1;

  const handleCenterSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCenterSearchQuery(e.target.value);
    setCenterPage(0);
    // Clear selection on search change
    setSelectedCenterIds(new Set());
  };

  // Handle individual checkbox toggle for centers
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

  // Handle select all toggle for centers
  const handleSelectAllCenters = () => {
    const currentPageIds = new Set(centers.map((c) => c.id));
    const allCurrentSelected = centers.length > 0 && centers.every((c) => selectedCenterIds.has(c.id));
    
    if (allCurrentSelected) {
      // Deselect all current visible centers (but keep selections from other pages)
      setSelectedCenterIds((prev) => {
        const newSet = new Set(prev);
        currentPageIds.forEach((id) => newSet.delete(id));
        return newSet;
      });
    } else {
      // Select all visible centers
      setSelectedCenterIds((prev) => {
        const newSet = new Set(prev);
        currentPageIds.forEach((id) => newSet.add(id));
        return newSet;
      });
    }
  };

  // Check if all visible centers are selected
  const allCentersSelected = centers.length > 0 && centers.every((c) => selectedCenterIds.has(c.id));
  // Check if some (but not all) are selected (indeterminate state)
  const someCentersSelected = centers.some((c) => selectedCenterIds.has(c.id)) && !allCentersSelected;

  // Handle bulk delete click for centers
  const handleBulkDeleteCentersClick = () => {
    if (selectedCenterIds.size === 0) return;
    setBulkDeleteCentersError(null);
    setBulkDeleteCentersSuccess(false);
    setIsBulkDeleteCentersDialogOpen(true);
  };

  // Handle bulk delete confirmation for centers
  const handleBulkDeleteCentersConfirm = async () => {
    if (selectedCenterIds.size === 0) return;

    setBulkDeleteCentersError(null);
    setBulkDeleteCentersSuccess(false);

    const idsArray = Array.from(selectedCenterIds);
    const count = idsArray.length;
    let successCount = 0;
    let lastError: string | null = null;

    try {
      // Delete centers one by one
      for (const id of idsArray) {
        try {
          await deleteCenter.mutateAsync(id);
          successCount++;
        } catch (err: any) {
          const message = err?.message || err?.response?.data?.message || 'Failed to delete center.';
          lastError = message;
        }
      }

      if (successCount > 0) {
        setDeletedCentersCount(successCount);
        setBulkDeleteCentersSuccess(true);
        setIsBulkDeleteCentersDialogOpen(false);
        setSelectedCenterIds(new Set());
        
        // Clear success message after a delay
        setTimeout(() => {
          setBulkDeleteCentersSuccess(false);
          setDeletedCentersCount(0);
        }, 3000);
      }

      if (lastError && successCount < count) {
        setBulkDeleteCentersError(`Deleted ${successCount} of ${count} centers. ${lastError}`);
      }
    } catch (err: any) {
      const message = err?.message || err?.response?.data?.message || 'Failed to delete centers. Please try again.';
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
    } catch (err: any) {
      const message = err?.message || err?.response?.data?.message || 'Failed to delete center. Please try again.';
      setDeleteCenterError(Array.isArray(message) ? message[0] : message);
    }
  };

  const handleToggleCenterActive = async (id: string) => {
    try {
      await toggleCenterActive.mutateAsync(id);
    } catch (err) {
      console.error('Failed to toggle center status:', err);
    }
  };

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
            onClick={() => setEditCenterId(center.id)}
            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            aria-label="Edit center"
            title="Edit center"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleCenterActive(center.id)}
            className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            aria-label={center.isActive ? 'Deactivate center' : 'Activate center'}
            title={center.isActive ? 'Deactivate center' : 'Activate center'}
          >
            <Ban className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteCenterClick(center.id)}
            className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="Delete center"
            title="Delete center"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // Stats for centers
  const activeCenters = centers.filter(c => c.isActive).length;

  return (
    <DashboardLayout 
      title="Groups & Centers" 
      subtitle="Manage learning groups and center branches."
    >
      <div className="space-y-6">
        {/* Tabs */}
        <div className="border-b border-slate-200">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('centers')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'centers'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              Centers / Branches
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'groups'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              Groups
            </button>
          </nav>
        </div>

        {activeTab === 'centers' && (
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
                  onChange={handleCenterSearchChange}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium"
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
                    // Clear selection on page change
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
                    // Clear selection on page change
                    setSelectedCenterIds(new Set());
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'groups' && (
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
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                setPage(0); // Reset pagination when switching views
                // Clear selection when switching views
                setSelectedGroupIds(new Set());
              }}
              className={cn(
                'px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center gap-2',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow-md'
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
                setPage(0); // Reset pagination when switching views
                // Clear selection when switching views
                setSelectedGroupIds(new Set());
              }}
              className={cn(
                'px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center gap-2',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                viewMode === 'board'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-700 hover:bg-slate-100'
              )}
              aria-pressed={viewMode === 'board'}
            >
              <LayoutGrid className="w-4 h-4" />
              Board
            </button>
          </div>

          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium"
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
                    // Clear selection on page change
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
                    // Clear selection on page change
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
                    // When searching, only show centers with matching groups
                    if (searchQuery) {
                      const centerGroups = groupsByCenter[center.id] || [];
                      return centerGroups.length > 0;
                    }
                    return true; // Show all centers when not searching
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
                                onEdit={() => setEditGroupId(group.id)}
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
              <div className="p-3 bg-blue-50 rounded-xl">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 mb-2">Bulk Student Assignment</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Quickly assign multiple students to groups using our batch assignment tool.
                </p>
                <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
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
                <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                  Manage Schedules
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
          </div>
        )}

        {/* Modals */}
        <CreateGroupForm 
          open={createGroupOpen} 
          onOpenChange={setCreateGroupOpen} 
        />
        {editGroupId && (
          <EditGroupForm 
            open={!!editGroupId} 
            onOpenChange={(open) => !open && setEditGroupId(null)} 
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
        <CreateCenterForm 
          open={createCenterOpen} 
          onOpenChange={setCreateCenterOpen} 
        />
        {editCenterId && (
          <EditCenterForm 
            open={!!editCenterId} 
            onOpenChange={(open) => !open && setEditCenterId(null)} 
            centerId={editCenterId}
          />
        )}
        <DeleteConfirmationDialog
          open={!!deleteCenterId}
          onOpenChange={(open) => !open && setDeleteCenterId(null)}
          onConfirm={handleDeleteCenterConfirm}
          itemName={centers.find(c => c.id === deleteCenterId)?.name}
          isLoading={deleteCenter.isPending}
          error={deleteCenterError || undefined}
          itemType="center"
        />
        <DeleteConfirmationDialog
          open={isBulkDeleteCentersDialogOpen}
          onOpenChange={(open) => {
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
        {bulkDeleteSuccess && (
          <div className="fixed bottom-4 right-4 p-4 bg-green-50 border border-green-200 rounded-lg shadow-lg z-50">
            <p className="text-sm text-green-600 font-medium">
              {deletedCount > 0 
                ? `${deletedCount} ${deletedCount === 1 ? 'group' : 'groups'} deleted successfully!`
                : 'Groups deleted successfully!'}
            </p>
          </div>
        )}
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
    </DashboardLayout>
  );
}
