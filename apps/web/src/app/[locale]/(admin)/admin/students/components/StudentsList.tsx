'use client';

import { useMemo, useRef } from 'react';
import { AdminListPagination, DataTable } from '@/shared/components/ui';
import { scrollListStartSoon } from '@/shared/lib/scroll-element-to-list-start';
import { createStudentsTableColumns } from './StudentsTableColumns';
import { StudentsCentersStrip } from './StudentsCentersStrip';
import { getItemId, isOnboardingItem, type TeacherAssignedItem, type Student } from '@/features/students';
import type { Group } from '@/features/groups';
import type { Center } from '@ilona/types';
import { useTranslations as useTranslationsRuntime, type useTranslations } from 'next-intl';

type StripCenter = Pick<Center, 'id' | 'name'> & { colorHex?: string | null };

interface StudentsListProps {
  centers: StripCenter[];
  studentsByCenter: Record<string, TeacherAssignedItem[]>;
  activeCenterTabId: string | null;
  onSelectCenter: (centerId: string) => void;
  uniqueStudentsCount: number;
  onTotalClick?: () => void;
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
  onDelete?: (student: Student) => void;
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
  t: ReturnType<typeof useTranslations<'students'>>;
  tCommon: (key: string) => string;
  tTeachers: (key: string) => string;
  tAnalytics: (key: string) => string;
}

export function StudentsList({
  centers,
  studentsByCenter,
  activeCenterTabId,
  onSelectCenter,
  uniqueStudentsCount,
  onTotalClick,
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
  const tc = useTranslationsRuntime('common');
  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(0, page), safeTotalPages - 1);
  const hasStudents = totalStudents > 0;
  const listStartRef = useRef<HTMLDivElement | null>(null);

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

  const hasCenterTabs =
    isLoading ||
    centers.length > 0 ||
    (studentsByCenter.unassigned?.length || 0) > 0;

  const emptyMessage = useMemo(() => {
    if (searchQuery.trim()) {
      return t('noStudentsMatch');
    }
    if (hasCenterTabs) {
      if (activeCenterTabId === 'unassigned') {
        return t('noUnassignedStudents');
      }
      if (activeCenterTabId === 'all') {
        return t('noStudentsFound');
      }
      return t('noStudentsInCenter');
    }
    return t('noStudentsFound');
  }, [searchQuery, hasCenterTabs, activeCenterTabId, t]);

  return (
    <div ref={listStartRef} className="mb-6 overflow-hidden rounded-2xl border bg-white shadow-sm">
      <StudentsCentersStrip
        centers={centers}
        studentsByCenter={studentsByCenter}
        activeCenterTabId={activeCenterTabId}
        onSelectCenter={onSelectCenter}
        uniqueStudentsCount={uniqueStudentsCount}
        isLoading={isLoading}
        onTotalClick={onTotalClick}
        t={t}
        unassignedLabel={tc('unassigned')}
      />
      <DataTable
        columns={studentColumns}
        data={students}
        keyExtractor={(student) => getItemId(student)}
        onRowClick={(student) => {
          if (isOnboardingItem(student)) return;
          onView(student);
        }}
        isLoading={isLoading}
        emptyMessage={emptyMessage}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={onSort}
        compact
        embedInParentCard={hasCenterTabs}
      />
      <AdminListPagination
        page={safePage}
        pageSize={pageSize}
        totalItems={totalStudents}
        onPageChange={(nextPage) => {
          onPageChange(nextPage);
          scrollListStartSoon(listStartRef.current);
        }}
        previousLabel={tCommon('previousPage')}
        nextLabel={tCommon('nextPage')}
        disabled={isDeleting || isUpdating || !hasStudents}
        hideWhenSinglePage={false}
        withFooter
      />
    </div>
  );
}
