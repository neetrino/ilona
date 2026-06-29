'use client';

import { useMemo } from 'react';
import { DataTable } from '@/shared/components/ui';
import { createTeachersTableColumns } from './TeachersTableColumns';
import { TeachersCentersStrip } from './TeachersCentersStrip';
import type { Teacher } from '@/features/teachers';
import type { Center } from '@ilona/types';
import { useTranslations as useTranslationsRuntime, type useTranslations } from 'next-intl';
import { useIsIPad } from '@/shared/hooks/useIsIPad';

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
  onCenterChange: (teacherId: string, centerId: string | null) => Promise<void>;
  onOpenGroupsModal: (teacher: Teacher, tab: 'groups' | 'subgroups') => void;
  isLoading: boolean;
  isDeleting: boolean;
  isUpdating: boolean;
  page: number;
  totalPages: number;
  totalTeachers: number;
  onPageChange: (page: number) => void;
  searchQuery: string;
  centerOptions: Array<{ id: string; label: string }>;
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
  const isIPad = useIsIPad();
  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(0, page), safeTotalPages - 1);
  const hasTeachers = totalTeachers > 0;
  const showingStart = hasTeachers ? safePage * PAGE_SIZE + 1 : 0;
  const showingEnd = hasTeachers ? Math.min((safePage + 1) * PAGE_SIZE, totalTeachers) : 0;
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
    />
  );

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border bg-white shadow-sm">
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
      <div className="border-t border-[rgba(14,14,16,0.07)] px-4 py-3 sm:px-5">
        <div className={`flex items-center text-sm text-[#8b8b90] ${isIPad ? 'justify-start gap-4' : 'justify-between lg:justify-start lg:gap-4'}`}>
          <span>
            {t('showing', {
              start: showingStart,
              end: showingEnd,
              total: totalTeachers,
            })}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                safePage === 0 || isDeleting || isUpdating || !hasTeachers
                  ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
                  : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]'
              }`}
              disabled={safePage === 0 || isDeleting || isUpdating || !hasTeachers}
              onClick={() => onPageChange(Math.max(0, safePage - 1))}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-[#1010a3] px-3 text-xs font-semibold text-white">
              {hasTeachers ? safePage + 1 : 0}
            </span>
            <button
              type="button"
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                safePage >= safeTotalPages - 1 || isDeleting || isUpdating || !hasTeachers
                  ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
                  : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]'
              }`}
              disabled={safePage >= safeTotalPages - 1 || isDeleting || isUpdating || !hasTeachers}
              onClick={() => onPageChange(Math.min(safeTotalPages - 1, safePage + 1))}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

