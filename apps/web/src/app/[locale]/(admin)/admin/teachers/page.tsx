'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { getErrorMessage } from '@/shared/lib/api';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { StatCard, DataTable, Badge, Button, ActionButtons } from '@/shared/components/ui';

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
  useTeachers, 
  useDeleteTeacher,
  useDeleteTeachers,
  useUpdateTeacher,
  AddTeacherForm, 
  EditTeacherForm,
  DeleteConfirmationDialog,
  TeacherDetailsDrawer,
  type Teacher 
} from '@/features/teachers';
import { useCenters } from '@/features/centers';
import { FilterDropdown } from '@/shared/components/ui/filter-dropdown';

export default function TeachersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [isEditTeacherOpen, setIsEditTeacherOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<Set<string>>(new Set());
  const [deletedCount, setDeletedCount] = useState<number>(0);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);
  const [bulkDeleteSuccess, setBulkDeleteSuccess] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const [deactivateSuccess, setDeactivateSuccess] = useState(false);
  // Filter states
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedBranchIds, setSelectedBranchIds] = useState<Set<string>>(new Set());
  const [selectedStatus, setSelectedStatus] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | ''>(() => {
    const statusFromUrl = searchParams.get('status');
    return (statusFromUrl === 'ACTIVE' || statusFromUrl === 'INACTIVE' || statusFromUrl === 'SUSPENDED') ? statusFromUrl : '';
  });
  const locale = params.locale as string;
  const t = useTranslations('teachers');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');
  const pageSize = 10;

  // Initialize drawer state from URL params
  const teacherIdFromUrl = searchParams.get('teacherId');
  const [selectedTeacherIdForDetails, setSelectedTeacherIdForDetails] = useState<string | null>(teacherIdFromUrl);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(!!teacherIdFromUrl);

  // Debounce search query (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(0); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch teachers (for client-side filtering)
  // Note: Backend limits take to max 100, so filtering works on first 100 teachers
  // For better scalability, server-side filtering should be implemented
  const { 
    data: teachersData, 
    isLoading,
    error 
  } = useTeachers({ 
    skip: 0,
    take: 100, // Max allowed by backend
    search: debouncedSearchQuery || undefined,
    status: selectedStatus || undefined,
    sortBy: sortBy,
    sortOrder: sortOrder,
  });

  // Fetch centers for branch filter
  const { 
    data: centersData, 
    isLoading: isLoadingCenters,
    error: centersError 
  } = useCenters();

  // Delete mutation
  const deleteTeacher = useDeleteTeacher();
  
  // Bulk delete mutation
  const deleteTeachers = useDeleteTeachers();
  
  // Update mutation (for deactivate)
  const updateTeacher = useUpdateTeacher();

  // Get all teachers from API
  const allTeachers = teachersData?.items || [];
  
  // Apply filters client-side with memoization for performance
  const filteredTeachers = useMemo(() => {
    if (selectedBranchIds.size === 0) {
      return allTeachers; // No filtering needed
    }

    return allTeachers.filter((teacher) => {
      // Branch filter
      const teacherCenters = teacher.centers || 
        Array.from(
          new Map(
            (teacher.groups || [])
              .filter((group) => group.center)
              .map((group) => [group.center!.id, group.center!])
          ).values()
        );
      const teacherCenterIds = new Set(teacherCenters.map(c => c.id));
      const hasMatchingBranch = Array.from(selectedBranchIds).some(branchId => 
        teacherCenterIds.has(branchId)
      );
      return hasMatchingBranch;
    });
  }, [allTeachers, selectedBranchIds]);

  // Apply pagination to filtered results with memoization
  const { teachers, totalTeachers, totalPages } = useMemo(() => {
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedTeachers = filteredTeachers.slice(startIndex, endIndex);
    const total = filteredTeachers.length;
    const totalPagesCount = Math.ceil(total / pageSize);
    
    return {
      teachers: paginatedTeachers,
      totalTeachers: total,
      totalPages: totalPagesCount,
    };
  }, [filteredTeachers, page, pageSize]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Clear selection on search/filter change
    setSelectedTeacherIds(new Set());
  };

  // Handle filter changes
  const handleBranchFilterChange = (selectedIds: Set<string>) => {
    setSelectedBranchIds(selectedIds);
    setPage(0); // Reset to first page on filter change
    setSelectedTeacherIds(new Set());
  };

  // Handle status filter change
  const handleStatusChange = (status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | '') => {
    setSelectedStatus(status);
    setPage(0);
    setSelectedTeacherIds(new Set());
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    if (status) {
      params.set('status', status);
    } else {
      params.delete('status');
    }
    router.push(`/${locale}/admin/teachers?${params.toString()}`);
  };

  // Handle sorting
  const handleSort = (key: string) => {
    if (sortBy === key) {
      // Toggle sort order if same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort column with ascending order
      setSortBy(key);
      setSortOrder('asc');
    }
    setPage(0); // Reset to first page on sort
    // Clear selection on sort change
    setSelectedTeacherIds(new Set());
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // Clear selection on page change (selection is per-page)
    setSelectedTeacherIds(new Set());
  };

  // Handle individual checkbox toggle
  const handleToggleSelect = (teacherId: string) => {
    setSelectedTeacherIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(teacherId)) {
        newSet.delete(teacherId);
      } else {
        newSet.add(teacherId);
      }
      return newSet;
    });
  };

  // Handle select all toggle
  const handleSelectAll = () => {
    const currentPageIds = new Set(teachers.map((t) => t.id));
    const allCurrentSelected = teachers.length > 0 && teachers.every((t) => selectedTeacherIds.has(t.id));
    
    if (allCurrentSelected) {
      // Deselect all current visible teachers (but keep selections from other pages)
      setSelectedTeacherIds((prev) => {
        const newSet = new Set(prev);
        currentPageIds.forEach((id) => newSet.delete(id));
        return newSet;
      });
    } else {
      // Select all visible teachers
      setSelectedTeacherIds((prev) => {
        const newSet = new Set(prev);
        currentPageIds.forEach((id) => newSet.add(id));
        return newSet;
      });
    }
  };

  // Check if all visible teachers are selected
  const allSelected = teachers.length > 0 && teachers.every((t) => selectedTeacherIds.has(t.id));
  // Check if some (but not all) are selected (indeterminate state)
  const someSelected = teachers.some((t) => selectedTeacherIds.has(t.id)) && !allSelected;

  // Handle edit button click
  const handleEditClick = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsEditTeacherOpen(true);
  };

  // Handle delete button click
  const handleDeleteClick = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setDeleteError(null);
    setDeleteSuccess(false);
    setIsDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedTeacher) return;

    setDeleteError(null);
    setDeleteSuccess(false);

    try {
      await deleteTeacher.mutateAsync(selectedTeacher.id);
      setDeleteSuccess(true);
      setIsDeleteDialogOpen(false);
      setSelectedTeacher(null);
      
      // Clear success message after a delay
      setTimeout(() => {
        setDeleteSuccess(false);
      }, 3000);
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Failed to delete teacher. Please try again.');
      setDeleteError(message);
    }
  };

  // Handle bulk delete click
  const handleBulkDeleteClick = () => {
    if (selectedTeacherIds.size === 0) return;
    setBulkDeleteError(null);
    setBulkDeleteSuccess(false);
    setIsBulkDeleteDialogOpen(true);
  };

  // Handle bulk delete confirmation
  const handleBulkDeleteConfirm = async () => {
    if (selectedTeacherIds.size === 0) return;

    setBulkDeleteError(null);
    setBulkDeleteSuccess(false);

    const count = selectedTeacherIds.size;
    try {
      const idsArray = Array.from(selectedTeacherIds);
      await deleteTeachers.mutateAsync(idsArray);
      setDeletedCount(count);
      setBulkDeleteSuccess(true);
      setIsBulkDeleteDialogOpen(false);
      setSelectedTeacherIds(new Set());
      
      // Clear success message after a delay
      setTimeout(() => {
        setBulkDeleteSuccess(false);
        setDeletedCount(0);
      }, 3000);
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Failed to delete teachers. Please try again.');
      setBulkDeleteError(message);
    }
  };

  // Handle deactivate/activate toggle
  const handleDeactivateClick = async (teacher: Teacher) => {
    const isCurrentlyActive = teacher.user?.status === 'ACTIVE';
    const newStatus = isCurrentlyActive ? 'INACTIVE' : 'ACTIVE';
    
    setDeactivateError(null);
    setDeactivateSuccess(false);

    try {
      await updateTeacher.mutateAsync({
        id: teacher.id,
        data: { status: newStatus },
      });
      setDeactivateSuccess(true);
      
      // Clear success message after a delay
      setTimeout(() => {
        setDeactivateSuccess(false);
      }, 3000);
    } catch (err: unknown) {
      const message = getErrorMessage(err, `Failed to ${isCurrentlyActive ? 'deactivate' : 'activate'} teacher. Please try again.`);
      setDeactivateError(message);
    }
  };

  // Sync state with URL params when URL changes (e.g., browser back/forward, refresh)
  useEffect(() => {
    const teacherIdFromUrl = searchParams.get('teacherId');
    if (teacherIdFromUrl !== selectedTeacherIdForDetails) {
      setSelectedTeacherIdForDetails(teacherIdFromUrl);
      setIsDetailsDrawerOpen(!!teacherIdFromUrl);
    }
  }, [searchParams]);

  // Handle row click to open details drawer
  const handleRowClick = (teacher: Teacher) => {
    // Update URL with teacherId
    const params = new URLSearchParams(searchParams.toString());
    params.set('teacherId', teacher.id);
    router.push(`/${locale}/admin/teachers?${params.toString()}`, { scroll: false });
    setSelectedTeacherIdForDetails(teacher.id);
    setIsDetailsDrawerOpen(true);
  };

  // Handle details drawer close
  const handleDetailsDrawerClose = () => {
    // Remove teacherId from URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete('teacherId');
    const newUrl = params.toString() ? `/${locale}/admin/teachers?${params.toString()}` : `/${locale}/admin/teachers`;
    router.push(newUrl, { scroll: false });
    setIsDetailsDrawerOpen(false);
    setSelectedTeacherIdForDetails(null);
  };

  // Stats calculation - use filtered teachers for accurate stats
  const activeTeachers = filteredTeachers.filter(t => t.user?.status === 'ACTIVE').length;
  const totalLessons = filteredTeachers.reduce((sum, t) => sum + (t._count?.lessons || 0), 0);

  // Error state
  if (error) {
    console.error('Teachers fetch error:', error);
  }

  const teacherColumns = [
    {
      key: 'checkbox',
      header: (
        <SelectAllCheckbox
          checked={allSelected}
          indeterminate={someSelected}
          onChange={handleSelectAll}
          disabled={deleteTeachers.isPending || deleteTeacher.isPending || isLoading}
        />
      ),
      render: (teacher: Teacher) => (
        <input
          type="checkbox"
          className="w-4 h-4 rounded border-slate-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          checked={selectedTeacherIds.has(teacher.id)}
          onChange={() => handleToggleSelect(teacher.id)}
          onClick={(e) => e.stopPropagation()}
          disabled={deleteTeachers.isPending || deleteTeacher.isPending || isLoading}
          aria-label={`Select ${teacher.user?.firstName} ${teacher.user?.lastName}`}
        />
      ),
      className: '!pl-4 !pr-2 w-12',
    },
    {
      key: 'teacher',
      header: t('title'),
      sortable: true,
      className: '!pl-0 !pr-4',
      render: (teacher: Teacher) => {
        const firstName = teacher.user?.firstName || '';
        const lastName = teacher.user?.lastName || '';
        const phone = teacher.user?.phone || t('noPhoneNumber');
        const initials = `${firstName[0] || ''}${lastName[0] || ''}` || '?';
        const isActive = teacher.user?.status === 'ACTIVE';
        return (
          <div className={cn("flex items-center gap-3", !isActive && "opacity-60")} onClick={(e) => e.stopPropagation()}>
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-slate-600 font-semibold", isActive ? "bg-slate-200" : "bg-slate-100")}>
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className={cn("font-semibold", isActive ? "text-slate-800" : "text-slate-500")}>
                  {firstName} {lastName}
                </p>
                {!isActive && (
                  <span className="text-xs text-slate-400 font-normal">({tStatus('inactive')})</span>
                )}
              </div>
              <p className={cn("text-sm", isActive ? "text-slate-500" : "text-slate-400")}>{phone}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'groups',
      header: t('assignedGroups'),
      render: (teacher: Teacher) => {
        const groups = teacher.groups || [];
        return (
          <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
            {groups.slice(0, 2).map((group) => (
              <Badge key={group.id} variant="info">
                {group.name}
              </Badge>
            ))}
            {groups.length > 2 && (
              <Badge variant="default">+{groups.length - 2}</Badge>
            )}
            {groups.length === 0 && (
              <span className="text-slate-400 text-sm">{t('noGroups')}</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'center',
      header: t('center'),
      render: (teacher: Teacher) => {
        // Use centers field if available (from backend), otherwise extract from groups
        const centers = teacher.centers || 
          Array.from(
            new Map(
              (teacher.groups || [])
                .filter((group) => group.center)
                .map((group) => [group.center!.id, group.center!])
            ).values()
          );
        
        return (
          <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
            {centers.length > 0 ? (
              <>
                {centers.slice(0, 2).map((center) => (
                  <Badge key={center.id} variant="default">
                    {center.name}
                  </Badge>
                ))}
                {centers.length > 2 && (
                  <div title={centers.slice(2).map(c => c.name).join(', ')}>
                    <Badge variant="default">
                      +{centers.length - 2}
                    </Badge>
                  </div>
                )}
              </>
            ) : (
              <span className="text-slate-400 text-sm">{t('noBranches')}</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'students',
      header: t('students'),
      sortable: true,
      className: 'text-left',
      render: (teacher: Teacher) => {
        const studentCount = teacher._count?.students || 0;
        return (
          <span className="text-slate-700 font-medium" onClick={(e) => e.stopPropagation()}>
            {studentCount}
          </span>
        );
      },
    },
    {
      key: 'hourlyRate',
      header: t('rate'),
      className: 'text-left',
      render: (teacher: Teacher) => {
        const rate = typeof teacher.hourlyRate === 'string' ? parseFloat(teacher.hourlyRate) : Number(teacher.hourlyRate || 0);
        return (
          <span className="text-slate-700 font-medium" onClick={(e) => e.stopPropagation()}>
            {new Intl.NumberFormat('hy-AM', {
              style: 'currency',
              currency: 'AMD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(rate)}/hr
          </span>
        );
      },
    },
    {
      key: 'obligation',
      header: t('obligation') || 'Obligation',
      sortable: true,
      className: 'text-center',
      render: (teacher: Teacher) => {
        const doneCount = teacher.obligationsDoneCount ?? 0;
        const total = teacher.obligationsTotal ?? 4;
        return (
          <span className="text-slate-700 font-medium" onClick={(e) => e.stopPropagation()}>
            {doneCount}/{total}
          </span>
        );
      },
    },
    {
      key: 'deduction',
      header: t('deduction') || 'Deduction',
      sortable: true,
      className: 'text-right',
      render: (teacher: Teacher) => {
        const deduction = teacher.deductionAmount ?? 0;
        if (deduction === 0) {
          return (
            <span className="text-slate-500" onClick={(e) => e.stopPropagation()}>
              —
            </span>
          );
        }
        return (
          <span className="text-red-600 font-medium" onClick={(e) => e.stopPropagation()}>
            {new Intl.NumberFormat('hy-AM', {
              style: 'currency',
              currency: 'AMD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(-deduction)}
          </span>
        );
      },
    },
    {
      key: 'cost',
      header: t('cost') || 'Cost',
      sortable: true,
      className: 'text-right',
      render: (teacher: Teacher) => {
        const finalCost = teacher.finalCost ?? 0;
        return (
          <span className="text-slate-700 font-medium" onClick={(e) => e.stopPropagation()}>
            {new Intl.NumberFormat('hy-AM', {
              style: 'currency',
              currency: 'AMD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(finalCost)}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: t('actions'),
      className: '!w-[140px] !min-w-[140px] !max-w-[140px] !px-3 !py-4 text-left',
      render: (teacher: Teacher) => {
        const isActive = teacher.user?.status === 'ACTIVE';
        const isDeactivating = updateTeacher.isPending;
        
        return (
          <ActionButtons
            onEdit={() => handleEditClick(teacher)}
            onDisable={() => handleDeactivateClick(teacher)}
            onDelete={() => handleDeleteClick(teacher)}
            isActive={isActive}
            disabled={isDeactivating || deleteTeacher.isPending}
            ariaLabels={{
              edit: tCommon('edit'),
              disable: isActive ? t('deactivate') : t('activate'),
              delete: tCommon('delete'),
            }}
            titles={{
              edit: tCommon('edit'),
              disable: isActive ? t('deactivate') : t('activate'),
              delete: tCommon('delete'),
            }}
          />
        );
      },
    },
  ];

  return (
    <DashboardLayout 
      title={t('title')} 
      subtitle={t('subtitle')}
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title={t('totalTeachers')}
            value={totalTeachers}
            change={{ value: '+4.5%', type: 'positive' }}
          />
          <StatCard
            title={t('activeTeachers')}
            value={activeTeachers || totalTeachers}
            change={{ value: '+2.1%', type: 'positive' }}
          />
          <StatCard
            title={t('totalLessons')}
            value={totalLessons}
          />
          <StatCard
            title={t('avgLessonsPerTeacher')}
            value={filteredTeachers.length > 0 ? Math.round(totalLessons / filteredTeachers.length) : 0}
          />
        </div>

        {/* Search, Filter & Actions Bar */}
        <div className="flex items-end gap-4">
          {/* Search by Keywords */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-500 mb-1.5">
              Search by Keywords
            </label>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="search"
                placeholder="Search teachers by name, email or group..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex-shrink-0">
            <label className="block text-sm font-medium text-slate-500 mb-1.5">
              Status
            </label>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => handleStatusChange(e.target.value as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | '')}
                className="pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer min-w-[160px]"
              >
                <option value="">All statuses</option>
                <option value="ACTIVE">{tStatus('active')}</option>
                <option value="INACTIVE">{tStatus('inactive')}</option>
                <option value="SUSPENDED">{tStatus('suspended')}</option>
              </select>
              <svg 
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Center Filter */}
          <div className="flex-shrink-0">
            <FilterDropdown
              label={t('center')}
              options={(centersData?.items || []).map(center => ({
                id: center.id,
                label: center.name,
              }))}
              selectedIds={selectedBranchIds}
              onSelectionChange={handleBranchFilterChange}
              placeholder={tCommon('all')}
              isLoading={isLoadingCenters}
              error={centersError ? 'Failed to load centers' : null}
              className="w-[200px]"
            />
          </div>

          {/* Add Teacher Button */}
          <div className="flex-shrink-0">
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium flex items-center gap-2"
              onClick={() => setIsAddTeacherOpen(true)}
              disabled={deleteTeachers.isPending || deleteTeacher.isPending}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {t('addTeacher')}
            </Button>
          </div>
        </div>

        {/* Bulk Delete Button (shown when teachers are selected) */}
        {selectedTeacherIds.size > 0 && (
          <div className="flex justify-end">
            <Button
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium"
              onClick={handleBulkDeleteClick}
              disabled={deleteTeachers.isPending || deleteTeacher.isPending}
            >
              Delete All ({selectedTeacherIds.size})
            </Button>
          </div>
        )}

        {/* Teachers Table */}
        <DataTable
          columns={teacherColumns}
          data={teachers}
          keyExtractor={(teacher) => teacher.id}
          isLoading={isLoading}
          emptyMessage={debouncedSearchQuery ? t('noTeachersMatch') : t('noTeachersFound')}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onRowClick={handleRowClick}
        />

        {/* Pagination */}
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            {t('showing', {
              start: page * pageSize + 1,
              end: Math.min((page + 1) * pageSize, totalTeachers),
              total: totalTeachers
            })}
          </span>
          <div className="flex items-center gap-2">
            <button 
              className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50" 
              disabled={page === 0 || deleteTeachers.isPending || deleteTeacher.isPending}
              onClick={() => handlePageChange(Math.max(0, page - 1))}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span>{t('page', { current: page + 1, total: totalPages })}</span>
            <button 
              className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50"
              disabled={page >= totalPages - 1 || deleteTeachers.isPending || deleteTeacher.isPending}
              onClick={() => handlePageChange(page + 1)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-50 rounded-xl">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 mb-2">{t('salaryCalculation')}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {t('salaryDescription')}
                </p>
                <button 
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/90"
                  onClick={() => router.push(`/${locale}/admin/finance`)}
                >
                  {t('viewSalaries')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 mb-2">{t('staffWorkload')}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {filteredTeachers.length > 0 
                    ? t('workloadDescription', { avg: Math.round(totalLessons / filteredTeachers.length) })
                    : t('workloadNoTeachers')}
                </p>
                <button 
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/90"
                  onClick={() => router.push(`/${locale}/admin/analytics`)}
                >
                  {t('viewAnalytics')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {deleteSuccess && (
        <div className="fixed bottom-4 right-4 p-4 bg-green-50 border border-green-200 rounded-lg shadow-lg z-50">
          <p className="text-sm text-green-600 font-medium">Teacher deleted successfully!</p>
        </div>
      )}
      {deleteError && (
        <div className="fixed bottom-4 right-4 p-4 bg-red-50 border border-red-200 rounded-lg shadow-lg z-50">
          <p className="text-sm text-red-600 font-medium">{deleteError}</p>
        </div>
      )}
      {bulkDeleteSuccess && (
        <div className="fixed bottom-4 right-4 p-4 bg-green-50 border border-green-200 rounded-lg shadow-lg z-50">
          <p className="text-sm text-green-600 font-medium">
            {deletedCount > 0 
              ? `${deletedCount} ${deletedCount === 1 ? 'teacher' : 'teachers'} deleted successfully!`
              : 'Teachers deleted successfully!'}
          </p>
        </div>
      )}
      {bulkDeleteError && (
        <div className="fixed bottom-4 right-4 p-4 bg-red-50 border border-red-200 rounded-lg shadow-lg z-50">
          <p className="text-sm text-red-600 font-medium">{bulkDeleteError}</p>
        </div>
      )}
      {deactivateSuccess && (
        <div className="fixed bottom-4 right-4 p-4 bg-green-50 border border-green-200 rounded-lg shadow-lg z-50">
          <p className="text-sm text-green-600 font-medium">Teacher status updated successfully!</p>
        </div>
      )}
      {deactivateError && (
        <div className="fixed bottom-4 right-4 p-4 bg-red-50 border border-red-200 rounded-lg shadow-lg z-50">
          <p className="text-sm text-red-600 font-medium">{deactivateError}</p>
        </div>
      )}

      {/* Add Teacher Modal */}
      <AddTeacherForm 
        open={isAddTeacherOpen} 
        onOpenChange={setIsAddTeacherOpen} 
      />

      {/* Edit Teacher Modal */}
      {selectedTeacher && (
        <EditTeacherForm 
          open={isEditTeacherOpen} 
          onOpenChange={(open) => {
            setIsEditTeacherOpen(open);
            if (!open) {
              setSelectedTeacher(null);
            }
          }}
          teacherId={selectedTeacher.id}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setSelectedTeacher(null);
            setDeleteError(null);
            setDeleteSuccess(false);
          }
        }}
        onConfirm={handleDeleteConfirm}
        teacherName={selectedTeacher ? `${selectedTeacher.user.firstName} ${selectedTeacher.user.lastName}` : undefined}
        isLoading={deleteTeacher.isPending}
        error={deleteError}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isBulkDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsBulkDeleteDialogOpen(open);
          if (!open) {
            setBulkDeleteError(null);
            setBulkDeleteSuccess(false);
          }
        }}
        onConfirm={handleBulkDeleteConfirm}
        teacherName={selectedTeacherIds.size > 0 ? `${selectedTeacherIds.size} ${selectedTeacherIds.size === 1 ? 'teacher' : 'teachers'}` : undefined}
        isLoading={deleteTeachers.isPending}
        error={bulkDeleteError}
        title="Delete Teachers"
      />

      {/* Teacher Details Drawer */}
      <TeacherDetailsDrawer
        teacherId={selectedTeacherIdForDetails}
        open={isDetailsDrawerOpen}
        onClose={handleDetailsDrawerClose}
      />
    </DashboardLayout>
  );
}
