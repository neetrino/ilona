'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { StatCard, DataTable, Badge, Button } from '@/shared/components/ui';

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
  type Teacher 
} from '@/features/teachers';

export default function TeachersPage() {
  const [searchQuery, setSearchQuery] = useState('');
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
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const t = useTranslations('teachers');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');
  const pageSize = 10;

  // Fetch teachers with search, pagination, and sorting
  const { 
    data: teachersData, 
    isLoading,
    error 
  } = useTeachers({ 
    skip: page * pageSize,
    take: pageSize,
    search: searchQuery || undefined,
    sortBy: sortBy,
    sortOrder: sortOrder,
  });

  // Delete mutation
  const deleteTeacher = useDeleteTeacher();
  
  // Bulk delete mutation
  const deleteTeachers = useDeleteTeachers();
  
  // Update mutation (for deactivate)
  const updateTeacher = useUpdateTeacher();

  const teachers = teachersData?.items || [];
  const totalTeachers = teachersData?.total || 0;
  const totalPages = teachersData?.totalPages || 1;

  // Handle search with debounce effect
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(0); // Reset to first page on search
    // Clear selection on search/filter change
    setSelectedTeacherIds(new Set());
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
    if (selectedTeacherIds.size === teachers.length) {
      // Deselect all
      setSelectedTeacherIds(new Set());
    } else {
      // Select all visible teachers
      setSelectedTeacherIds(new Set(teachers.map((t) => t.id)));
    }
  };

  // Check if all visible teachers are selected
  const allSelected = teachers.length > 0 && selectedTeacherIds.size === teachers.length;
  // Check if some (but not all) are selected (indeterminate state)
  const someSelected = selectedTeacherIds.size > 0 && selectedTeacherIds.size < teachers.length;

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
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to delete teacher. Please try again.';
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
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to delete teachers. Please try again.';
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
        data: { status: newStatus as 'ACTIVE' | 'INACTIVE' },
      });
      setDeactivateSuccess(true);
      
      // Clear success message after a delay
      setTimeout(() => {
        setDeactivateSuccess(false);
      }, 3000);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || `Failed to ${isCurrentlyActive ? 'deactivate' : 'activate'} teacher. Please try again.`;
      setDeactivateError(message);
    }
  };

  // Row clicks are disabled - only Edit button opens edit form

  // Stats calculation
  const activeTeachers = teachers.filter(t => t.user?.status === 'ACTIVE').length;
  const totalLessons = teachers.reduce((sum, t) => sum + (t._count?.lessons || 0), 0);

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
    },
    {
      key: 'teacher',
      header: t('title'),
      sortable: true,
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
      key: 'students',
      header: t('students'),
      sortable: true,
      className: 'text-right',
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
      className: 'text-right',
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
      key: 'actions',
      header: t('actions'),
      render: (teacher: Teacher) => {
        const isActive = teacher.user?.status === 'ACTIVE';
        const isDeactivating = updateTeacher.isPending;
        
        return (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {/* Edit Button */}
            <button
              type="button"
              aria-label={tCommon('edit')}
              title={tCommon('edit')}
              onClick={(e) => {
                e.stopPropagation();
                handleEditClick(teacher);
              }}
              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isDeactivating}
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                />
              </svg>
            </button>
            
            {/* Delete Button */}
            <button
              type="button"
              aria-label={tCommon('delete')}
              title={tCommon('delete')}
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(teacher);
              }}
              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isDeactivating || deleteTeacher.isPending}
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                />
              </svg>
            </button>
            
            {/* Deactivate/Activate Button */}
            <button
              type="button"
              aria-label={isActive ? t('deactivate') : t('activate')}
              title={isActive ? t('deactivate') : t('activate')}
              onClick={(e) => {
                e.stopPropagation();
                handleDeactivateClick(teacher);
              }}
              className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isActive 
                  ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50' 
                  : 'text-green-600 hover:text-green-700 hover:bg-green-50'
              }`}
              disabled={isDeactivating || deleteTeacher.isPending}
            >
              {isDeactivating ? (
                <svg 
                  className="w-5 h-5 animate-spin" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                  />
                </svg>
              ) : (
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  {isActive ? (
                    // Ban/Block icon for deactivate
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" 
                    />
                  ) : (
                    // Check circle icon for activate
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  )}
                </svg>
              )}
            </button>
          </div>
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
            value={teachers.length > 0 ? Math.round(totalLessons / teachers.length) : 0}
          />
        </div>

        {/* Search & Actions Bar */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
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
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          {selectedTeacherIds.size > 0 && (
            <Button
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium"
              onClick={handleBulkDeleteClick}
              disabled={deleteTeachers.isPending || deleteTeacher.isPending}
            >
              {tCommon('delete')} ({selectedTeacherIds.size})
            </Button>
          )}
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium"
            onClick={() => setIsAddTeacherOpen(true)}
            disabled={deleteTeachers.isPending || deleteTeacher.isPending}
          >
            + {t('addTeacher')}
          </Button>
          <button 
            className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={deleteTeachers.isPending || deleteTeacher.isPending}
          >
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
        </div>

        {/* Teachers Table */}
        <DataTable
          columns={teacherColumns}
          data={teachers}
          keyExtractor={(teacher) => teacher.id}
          isLoading={isLoading}
          emptyMessage={searchQuery ? t('noTeachersMatch') : t('noTeachersFound')}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
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
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
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
              <div className="p-3 bg-blue-50 rounded-xl">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 mb-2">{t('staffWorkload')}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {teachers.length > 0 
                    ? t('workloadDescription', { avg: Math.round(totalLessons / teachers.length) })
                    : t('workloadNoTeachers')}
                </p>
                <button 
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
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
    </DashboardLayout>
  );
}
