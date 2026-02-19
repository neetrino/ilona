'use client';

import { DataTable } from '@/shared/components/ui';
import { createStudentsTableColumns } from './StudentsTableColumns';
import type { Student } from '@/features/students';

interface StudentsListProps {
  students: Student[];
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
  onTeacherChange: (studentId: string, teacherId: string | null) => Promise<void>;
  onGroupChange: (studentId: string, groupId: string | null) => Promise<void>;
  onCenterChange: (studentId: string, centerId: string | null) => Promise<void>;
  teacherOptions: Array<{ id: string; label: string }>;
  groupOptions: Array<{ id: string; label: string }>;
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
  onTeacherChange,
  onGroupChange,
  onCenterChange,
  teacherOptions,
  groupOptions,
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
    onTeacherChange,
    onGroupChange,
    onCenterChange,
    teacherOptions,
    groupOptions,
    centerOptions,
    isDeleting: isDeleting || isUpdating,
    isUpdating,
    isLoading,
  });

  return (
    <>
      {/* Students Table */}
      <DataTable
        columns={studentColumns}
        data={students}
        keyExtractor={(student) => student.id}
        isLoading={isLoading}
        emptyMessage={searchQuery ? "No students match your search" : "No students found"}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={onSort}
      />

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          Showing {Math.min(page * pageSize + 1, totalStudents)}-{Math.min((page + 1) * pageSize, totalStudents)} of {totalStudents} students
        </span>
        <div className="flex items-center gap-2">
          <button 
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50" 
            disabled={page === 0 || isDeleting || isUpdating}
            onClick={() => onPageChange(Math.max(0, page - 1))}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span>Page {page + 1} of {totalPages || 1}</span>
          <button 
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50"
            disabled={page >= totalPages - 1 || isDeleting || isUpdating}
            onClick={() => onPageChange(page + 1)}
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

