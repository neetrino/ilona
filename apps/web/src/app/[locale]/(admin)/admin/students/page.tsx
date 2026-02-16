'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { StatCard, DataTable, Badge, Button, FilterDropdown, ActionButtons } from '@/shared/components/ui';
import { 
  useStudents, 
  useDeleteStudent, 
  useUpdateStudent,
  AddStudentForm,
  EditStudentForm,
  DeleteConfirmationDialog, 
  InlineSelect,
  type Student 
} from '@/features/students';
import { useTeachers } from '@/features/teachers';
import { useGroups } from '@/features/groups';
import { useCenters } from '@/features/centers';
import { formatCurrency } from '@/shared/lib/utils';
import { getErrorMessage } from '@/shared/lib/api';

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

export default function StudentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const [deactivateSuccess, setDeactivateSuccess] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);
  const [bulkDeleteSuccess, setBulkDeleteSuccess] = useState(false);
  const [deletedCount, setDeletedCount] = useState<number>(0);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<Set<string>>(new Set());
  const [selectedCenterIds, setSelectedCenterIds] = useState<Set<string>>(new Set());
  const [selectedStatusIds, setSelectedStatusIds] = useState<Set<string>>(new Set());
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  // Month/year filter for attendance - default to current month
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const t = useTranslations('students');
  const tCommon = useTranslations('common');
  const tTeachers = useTranslations('teachers');
  const tStatus = useTranslations('status');
  const pageSize = 10;

  // Fetch teachers, groups, and centers for filters and dropdowns
  // Reduced take limits for better performance - filters don't need 100 items
  const { data: teachersData } = useTeachers({ take: 50, status: 'ACTIVE' });
  const { data: groupsData } = useGroups({ take: 50, isActive: true });
  const { data: centersData } = useCenters({ isActive: true });

  // Convert filters to arrays for API
  const teacherIdsArray = useMemo(() => 
    selectedTeacherIds.size > 0 ? Array.from(selectedTeacherIds) : undefined,
    [selectedTeacherIds]
  );
  const centerIdsArray = useMemo(() => 
    selectedCenterIds.size > 0 ? Array.from(selectedCenterIds) : undefined,
    [selectedCenterIds]
  );
  const statusIdsArray = useMemo(() => 
    selectedStatusIds.size > 0 ? Array.from(selectedStatusIds) as ('ACTIVE' | 'INACTIVE' | 'SUSPENDED')[] : undefined,
    [selectedStatusIds]
  );

  // Fetch students with search, pagination, and filters
  const { 
    data: studentsData, 
    isLoading,
    error 
  } = useStudents({ 
    skip: page * pageSize,
    take: pageSize,
    search: searchQuery || undefined,
    teacherIds: teacherIdsArray,
    centerIds: centerIdsArray,
    statusIds: statusIdsArray,
    sortBy: sortBy,
    sortOrder: sortOrder,
    month: selectedMonth,
    year: selectedYear,
  });

  // Mutations
  const deleteStudent = useDeleteStudent();
  const updateStudent = useUpdateStudent();

  const students = studentsData?.items || [];
  const totalStudents = studentsData?.total || 0;
  const totalPages = studentsData?.totalPages || 1;

  // Handle sorting
  const handleSort = (key: string) => {
    if (sortBy === key) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort column and default to ascending
      setSortBy(key);
      setSortOrder('asc');
    }
    setPage(0); // Reset to first page on sort change
    // Clear selection on sort change
    setSelectedStudentIds(new Set());
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // Clear selection on page change (selection is per-page)
    setSelectedStudentIds(new Set());
  };

  // Handle individual checkbox toggle
  const handleToggleSelect = (studentId: string) => {
    setSelectedStudentIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  // Handle select all toggle
  const handleSelectAll = () => {
    const currentPageIds = new Set(students.map((s) => s.id));
    const allCurrentSelected = students.length > 0 && students.every((s) => selectedStudentIds.has(s.id));
    
    if (allCurrentSelected) {
      // Deselect all current visible students (but keep selections from other pages)
      setSelectedStudentIds((prev) => {
        const newSet = new Set(prev);
        currentPageIds.forEach((id) => newSet.delete(id));
        return newSet;
      });
    } else {
      // Select all visible students
      setSelectedStudentIds((prev) => {
        const newSet = new Set(prev);
        currentPageIds.forEach((id) => newSet.add(id));
        return newSet;
      });
    }
  };

  // Check if all visible students are selected
  const allSelected = students.length > 0 && students.every((s) => selectedStudentIds.has(s.id));
  // Check if some (but not all) are selected (indeterminate state)
  const someSelected = students.some((s) => selectedStudentIds.has(s.id)) && !allSelected;

  // Handle bulk delete click
  const handleBulkDeleteClick = () => {
    if (selectedStudentIds.size === 0) return;
    setBulkDeleteError(null);
    setBulkDeleteSuccess(false);
    setIsBulkDeleteDialogOpen(true);
  };

  // Handle bulk delete confirmation
  const handleBulkDeleteConfirm = async () => {
    if (selectedStudentIds.size === 0) return;

    setBulkDeleteError(null);
    setBulkDeleteSuccess(false);

    const idsArray = Array.from(selectedStudentIds);
    const count = idsArray.length;
    let successCount = 0;
    let lastError: string | null = null;

    try {
      // Delete students one by one
      for (const id of idsArray) {
        try {
          await deleteStudent.mutateAsync(id);
          successCount++;
        } catch (err: unknown) {
          const message = getErrorMessage(err, 'Failed to delete student.');
          lastError = message;
        }
      }

      if (successCount > 0) {
        setDeletedCount(successCount);
        setBulkDeleteSuccess(true);
        setIsBulkDeleteDialogOpen(false);
        setSelectedStudentIds(new Set());
        
        // Clear success message after a delay
        setTimeout(() => {
          setBulkDeleteSuccess(false);
          setDeletedCount(0);
        }, 3000);
      }

      if (lastError && successCount < count) {
        setBulkDeleteError(`Deleted ${successCount} of ${count} students. ${lastError}`);
      }
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Failed to delete students. Please try again.');
      setBulkDeleteError(message);
    }
  };

  // Handle search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(0);
    // Clear selection on search change
    setSelectedStudentIds(new Set());
  };

  // Handle delete button click
  const handleDeleteClick = (student: Student) => {
    setSelectedStudent(student);
    setDeleteError(null);
    setDeleteSuccess(false);
    setIsDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedStudent) return;

    setDeleteError(null);
    setDeleteSuccess(false);

    try {
      await deleteStudent.mutateAsync(selectedStudent.id);
      setDeleteSuccess(true);
      setIsDeleteDialogOpen(false);
      setSelectedStudent(null);
      
      // Clear success message after a delay
      setTimeout(() => {
        setDeleteSuccess(false);
      }, 3000);
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Failed to delete student. Please try again.');
      setDeleteError(message);
    }
  };

  // Handle edit button click
  const handleEditClick = (student: Student) => {
    setSelectedStudent(student);
    setIsEditStudentOpen(true);
  };

  // Handle deactivate button click
  const handleDeactivateClick = async (student: Student) => {
    const isCurrentlyActive = student.user?.status === 'ACTIVE';
    const newStatus = isCurrentlyActive ? 'INACTIVE' : 'ACTIVE';
    
    setDeactivateError(null);
    setDeactivateSuccess(false);

    try {
      await updateStudent.mutateAsync({
        id: student.id,
        data: { status: newStatus as 'ACTIVE' | 'INACTIVE' },
      });
      setDeactivateSuccess(true);
      
      // Clear success message after a delay
      setTimeout(() => {
        setDeactivateSuccess(false);
      }, 3000);
    } catch (err: unknown) {
      const message = getErrorMessage(err, `Failed to ${isCurrentlyActive ? 'deactivate' : 'activate'} student. Please try again.`);
      setDeactivateError(message);
    }
  };

  // Handle inline updates
  const handleTeacherChange = async (studentId: string, teacherId: string | null) => {
    await updateStudent.mutateAsync({
      id: studentId,
      data: { teacherId: teacherId || undefined },
    });
  };

  const handleGroupChange = async (studentId: string, groupId: string | null) => {
    await updateStudent.mutateAsync({
      id: studentId,
      data: { groupId: groupId || undefined },
    });
  };

  const handleCenterChange = async (studentId: string, centerId: string | null) => {
    if (!centerId) {
      // If center is cleared, clear the group
      await handleGroupChange(studentId, null);
      return;
    }

    // Find a group in the selected center
    const groupsInCenter = (groupsData?.items || []).filter(g => g.centerId === centerId);
    if (groupsInCenter.length > 0) {
      // Assign to the first available group in that center
      await handleGroupChange(studentId, groupsInCenter[0].id);
    } else {
      // No groups in this center, clear the group
      await handleGroupChange(studentId, null);
    }
  };

  // Prepare options for dropdowns
  const teacherOptions = useMemo(() => 
    (teachersData?.items || []).map(teacher => ({
      id: teacher.id,
      label: `${teacher.user.firstName} ${teacher.user.lastName}`,
    })),
    [teachersData]
  );

  const groupOptions = useMemo(() => 
    (groupsData?.items || []).map(group => ({
      id: group.id,
      label: `${group.name}${group.level ? ` (${group.level})` : ''}`,
    })),
    [groupsData]
  );

  const centerOptions = useMemo(() => 
    (centersData?.items || []).map(center => ({
      id: center.id,
      label: center.name,
    })),
    [centersData]
  );

  const teacherFilterOptions = useMemo(() => 
    (teachersData?.items || []).map(teacher => ({
      id: teacher.id,
      label: `${teacher.user.firstName} ${teacher.user.lastName}`,
    })),
    [teachersData]
  );

  const centerFilterOptions = useMemo(() => 
    (centersData?.items || []).map(center => ({
      id: center.id,
      label: center.name,
    })),
    [centersData]
  );

  const statusFilterOptions = useMemo(() => [
    { id: 'ACTIVE', label: tStatus('active') },
    { id: 'INACTIVE', label: tStatus('inactive') },
    { id: 'SUSPENDED', label: tStatus('suspended') },
  ], [tStatus]);

  // Reset page when filters change
  const handleFilterChange = () => {
    setPage(0);
    // Clear selection on filter change
    setSelectedStudentIds(new Set());
  };

  // Stats calculation
  const activeStudents = students.filter(s => s.user?.status === 'ACTIVE').length;
  const studentsWithGroup = students.filter(s => s.group).length;
  // Use backend-provided totalMonthlyFees (calculated from all matching students, respecting filters, independent of pagination)
  const totalFees = studentsData?.totalMonthlyFees || 0;

  // Error state
  if (error) {
    console.error('Students fetch error:', error);
  }

  const studentColumns = [
    {
      key: 'checkbox',
      header: (
        <SelectAllCheckbox
          checked={allSelected}
          indeterminate={someSelected}
          onChange={handleSelectAll}
          disabled={deleteStudent.isPending || isLoading}
        />
      ),
      render: (student: Student) => (
        <input
          type="checkbox"
          className="w-4 h-4 rounded border-slate-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          checked={selectedStudentIds.has(student.id)}
          onChange={() => handleToggleSelect(student.id)}
          onClick={(e) => e.stopPropagation()}
          disabled={deleteStudent.isPending || isLoading}
          aria-label={`Select ${student.user?.firstName} ${student.user?.lastName}`}
        />
      ),
      className: '!pl-4 !pr-2 w-12',
    },
    {
      key: 'student',
      header: 'STUDENT',
      sortable: true,
      className: '!pl-0 !pr-4',
      render: (student: Student) => {
        const firstName = student.user?.firstName || '';
        const lastName = student.user?.lastName || '';
        const initials = `${firstName[0] || ''}${lastName[0] || ''}` || '?';
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold">
              {initials}
            </div>
            <div>
              <p className="font-semibold text-slate-800">
                {firstName} {lastName}
              </p>
              <p className="text-sm text-slate-500">
                {student.user?.phone || 'No phone'}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'teacher',
      header: 'TEACHER',
      render: (student: Student) => (
        <div className="min-w-[150px]">
          <InlineSelect
            value={student.teacherId || null}
            options={teacherOptions}
            onChange={(teacherId) => handleTeacherChange(student.id, teacherId)}
            placeholder="Not assigned"
            disabled={updateStudent.isPending}
          />
        </div>
      ),
    },
    {
      key: 'group',
      header: 'GROUP',
      render: (student: Student) => (
        <div className="min-w-[150px]">
          <InlineSelect
            value={student.groupId || null}
            options={groupOptions}
            onChange={(groupId) => handleGroupChange(student.id, groupId)}
            placeholder="Not assigned"
            disabled={updateStudent.isPending}
          />
        </div>
      ),
    },
    {
      key: 'center',
      header: 'CENTER',
      render: (student: Student) => {
        const currentCenterId = student.group?.center?.id || null;
        return (
          <div className="min-w-[150px]">
            <InlineSelect
              value={currentCenterId}
              options={centerOptions}
              onChange={(centerId) => handleCenterChange(student.id, centerId)}
              placeholder="Not assigned"
              disabled={updateStudent.isPending}
            />
          </div>
        );
      },
    },
    {
      key: 'monthlyFee',
      header: 'MONTHLY FEE',
      sortable: true,
      className: 'text-left',
      render: (student: Student) => {
        const fee = typeof student.monthlyFee === 'string' ? parseFloat(student.monthlyFee) : Number(student.monthlyFee || 0);
        return (
          <span className="text-slate-700 font-medium">
            {formatCurrency(fee)}
          </span>
        );
      },
    },
    {
      key: 'absence',
      header: 'ABSENCE',
      sortable: true,
      className: 'text-left',
      render: (student: Student) => {
        const attendance = student.attendanceSummary;
        
        // If student has no group, show "—"
        if (!student.groupId) {
          return (
            <span className="text-slate-400 pl-4">—</span>
          );
        }
        
        // If no attendance data, show "0/0"
        if (!attendance) {
          return (
            <span className="text-slate-600 pl-4">0/0</span>
          );
        }
        
        const { totalClasses, absences } = attendance;
        return (
          <span className="text-slate-700 font-medium pl-4">
            {totalClasses}/{absences}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      className: '!w-[160px] !min-w-[160px] !max-w-[160px] !px-3 !py-4 text-left',
      render: (student: Student) => {
        const isActive = student.user?.status === 'ACTIVE';
        const isDeactivating = updateStudent.isPending;
        
        return (
          <ActionButtons
            onEdit={() => handleEditClick(student)}
            onDisable={() => handleDeactivateClick(student)}
            onDelete={() => handleDeleteClick(student)}
            isActive={isActive}
            disabled={isDeactivating || deleteStudent.isPending}
            ariaLabels={{
              edit: tCommon('edit'),
              disable: isActive ? tTeachers('deactivate') : tTeachers('activate'),
              delete: tCommon('delete'),
            }}
            titles={{
              edit: tCommon('edit'),
              disable: isActive ? tTeachers('deactivate') : tTeachers('activate'),
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
            title={t('totalStudents')}
            value={totalStudents}
            change={{ value: '+5.2%', type: 'positive' }}
          />
          <StatCard
            title={t('activeStudents')}
            value={activeStudents || totalStudents}
            change={{ value: '+3.1%', type: 'positive' }}
          />
          <StatCard
            title={t('inGroups')}
            value={studentsWithGroup}
            change={{ value: t('unassignedCount', { count: totalStudents - studentsWithGroup }), type: totalStudents - studentsWithGroup > 0 ? 'warning' : 'positive' }}
          />
          <StatCard
            title={t('totalMonthlyFees')}
            value={formatCurrency(totalFees)}
          />
        </div>

        {/* Search & Filters */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            {/* Status Filter */}
            <div className="relative">
              <select
                value={selectedStatusIds.size === 1 ? Array.from(selectedStatusIds)[0] : ''}
                onChange={(e) => {
                  const status = e.target.value as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | '';
                  if (status) {
                    setSelectedStatusIds(new Set([status]));
                  } else {
                    setSelectedStatusIds(new Set());
                  }
                  setPage(0);
                  setSelectedStudentIds(new Set());
                }}
                className="pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer min-w-[160px]"
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
            {selectedStudentIds.size > 0 && (
              <Button
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium"
                onClick={handleBulkDeleteClick}
                disabled={deleteStudent.isPending || isLoading}
              >
                Delete All ({selectedStudentIds.size})
              </Button>
            )}
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-medium"
              onClick={() => setIsAddStudentOpen(true)}
            >
              + {t('addStudent')}
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <FilterDropdown
              label="Status"
              options={statusFilterOptions}
              selectedIds={selectedStatusIds}
              onSelectionChange={(ids) => {
                setSelectedStatusIds(ids);
                handleFilterChange();
              }}
              placeholder="All Statuses"
            />
            <FilterDropdown
              label="Teacher"
              options={teacherFilterOptions}
              selectedIds={selectedTeacherIds}
              onSelectionChange={(ids) => {
                setSelectedTeacherIds(ids);
                handleFilterChange();
              }}
              placeholder="All Teachers"
              isLoading={!teachersData}
            />
            <FilterDropdown
              label="Center"
              options={centerFilterOptions}
              selectedIds={selectedCenterIds}
              onSelectionChange={(ids) => {
                setSelectedCenterIds(ids);
                handleFilterChange();
              }}
              placeholder="All Centers"
              isLoading={!centersData}
            />
            {/* Month Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(Number(e.target.value));
                  handleFilterChange();
                }}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value={1}>January</option>
                <option value={2}>February</option>
                <option value={3}>March</option>
                <option value={4}>April</option>
                <option value={5}>May</option>
                <option value={6}>June</option>
                <option value={7}>July</option>
                <option value={8}>August</option>
                <option value={9}>September</option>
                <option value={10}>October</option>
                <option value={11}>November</option>
                <option value={12}>December</option>
              </select>
            </div>
            {/* Year Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(Number(e.target.value));
                  handleFilterChange();
                }}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = now.getFullYear() - 2 + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <DataTable
          columns={studentColumns}
          data={students}
          keyExtractor={(student) => student.id}
          isLoading={isLoading}
          emptyMessage={searchQuery ? "No students match your search" : "No students found"}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />

        {/* Pagination */}
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            Showing {Math.min(page * pageSize + 1, totalStudents)}-{Math.min((page + 1) * pageSize, totalStudents)} of {totalStudents} students
          </span>
          <div className="flex items-center gap-2">
            <button 
              className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50" 
              disabled={page === 0}
              onClick={() => handlePageChange(Math.max(0, page - 1))}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span>Page {page + 1} of {totalPages || 1}</span>
            <button 
              className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50"
              disabled={page >= totalPages - 1}
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
              <div className="p-3 bg-red-50 rounded-xl">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 mb-2">Unassigned Students</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {totalStudents - studentsWithGroup > 0 
                    ? `${totalStudents - studentsWithGroup} students are not assigned to any group. Assign them to start their learning journey.`
                    : 'All students are assigned to groups. Great work!'}
                </p>
                <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/90">
                  Manage Groups
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-50 rounded-xl">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 mb-2">Payment Collection</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Total monthly fees: {formatCurrency(totalFees)}. 
                  Monitor payment status in the Finance section.
                </p>
                <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/90">
                  View Finance
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      <AddStudentForm 
        open={isAddStudentOpen} 
        onOpenChange={setIsAddStudentOpen} 
      />

      {/* Edit Student Modal */}
      {selectedStudent && (
        <EditStudentForm
          open={isEditStudentOpen}
          onOpenChange={(open) => {
            setIsEditStudentOpen(open);
            if (!open) {
              setSelectedStudent(null);
            }
          }}
          studentId={selectedStudent.id}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        studentName={selectedStudent ? `${selectedStudent.user?.firstName || ''} ${selectedStudent.user?.lastName || ''}`.trim() : undefined}
        isLoading={deleteStudent.isPending}
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
        studentName={selectedStudentIds.size > 0 ? `${selectedStudentIds.size} ${selectedStudentIds.size === 1 ? 'student' : 'students'}` : undefined}
        isLoading={deleteStudent.isPending}
        error={bulkDeleteError || undefined}
        title="Delete Students"
      />

      {/* Success Messages */}
      {deleteSuccess && (
        <div className="fixed bottom-4 right-4 p-4 bg-green-50 border border-green-200 rounded-lg shadow-lg z-50">
          <p className="text-sm text-green-600">Student deleted successfully!</p>
        </div>
      )}
      {bulkDeleteSuccess && (
        <div className="fixed bottom-4 right-4 p-4 bg-green-50 border border-green-200 rounded-lg shadow-lg z-50">
          <p className="text-sm text-green-600 font-medium">
            {deletedCount > 0 
              ? `${deletedCount} ${deletedCount === 1 ? 'student' : 'students'} deleted successfully!`
              : 'Students deleted successfully!'}
          </p>
        </div>
      )}
      {deactivateSuccess && (
        <div className="fixed bottom-4 right-4 p-4 bg-green-50 border border-green-200 rounded-lg shadow-lg z-50">
          <p className="text-sm text-green-600">Student status updated successfully!</p>
        </div>
      )}
      {bulkDeleteError && (
        <div className="fixed bottom-4 right-4 p-4 bg-red-50 border border-red-200 rounded-lg shadow-lg z-50">
          <p className="text-sm text-red-600 font-medium">{bulkDeleteError}</p>
        </div>
      )}
      {deactivateError && (
        <div className="fixed bottom-4 right-4 p-4 bg-red-50 border border-red-200 rounded-lg shadow-lg z-50">
          <p className="text-sm text-red-600">{deactivateError}</p>
        </div>
      )}
    </DashboardLayout>
  );
}
