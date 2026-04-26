'use client';

import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { 
  AddStudentForm,
  EditStudentForm,
  DeleteConfirmationDialog,
  StudentDetailsModal,
} from '@/features/students';
import { StudentsStats } from './components/StudentsStats';
import { StudentsFilters } from './components/StudentsFilters';
import { StudentsList } from './components/StudentsList';
import { StudentsBoard } from './components/StudentsBoard';
import { StudentsMessages } from './components/StudentsMessages';
import { StudentFeedbackModal } from './components/StudentFeedbackModal';
import { useStudentsPage } from './hooks/useStudentsPage';

export default function StudentsPage() {
  const {
    // Data
    students,
    totalStudents,
    totalPages,
    studentsByCenter,
    isLoading,
    teachersData,
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
    selectedStatusIds,
    selectedGroupIds,
    selectedLifecycleIds,
    selectedMonth,
    selectedYear,
    isAddStudentOpen,
    isEditStudentOpen,
    isDeleteDialogOpen,
    isBulkDeleteDialogOpen,
    isFeedbackModalOpen,
    selectedStudentForFeedback,
    feedbackStudentIdFromUrl,
    selectedStudentIdForDetails,
    isStudentDetailsModalOpen,
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
    groups,
    centerOptions,
    teacherFilterOptions,
    statusFilterOptions,
    groupFilterOptions,
    lifecycleFilterOptions,
    
    // Stats
    activeStudents,
    studentsWithGroup,
    totalFees,
    
    // Handlers
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
    handleShowFeedback,
    handleFeedbackModalOpenChange,
    handleTeacherChange,
    handleGroupChange,
    handleCenterChange,
    handleRegisterDateChange,
    handleStudentDetailsOpen,
    handleStudentDetailsClose,
    setSelectedTeacherIds,
    setSelectedStatusIds,
    setSelectedGroupIds,
    setSelectedLifecycleIds,
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
    locale,
    
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

  const handleGroupFilterChange = (ids: Set<string>) => {
    setSelectedGroupIds(ids);
    handleFilterChange();
  };

  const handleLifecycleFilterChange = (ids: Set<string>) => {
    setSelectedLifecycleIds(ids);
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
          selectedGroupIds={selectedGroupIds}
          onGroupChange={handleGroupFilterChange}
          selectedLifecycleIds={selectedLifecycleIds}
          onLifecycleChange={handleLifecycleFilterChange}
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
          groupFilterOptions={groupFilterOptions}
          lifecycleFilterOptions={lifecycleFilterOptions}
          isLoadingTeachers={!teachersData}
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
            onShowFeedback={handleShowFeedback}
            onView={handleStudentDetailsOpen}
            onTeacherChange={handleTeacherChange}
            onGroupChange={handleGroupChange}
            onCenterChange={handleCenterChange}
            onRegisterDateChange={handleRegisterDateChange}
            teacherOptions={teacherOptions}
            groups={groups}
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
            onCardClick={handleStudentDetailsOpen}
          />
        )}
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

      {/* Student feedback modal (message icon) */}
      <StudentFeedbackModal
        open={isFeedbackModalOpen || !!feedbackStudentIdFromUrl}
        onOpenChange={handleFeedbackModalOpenChange}
        student={selectedStudentForFeedback}
        studentId={feedbackStudentIdFromUrl}
      />

      <StudentDetailsModal
        studentId={selectedStudentIdForDetails}
        open={isStudentDetailsModalOpen}
        onClose={handleStudentDetailsClose}
        locale={locale}
      />
    </DashboardLayout>
  );
}
