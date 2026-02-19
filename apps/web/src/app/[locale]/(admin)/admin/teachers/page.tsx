'use client';

import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { Button } from '@/shared/components/ui';
import { 
  AddTeacherForm, 
  EditTeacherForm,
  DeleteConfirmationDialog,
  TeacherDetailsDrawer,
} from '@/features/teachers';
import { TeachersFilters } from './components/TeachersFilters';
import { TeachersList } from './components/TeachersList';
import { TeachersBoard } from './components/TeachersBoard';
import { TeachersInfoCards } from './components/TeachersInfoCards';
import { TeachersMessages } from './components/TeachersMessages';
import { useTeachersPage } from './hooks/useTeachersPage';

export default function TeachersPage() {
  const {
    // Translations
    t,
    tCommon,
    tStatus,
    locale,
    
    // State
    searchQuery,
    page,
    sortBy,
    sortOrder,
    viewMode,
    selectedStatus,
    selectedBranchIds,
    selectedTeacherIds,
    selectedTeacher,
    selectedTeacherIdForDetails,
    isAddTeacherOpen,
    isEditTeacherOpen,
    isDeleteDialogOpen,
    isBulkDeleteDialogOpen,
    isDetailsDrawerOpen,
    allSelected,
    someSelected,
    
    // Data
    teachers,
    totalTeachers,
    totalPages,
    teachersByCenter,
    filteredTeachers,
    centersData,
    activeTeachers,
    totalLessons,
    
    // Loading states
    isLoading,
    isLoadingCenters,
    deleteTeacher,
    deleteTeachers,
    updateTeacher,
    
    // Errors
    error,
    centersError,
    deleteError,
    bulkDeleteError,
    deactivateError,
    
    // Success messages
    deleteSuccess,
    bulkDeleteSuccess,
    deactivateSuccess,
    deletedCount,
    
    // Handlers
    handleSearchChange,
    handleBranchFilterChange,
    handleStatusChange,
    handleSort,
    handlePageChange,
    handleToggleSelect,
    handleSelectAll,
    handleViewModeChange,
    handleEditClick,
    handleDeleteClick,
    handleDeleteConfirm,
    handleBulkDeleteClick,
    handleBulkDeleteConfirm,
    handleDeactivateClick,
    handleRowClick,
    handleDetailsDrawerClose,
    setIsAddTeacherOpen,
    setIsEditTeacherOpen,
    setIsDeleteDialogOpen,
    setIsBulkDeleteDialogOpen,
    setSelectedTeacher,
    setDeleteError,
    setDeleteSuccess,
    setBulkDeleteError,
    setBulkDeleteSuccess,
  } = useTeachersPage();

  // Error state
  if (error) {
    console.error('Teachers fetch error:', error);
  }

  return (
    <DashboardLayout 
      title={t('title')} 
      subtitle={t('subtitle')}
    >
      <div className="space-y-6">
        {/* Search, Filter & Actions Bar */}
        <TeachersFilters
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          selectedStatus={selectedStatus}
          onStatusChange={handleStatusChange}
          selectedBranchIds={selectedBranchIds}
          onBranchFilterChange={handleBranchFilterChange}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onAddTeacher={() => setIsAddTeacherOpen(true)}
          centersData={centersData?.items}
          isLoadingCenters={isLoadingCenters}
          centersError={centersError}
          t={t}
          tCommon={tCommon}
          tStatus={tStatus}
          isDeleting={deleteTeachers.isPending || deleteTeacher.isPending}
          page={page}
          totalPages={totalPages}
          totalTeachers={totalTeachers}
          onPageChange={handlePageChange}
          isUpdating={updateTeacher.isPending}
        />

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

        {/* Teachers View */}
        {viewMode === 'list' ? (
          <TeachersList
            teachers={teachers}
            totalTeachers={totalTeachers}
            totalPages={totalPages}
            page={page}
            onPageChange={handlePageChange}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onRowClick={handleRowClick}
            allSelected={allSelected}
            someSelected={someSelected}
            selectedTeacherIds={selectedTeacherIds}
            onSelectAll={handleSelectAll}
            onToggleSelect={handleToggleSelect}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            onDeactivate={handleDeactivateClick}
            isLoading={isLoading}
            isDeleting={deleteTeachers.isPending || deleteTeacher.isPending}
            isUpdating={updateTeacher.isPending}
            searchQuery={searchQuery}
            t={t}
            tCommon={tCommon}
            tStatus={tStatus}
          />
        ) : (
          <TeachersBoard
            teachersByCenter={teachersByCenter}
            centersData={centersData?.items}
            isLoading={isLoading}
            searchQuery={searchQuery}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            onDeactivate={handleDeactivateClick}
          />
        )}

        {/* Info Cards */}
        <TeachersInfoCards
          filteredTeachers={filteredTeachers}
          totalLessons={totalLessons}
          locale={locale}
          t={t}
        />
      </div>

      {/* Success/Error Messages */}
      <TeachersMessages
        deleteSuccess={deleteSuccess}
        deleteError={deleteError}
        bulkDeleteSuccess={bulkDeleteSuccess}
        bulkDeleteError={bulkDeleteError}
        deletedCount={deletedCount}
        deactivateSuccess={deactivateSuccess}
        deactivateError={deactivateError}
      />

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
