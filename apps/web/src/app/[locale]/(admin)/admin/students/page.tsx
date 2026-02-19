'use client';

import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { formatCurrency } from '@/shared/lib/utils';
import { 
  AddStudentForm,
  EditStudentForm,
  DeleteConfirmationDialog,
} from '@/features/students';
import { StudentsStats } from './components/StudentsStats';
import { StudentsFilters } from './components/StudentsFilters';
import { StudentsList } from './components/StudentsList';
import { StudentsBoard } from './components/StudentsBoard';
import { StudentsMessages } from './components/StudentsMessages';
import { useStudentsPage } from './hooks/useStudentsPage';

export default function StudentsPage() {
  const router = useRouter();
  const {
    // Data
    students,
    totalStudents,
    totalPages,
    allCenters,
    studentsByCenter,
    isLoading,
    error,
    teachersData,
    groupsData,
    centersData,
    
    // State
    searchQuery,
    page,
    viewMode,
    sortBy,
    sortOrder,
    selectedStudent,
    selectedStudentIds,
    allSelected,
    someSelected,
    selectedTeacherIds,
    selectedCenterIds,
    selectedStatusIds,
    selectedMonth,
    selectedYear,
    isAddStudentOpen,
    isEditStudentOpen,
    isDeleteDialogOpen,
    isBulkDeleteDialogOpen,
    deleteError,
    deleteSuccess,
    bulkDeleteError,
    bulkDeleteSuccess,
    deletedCount,
    deactivateError,
    deactivateSuccess,
    
    // Mutations
    deleteStudent,
    updateStudent,
    
    // Options
    teacherOptions,
    groupOptions,
    centerOptions,
    teacherFilterOptions,
    centerFilterOptions,
    statusFilterOptions,
    
    // Stats
    activeStudents,
    studentsWithGroup,
    totalFees,
    
    // Handlers
    setSearchQuery,
    handleSearchChange,
    handlePageChange,
    setViewMode,
    updateViewModeInUrl,
    handleSort,
    handleToggleSelect,
    handleSelectAll,
    handleBulkDeleteClick,
    handleBulkDeleteConfirm,
    handleDeleteClick,
    handleDeleteConfirm,
    handleEditClick,
    handleDeactivateClick,
    handleTeacherChange,
    handleGroupChange,
    handleCenterChange,
    setSelectedTeacherIds,
    setSelectedCenterIds,
    setSelectedStatusIds,
    setSelectedMonth,
    setSelectedYear,
    handleFilterChange,
    setIsAddStudentOpen,
    setIsEditStudentOpen,
    setIsDeleteDialogOpen,
    setIsBulkDeleteDialogOpen,
    setSelectedStudent,
    setDeleteError,
    setBulkDeleteError,
    setBulkDeleteSuccess,
    setPage,
    setSelectedStudentIds,
    
    // Translations
    t,
    tCommon,
    tTeachers,
    tStatus,
    
    // Constants
    pageSize,
    now,
  } = useStudentsPage();

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

  // Fetch students - for board view, fetch max allowed (100); for list view, use pagination
  const shouldFetchAll = viewMode === 'board';
  const { 
    data: studentsData, 
    isLoading,
    error 
  } = useStudents({ 
    skip: shouldFetchAll ? 0 : page * pageSize,
    take: shouldFetchAll ? 100 : pageSize, // API max is 100
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
  const allCenters = centersData?.items || [];

  // Group students by center for board view
  const studentsByCenter = useMemo(() => {
    if (viewMode !== 'board') return {};
    
    const grouped: Record<string, Student[]> = {};
    
    // Initialize all centers
    allCenters.forEach(center => {
      grouped[center.id] = [];
    });
    
    // Add unassigned students column
    grouped['unassigned'] = [];
    
    // Assign students to their centers
    students.forEach(student => {
      const centerId = student.group?.center?.id;
      if (centerId && grouped[centerId]) {
        grouped[centerId].push(student);
      } else {
        grouped['unassigned'].push(student);
      }
    });
    
    return grouped;
  }, [students, allCenters, viewMode]);

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
        data: { status: newStatus },
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

  // Handle view mode change with proper state updates
  const handleViewModeChange = (mode: 'list' | 'board') => {
    setViewMode(mode);
    updateViewModeInUrl(mode);
    setPage(0);
    setSelectedStudentIds(new Set());
  };

  // Handle filter changes with proper callbacks
  const handleStatusFilterChange = (ids: Set<string>) => {
    setSelectedStatusIds(ids);
    handleFilterChange();
  };

  const handleTeacherFilterChange = (ids: Set<string>) => {
    setSelectedTeacherIds(ids);
    handleFilterChange();
  };

  const handleCenterFilterChange = (ids: Set<string>) => {
    setSelectedCenterIds(ids);
    handleFilterChange();
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    handleFilterChange();
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    handleFilterChange();
  };

  return (
    <DashboardLayout 
      title={t('title')} 
      subtitle={t('subtitle')}
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <StudentsStats 
          totalStudents={totalStudents}
          activeStudents={activeStudents}
          studentsWithGroup={studentsWithGroup}
          totalFees={totalFees}
          t={t}
        />

        {/* Search & Filters */}
        <StudentsFilters
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          selectedStatusIds={selectedStatusIds}
          onStatusChange={handleStatusFilterChange}
          selectedTeacherIds={selectedTeacherIds}
          onTeacherChange={handleTeacherFilterChange}
          selectedCenterIds={selectedCenterIds}
          onCenterChange={handleCenterFilterChange}
          selectedMonth={selectedMonth}
          onMonthChange={handleMonthChange}
          selectedYear={selectedYear}
          onYearChange={handleYearChange}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onAddStudent={() => setIsAddStudentOpen(true)}
          selectedStudentIds={selectedStudentIds}
          onBulkDelete={handleBulkDeleteClick}
          statusFilterOptions={statusFilterOptions}
          teacherFilterOptions={teacherFilterOptions}
          centerFilterOptions={centerFilterOptions}
          isLoadingTeachers={!teachersData}
          isLoadingCenters={!centersData}
          isDeleting={deleteStudent.isPending || isLoading}
          t={t}
          now={now}
        />

        {/* Students View */}
        {viewMode === 'list' ? (
          <StudentsList
            students={students}
            totalStudents={totalStudents}
            totalPages={totalPages}
            page={page}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            allSelected={allSelected}
            someSelected={someSelected}
            selectedStudentIds={selectedStudentIds}
            onSelectAll={handleSelectAll}
            onToggleSelect={handleToggleSelect}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            onDeactivate={handleDeactivateClick}
            onTeacherChange={handleTeacherChange}
            onGroupChange={handleGroupChange}
            onCenterChange={handleCenterChange}
            teacherOptions={teacherOptions}
            groupOptions={groupOptions}
            centerOptions={centerOptions}
            isLoading={isLoading}
            isDeleting={deleteStudent.isPending}
            isUpdating={updateStudent.isPending}
            searchQuery={searchQuery}
            t={t}
            tCommon={tCommon}
            tTeachers={tTeachers}
          />
        ) : (
          <StudentsBoard
            studentsByCenter={studentsByCenter}
            centersData={centersData?.items}
            isLoading={isLoading}
            searchQuery={searchQuery}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            onDeactivate={handleDeactivateClick}
          />
        )}

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
                <button 
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/90"
                  onClick={() => router.push('/admin/groups')}
                >
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
                <button 
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/90"
                  onClick={() => router.push('/admin/finance')}
                >
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

      {/* Success/Error Messages */}
      <StudentsMessages
        deleteSuccess={deleteSuccess}
        deleteError={deleteError}
        bulkDeleteSuccess={bulkDeleteSuccess}
        bulkDeleteError={bulkDeleteError}
        deletedCount={deletedCount}
        deactivateSuccess={deactivateSuccess}
        deactivateError={deactivateError}
      />

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
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setSelectedStudent(null);
            setDeleteError(null);
            setDeleteSuccess(false);
          }
        }}
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
    </DashboardLayout>
  );
}
