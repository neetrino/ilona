'use client';

import { portalPageStackClass } from '@/shared/lib/portal-theme';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { EditTeacherForm, TeacherDetailsModal } from '@/features/teachers';
import { ArrowLeft } from 'lucide-react';
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
        <button
          type="button"
          onClick={handleBackToTeachers}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#1010a3] transition-colors hover:text-[#1010a3]/80"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('backToTeachers')}
        </button>

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
