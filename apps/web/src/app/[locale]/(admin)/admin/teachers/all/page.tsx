'use client';

import { portalPageStackClass } from '@/shared/lib/portal-theme';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { EditTeacherForm, TeacherDetailsModal } from '@/features/teachers';
import { ChatBackButton } from '@/shared/components/ui/chat-back-button';
import { AllTeachersBoardGrid } from '../components/AllTeachersBoardGrid';
import { TeachersFilters } from '../components/TeachersFilters';
import { useAllTeachersPage } from '../hooks/useAllTeachersPage';

export default function AllTeachersPage() {
  const {
    t,
    tStatus,
    searchQuery,
    selectedStatus,
    filteredTeachers,
    isLoading,
    error,
    selectedTeacherIdForDetails,
    selectedTeacherIdForEdit,
    isDetailsDrawerOpen,
    isEditTeacherOpen,
    handleSearchChange,
    handleStatusChange,
    handleEditClick,
    handleRowClick,
    handleDetailsDrawerClose,
    handleBackToTeachers,
    setIsEditTeacherOpen,
    setSelectedTeacher,
  } = useAllTeachersPage();

  if (error) {
    console.error('All teachers fetch error:', error);
  }

  return (
    <DashboardLayout
      title={t('allTeachersTitle')}
      subtitle={t('allTeachersSubtitle')}
      contentScrollClassName="overscroll-y-none"
    >
      <div className={portalPageStackClass}>
        <ChatBackButton
          onClick={handleBackToTeachers}
          aria-label={t('backToTeachers')}
        />

        <TeachersFilters
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          selectedStatus={selectedStatus}
          onStatusChange={handleStatusChange}
          viewMode="board"
          onViewModeChange={() => undefined}
          onAddTeacher={handleBackToTeachers}
          hideViewToggle
          hideAddButton
          t={t}
          tStatus={tStatus}
          isDeleting={false}
        />

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
          <AllTeachersBoardGrid
            teachers={filteredTeachers}
            isLoading={isLoading}
            searchQuery={searchQuery}
            onEdit={handleEditClick}
            onCardClick={handleRowClick}
            t={t}
          />
        </div>
      </div>

      <TeacherDetailsModal
        teacherId={selectedTeacherIdForDetails}
        open={isDetailsDrawerOpen}
        onClose={handleDetailsDrawerClose}
      />

      <EditTeacherForm
        open={isEditTeacherOpen}
        onOpenChange={(open) => {
          setIsEditTeacherOpen(open);
          if (!open) {
            setSelectedTeacher(null);
          }
        }}
        teacherId={selectedTeacherIdForEdit ?? ''}
      />
    </DashboardLayout>
  );
}
