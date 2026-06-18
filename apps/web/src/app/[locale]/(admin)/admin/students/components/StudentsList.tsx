'use client';

import { DataTable } from '@/shared/components/ui';
import { createStudentsTableColumns } from './StudentsTableColumns';
import { getItemId, isOnboardingItem, type TeacherAssignedItem, type Student } from '@/features/students';
import type { Group } from '@/features/groups';
import type { Teacher } from '@/features/teachers';

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
  onTeacherChange: (studentId: string, teacherId: string | null) => Promise<void>;
  onGroupChange: (studentId: string, groupId: string | null) => Promise<void>;
  onCenterChange: (studentId: string, centerId: string | null) => Promise<void>;
  onRegisterDateChange: (studentId: string, date: string | null) => Promise<void>;
  teachers: Teacher[];
  groups: Group[];
  centerOptions: Array<{ id: string; label: string }>;
  isLoading: boolean;
  isDeleting: boolean;
  isUpdating: boolean;
  searchQuery: string;
  t: (key: string) => string;
  tCommon: (key: string) => string;
  tTeachers: (key: string) => string;
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
  onTeacherChange,
  onGroupChange,
  onCenterChange,
  onRegisterDateChange,
  teachers,
  groups,
  centerOptions,
  isLoading,
  isDeleting,
  isUpdating,
  searchQuery,
  t,
  tCommon,
  tTeachers,
}: StudentsListProps) {
  const studentColumns = createStudentsTableColumns({
    t,
    tCommon,
    tTeachers,
    allSelected,
    someSelected,
    selectedStudentIds,
    onSelectAll,
    onToggleSelect,
    onEdit,
    onDelete,
    onDeactivate,
    onShowFeedback,
    onTeacherChange,
    onGroupChange,
    onCenterChange,
    onRegisterDateChange,
    teachers,
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
      />
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-[#8b8b90] lg:justify-start lg:gap-4">
        <span>
          Showing {Math.min(page * pageSize + 1, totalStudents)}-{Math.min((page + 1) * pageSize, totalStudents)} of {totalStudents} students
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
              page === 0
                ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
                : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]'
            }`}
            disabled={page === 0 || isDeleting || isUpdating}
            onClick={() => onPageChange(Math.max(0, page - 1))}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-[#1010a3] px-3 text-xs font-semibold text-white">
            {page + 1}
          </span>
          <button
            type="button"
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
              page >= totalPages - 1 || isDeleting || isUpdating
                ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
                : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]'
            }`}
            disabled={page >= totalPages - 1 || isDeleting || isUpdating}
            onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

