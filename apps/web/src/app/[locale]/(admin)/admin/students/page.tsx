'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { StatCard, DataTable, Badge, Button, FilterDropdown } from '@/shared/components/ui';
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
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<Set<string>>(new Set());
  const [selectedCenterIds, setSelectedCenterIds] = useState<Set<string>>(new Set());
  const [selectedStatusIds, setSelectedStatusIds] = useState<Set<string>>(new Set());
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
  const { data: teachersData } = useTeachers({ take: 100, status: 'ACTIVE' });
  const { data: groupsData } = useGroups({ take: 100, isActive: true });
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
  };

  // Handle search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(0);
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
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to delete student. Please try again.';
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
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || `Failed to ${isCurrentlyActive ? 'deactivate' : 'activate'} student. Please try again.`;
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
      header: <input type="checkbox" className="w-4 h-4 rounded border-slate-300" />,
      render: () => <input type="checkbox" className="w-4 h-4 rounded border-slate-300" />,
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
          <div className="flex items-center justify-start gap-1.5 w-full" onClick={(e) => e.stopPropagation()}>
            {/* Edit Button */}
            <button
              type="button"
              aria-label={tCommon('edit')}
              title={tCommon('edit')}
              onClick={(e) => {
                e.stopPropagation();
                handleEditClick(student);
              }}
              className="p-1.5 text-slate-900 hover:text-slate-700 hover:bg-slate-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
              disabled={isDeactivating || deleteStudent.isPending}
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
                handleDeleteClick(student);
              }}
              className="p-1.5 text-slate-900 hover:text-slate-700 hover:bg-slate-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
              disabled={isDeactivating || deleteStudent.isPending}
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
              aria-label={isActive ? tTeachers('deactivate') : tTeachers('activate')}
              title={isActive ? tTeachers('deactivate') : tTeachers('activate')}
              onClick={(e) => {
                e.stopPropagation();
                handleDeactivateClick(student);
              }}
              className="p-1.5 text-slate-900 hover:text-slate-700 hover:bg-slate-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
              disabled={isDeactivating || deleteStudent.isPending}
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
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium"
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
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
              onClick={() => setPage(p => Math.max(0, p - 1))}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span>Page {page + 1} of {totalPages || 1}</span>
            <button 
              className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
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
                <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
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
                <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
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

      {/* Success Messages */}
      {deleteSuccess && (
        <div className="fixed bottom-4 right-4 p-4 bg-green-50 border border-green-200 rounded-lg shadow-lg z-50">
          <p className="text-sm text-green-600">Student deleted successfully!</p>
        </div>
      )}
      {deactivateSuccess && (
        <div className="fixed bottom-4 right-4 p-4 bg-green-50 border border-green-200 rounded-lg shadow-lg z-50">
          <p className="text-sm text-green-600">Student status updated successfully!</p>
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
