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
