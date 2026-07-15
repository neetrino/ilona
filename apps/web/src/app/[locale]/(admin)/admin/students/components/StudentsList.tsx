'use client';

import { AdminPaginationControls, DataTable } from '@/shared/components/ui';
import { createStudentsTableColumns } from './StudentsTableColumns';
import { getItemId, isOnboardingItem, type TeacherAssignedItem, type Student } from '@/features/students';
import type { Group } from '@/features/groups';

interface StudentsListProps {
  students: TeacherAssignedItem[];
  totalStudents: number;
  totalPages: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  sortBy: string | undefined;
  sortOrder: 'asc' | 'desc';
  onSort: (key: string) => void;
  allSelected: boolean;
  someSelected: boolean;
  selectedStudentIds: Set<string>;
  onSelectAll: () => void;
  onToggleSelect: (studentId: string) => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  onDeactivate: (student: Student) => void;
  onShowFeedback: (student: Student) => void;
  onView: (student: Student) => void;
  onGroupChange: (studentId: string, groupId: string | null) => Promise<void>;
  onCenterChange: (studentId: string, centerId: string | null) => Promise<void>;
  onRegisterDateChange: (studentId: string, date: string | null) => Promise<void>;
  groups: Group[];
  centerOptions: Array<{ id: string; label: string }>;
  isLoading: boolean;
  isDeleting: boolean;
  isUpdating: boolean;
  searchQuery: string;
  t: (key: string, values?: Record<string, string | number>) => string;
  tCommon: (key: string) => string;
  tTeachers: (key: string) => string;
  tAnalytics: (key: string) => string;
}

export function StudentsList({
  students,
  totalStudents,
  totalPages,
  page,
  pageSize,
  onPageChange,
  sortBy,
  sortOrder,
  onSort,
  allSelected,
  someSelected,
  selectedStudentIds,
  onSelectAll,
  onToggleSelect,
  onEdit,
  onDelete,
  onDeactivate,
  onShowFeedback,
  onView,
  onGroupChange,
  onCenterChange,
  onRegisterDateChange,
  groups,
  centerOptions,
  isLoading,
  isDeleting,
  isUpdating,
  searchQuery,
  t,
  tCommon,
  tTeachers,
  tAnalytics,
}: StudentsListProps) {
  const studentColumns = createStudentsTableColumns({
    t,
    tCommon,
    tTeachers,
    tAnalytics,
    allSelected,
    someSelected,
    selectedStudentIds,
    onSelectAll,
    onToggleSelect,
    onEdit,
    onDelete,
    onDeactivate,
    onShowFeedback,
    onGroupChange,
    onCenterChange,
    onRegisterDateChange,
    groups,
    centerOptions,
    isDeleting: isDeleting || isUpdating,
    isUpdating,
    isLoading,
  });

  return (
    <>
      {/* Students Table — scroll inside card so columns never overlap */}
      <div className="w-full min-w-0">
      <DataTable
        columns={studentColumns}
        data={students}
        keyExtractor={(student) => getItemId(student)}
        onRowClick={(student) => {
          if (isOnboardingItem(student)) return;
          onView(student);
        }}
        isLoading={isLoading}
        emptyMessage={searchQuery ? "No students match your search" : "No students found"}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={onSort}
        compact
        tableClassName="table-fixed w-full"
      />
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center lg:justify-start">
        <AdminPaginationControls
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          previousLabel={tCommon('previousPage')}
          nextLabel={tCommon('nextPage')}
          disabled={isDeleting || isUpdating}
        />
      </div>
    </>
  );
}

