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
  onView: (teacher: Teacher) => void;
  onEdit: (teacher: Teacher) => void;
  onDelete: (teacher: Teacher) => void;
  onDeactivate: (teacher: Teacher) => void;
  onCenterChange: (teacherId: string, centerId: string | null) => Promise<void>;
  onOpenGroupsModal: (teacher: Teacher, tab: 'groups' | 'subgroups') => void;
  isLoading: boolean;
  isDeleting: boolean;
  isUpdating: boolean;
  searchQuery: string;
  centerOptions: Array<{ id: string; label: string }>;
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
  onView,
  onEdit,
  onDelete,
  onDeactivate,
  onCenterChange,
  onOpenGroupsModal,
  isLoading,
  isDeleting,
  isUpdating,
  searchQuery,
  centerOptions,
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
    onView,
    onEdit,
    onDelete,
    onDeactivate,
    onCenterChange,
    onOpenGroupsModal,
    isDeleting: isDeleting || isUpdating,
    isUpdating,
    isLoading,
    centerOptions,
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

