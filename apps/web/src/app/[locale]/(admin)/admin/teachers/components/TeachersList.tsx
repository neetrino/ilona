'use client';

import { DataTable } from '@/shared/components/ui';
import { createTeachersTableColumns } from './TeachersTableColumns';
import type { Teacher } from '@/features/teachers';
import type { useTranslations } from 'next-intl';

interface TeachersListProps {
  teachers: Teacher[];
  sortBy: string | undefined;
  sortOrder: 'asc' | 'desc';
  onSort: (key: string) => void;
  onRowClick: (teacher: Teacher) => void;
  allSelected: boolean;
  someSelected: boolean;
  selectedTeacherIds: Set<string>;
  onSelectAll: () => void;
  onToggleSelect: (teacherId: string) => void;
  onEdit: (teacher: Teacher) => void;
  onDelete: (teacher: Teacher) => void;
  onDeactivate: (teacher: Teacher) => void;
  isLoading: boolean;
  isDeleting: boolean;
  isUpdating: boolean;
  searchQuery: string;
  t: ReturnType<typeof useTranslations<'teachers'>>;
  tCommon: ReturnType<typeof useTranslations<'common'>>;
  tStatus: ReturnType<typeof useTranslations<'status'>>;
}

export function TeachersList({
  teachers,
  sortBy,
  sortOrder,
  onSort,
  onRowClick,
  allSelected,
  someSelected,
  selectedTeacherIds,
  onSelectAll,
  onToggleSelect,
  onEdit,
  onDelete,
  onDeactivate,
  isLoading,
  isDeleting,
  isUpdating,
  searchQuery,
  t,
  tCommon,
  tStatus,
}: TeachersListProps) {
  const teacherColumns = createTeachersTableColumns({
    t,
    tCommon,
    tStatus,
    allSelected,
    someSelected,
    selectedTeacherIds,
    onSelectAll,
    onToggleSelect,
    onEdit,
    onDelete,
    onDeactivate,
    isDeleting: isDeleting || isUpdating,
    isUpdating,
    isLoading,
  });

  return (
    <>
      {/* Teachers Table */}
      <DataTable
        columns={teacherColumns}
        data={teachers}
        keyExtractor={(teacher) => teacher.id}
        isLoading={isLoading}
        emptyMessage={searchQuery ? t('noTeachersMatch') : t('noTeachersFound')}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={onSort}
        onRowClick={onRowClick}
      />

    </>
  );
}

