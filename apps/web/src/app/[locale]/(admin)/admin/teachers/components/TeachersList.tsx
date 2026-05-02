'use client';

import { useMemo } from 'react';
import { DataTable } from '@/shared/components/ui';
import { createTeachersTableColumns } from './TeachersTableColumns';
import { TeachersCentersStrip } from './TeachersCentersStrip';
import type { Teacher } from '@/features/teachers';
import type { Center } from '@ilona/types';
import type { useTranslations } from 'next-intl';

interface TeachersListProps {
  centers: Center[];
  teachersByCenter: Record<string, Teacher[]>;
  activeCenterTabId: string | null;
  onSelectCenter: (centerId: string) => void;
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
  centers,
  teachersByCenter,
  activeCenterTabId,
  onSelectCenter,
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

  const showCenterStrip =
    !isLoading &&
    (centers.length > 0 || (teachersByCenter.unassigned?.length || 0) > 0);

  const emptyMessage = useMemo(() => {
    if (searchQuery.trim()) {
      return t('noTeachersMatch');
    }
    if (showCenterStrip) {
      if (activeCenterTabId === 'unassigned') {
        return t('noUnassignedTeachers');
      }
      return t('noTeachersInThisCenter');
    }
    return t('noTeachersFound');
  }, [searchQuery, showCenterStrip, activeCenterTabId, t]);

  const table = (
    <DataTable
      columns={teacherColumns}
      data={teachers}
      keyExtractor={(teacher) => teacher.id}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
      onRowClick={onRowClick}
      embedInParentCard={showCenterStrip}
    />
  );

  if (!showCenterStrip) {
    return table;
  }

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
      <TeachersCentersStrip
        centers={centers}
        teachersByCenter={teachersByCenter}
        activeCenterTabId={activeCenterTabId}
        onSelectCenter={onSelectCenter}
      />
      {table}
    </div>
  );
}

