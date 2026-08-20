'use client';

import { useMemo, useRef } from 'react';
import { DataTable, AdminListPagination } from '@/shared/components/ui';
import { scrollListStartSoon } from '@/shared/lib/scroll-element-to-list-start';
import { createTeachersTableColumns } from './TeachersTableColumns';
import { TeachersCentersStrip } from './TeachersCentersStrip';
import type { Teacher } from '@/features/teachers';
import type { Center } from '@ilona/types';
import { useTranslations as useTranslationsRuntime, type useTranslations } from 'next-intl';

interface TeachersListProps {
  centers: Center[];
  teachersByCenter: Record<string, Teacher[]>;
  activeCenterTabId: string | null;
  onSelectCenter: (centerId: string) => void;
  uniqueTeachersCount: number;
  onTotalClick?: () => void;
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
  onCenterChange: (teacherId: string, centerIds: string[]) => Promise<void>;
  onOpenGroupsModal: (teacher: Teacher, tab: 'groups' | 'subgroups') => void;
  isLoading: boolean;
  isDeleting: boolean;
  isUpdating: boolean;
  page: number;
  totalPages: number;
  totalTeachers: number;
  onPageChange: (page: number) => void;
  searchQuery: string;
  centerOptions: Array<{ id: string; label: string; colorHex?: string | null }>;
  t: ReturnType<typeof useTranslations<'teachers'>>;
  tStatus: ReturnType<typeof useTranslations<'status'>>;
}

const PAGE_SIZE = 10;

export function TeachersList({
  centers,
  teachersByCenter,
  activeCenterTabId,
  onSelectCenter,
  uniqueTeachersCount,
  onTotalClick,
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
  onCenterChange,
  onOpenGroupsModal,
  isLoading,
  isDeleting,
  isUpdating,
  page,
  totalPages,
  totalTeachers,
  onPageChange,
  searchQuery,
  centerOptions,
  t,
  tStatus,
}: TeachersListProps) {
  const tc = useTranslationsRuntime('common');
  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(0, page), safeTotalPages - 1);
  const hasTeachers = totalTeachers > 0;
  const listStartRef = useRef<HTMLDivElement | null>(null);
  const teacherColumns = createTeachersTableColumns({
    t,
    tStatus,
    allSelected,
    someSelected,
    selectedTeacherIds,
    onSelectAll,
    onToggleSelect,
    onView,
    onCenterChange,
    onOpenGroupsModal,
    isDeleting: isDeleting || isUpdating,
    isUpdating,
    isLoading,
    centerOptions,
  });

  const hasCenterTabs =
    isLoading ||
    centers.length > 0 ||
    (teachersByCenter.unassigned?.length || 0) > 0;

  const emptyMessage = useMemo(() => {
    if (searchQuery.trim()) {
      return t('noTeachersMatch');
    }
    if (hasCenterTabs) {
      if (activeCenterTabId === 'unassigned') {
        return t('noUnassignedTeachers');
      }
      return t('noTeachersInThisCenter');
    }
    return t('noTeachersFound');
  }, [searchQuery, hasCenterTabs, activeCenterTabId, t]);

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
      embedInParentCard={hasCenterTabs}
      tableClassName="[&_tbody_td]:!py-4"
    />
  );

  return (
    <div ref={listStartRef} className="mb-6 overflow-hidden rounded-2xl border bg-white shadow-sm">
      <TeachersCentersStrip
        centers={centers}
        teachersByCenter={teachersByCenter}
        activeCenterTabId={activeCenterTabId}
        onSelectCenter={onSelectCenter}
        uniqueTeachersCount={uniqueTeachersCount}
        isLoading={isLoading}
        onTotalClick={onTotalClick}
        t={t}
        unassignedLabel={tc('unassigned')}
      />
      {table}
      <AdminListPagination
        page={safePage}
        pageSize={PAGE_SIZE}
        totalItems={totalTeachers}
        onPageChange={(nextPage) => {
          onPageChange(nextPage);
          scrollListStartSoon(listStartRef.current);
        }}
        previousLabel={tc('previousCardsPage')}
        nextLabel={tc('nextCardsPage')}
        disabled={isDeleting || isUpdating || !hasTeachers}
        hideWhenSinglePage={false}
        withFooter
      />
    </div>
  );
}

