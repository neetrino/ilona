'use client';

import { useTranslations } from 'next-intl';
import { Button, FilterDropdown, ListBoardViewToggle } from '@/shared/components/ui';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import { useEffect } from 'react';
import { useIsLgViewport } from '@/shared/hooks/useIsLgViewport';

interface StudentsFiltersProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedStatusIds: Set<string>;
  onStatusChange: (ids: Set<string>) => void;
  selectedTeacherIds: Set<string>;
  onTeacherChange: (ids: Set<string>) => void;
  selectedGroupIds: Set<string>;
  onGroupChange: (ids: Set<string>) => void;
  selectedLifecycleIds: Set<string>;
  onLifecycleChange: (ids: Set<string>) => void;
  selectedMonth: number;
  onMonthChange: (month: number) => void;
  selectedYear: number;
  onYearChange: (year: number) => void;
  viewMode: 'list' | 'board';
  onViewModeChange: (mode: 'list' | 'board') => void;
  onAddStudent: () => void;
  selectedStudentIds: Set<string>;
  onBulkDelete: () => void;
  statusFilterOptions: Array<{ id: string; label: string }>;
  teacherFilterOptions: Array<{ id: string; label: string }>;
  groupFilterOptions: Array<{ id: string; label: string }>;
  lifecycleFilterOptions: Array<{ id: string; label: string }>;
  isLoadingTeachers: boolean;
  isDeleting: boolean;
  now: Date;
}

export function StudentsFilters({
  searchQuery,
  onSearchChange,
  selectedStatusIds,
  onStatusChange,
  selectedTeacherIds,
  onTeacherChange,
  selectedGroupIds,
  onGroupChange,
  selectedLifecycleIds,
  onLifecycleChange,
  selectedMonth,
  onMonthChange,
  selectedYear,
  onYearChange,
  viewMode,
  onViewModeChange,
  onAddStudent,
  selectedStudentIds,
  onBulkDelete,
  statusFilterOptions,
  teacherFilterOptions,
  groupFilterOptions,
  lifecycleFilterOptions,
  isLoadingTeachers,
  isDeleting,
  now,
}: StudentsFiltersProps) {
  const t = useTranslations('students');
  const tc = useTranslations('common');
  const monthKeys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
  const monthOptions = monthKeys.map((month) => ({
    id: String(month),
    label: tc(`months.${month}`),
  }));
  const isLg = useIsLgViewport();

  useEffect(() => {
    if (isLg === false && viewMode !== 'board') {
      onViewModeChange('board');
    }
  }, [isLg, onViewModeChange, viewMode]);

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = now.getFullYear() - 2 + i;
    return { id: String(year), label: String(year) };
  });

  return (
    <div className="w-full min-w-0 space-y-4">
      <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-0 flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8b8b90]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={onSearchChange}
            className="w-full pl-10 pr-4 py-3 bg-white border border-[rgba(14,14,16,0.07)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20 focus:border-[#1010a3]"
          />
        </div>
        {selectedStudentIds.size > 0 && (
          <Button
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium"
            onClick={onBulkDelete}
            disabled={isDeleting}
          >
            {t('deleteAll', { count: selectedStudentIds.size })}
          </Button>
        )}
        {isLg ? (
          <ListBoardViewToggle
            value={viewMode}
            onChange={onViewModeChange}
            listLabel={t('listView')}
            boardLabel={t('boardView')}
            className="w-full shrink-0 sm:w-auto"
          />
        ) : null}
        <Button 
          className="w-full shrink-0 rounded-xl bg-[#1010a3] px-6 py-3 font-medium text-white hover:bg-[#1010a3]/90 sm:w-auto"
          onClick={onAddStudent}
        >
          + {t('addStudent')}
        </Button>
      </div>

      {/* Filters */}
      <div className="grid w-full min-w-0 grid-cols-1 gap-3 items-end sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))]">
        <FilterDropdown
          label={t('statusFilter')}
          options={statusFilterOptions}
          selectedIds={selectedStatusIds}
          onSelectionChange={onStatusChange}
          placeholder={t('allStatuses')}
        />
        <FilterDropdown
          label={t('lifecycleFilter')}
          options={lifecycleFilterOptions}
          selectedIds={selectedLifecycleIds}
          onSelectionChange={onLifecycleChange}
          placeholder={tc('all')}
        />
        <FilterDropdown
          label={tc('teacher')}
          options={teacherFilterOptions}
          selectedIds={selectedTeacherIds}
          onSelectionChange={onTeacherChange}
          placeholder={t('allTeachers')}
          isLoading={isLoadingTeachers}
        />
        <FilterDropdown
          label={tc('group')}
          options={groupFilterOptions}
          selectedIds={selectedGroupIds}
          onSelectionChange={onGroupChange}
          placeholder={t('allGroups')}
        />
        <SingleSelectDropdown
          id="students-month-filter"
          label={tc('month')}
          options={monthOptions}
          value={String(selectedMonth)}
          onValueChange={(nextValue) => {
            if (nextValue) onMonthChange(Number(nextValue));
          }}
        />
        <SingleSelectDropdown
          id="students-year-filter"
          label={tc('year')}
          options={yearOptions}
          value={String(selectedYear)}
          onValueChange={(nextValue) => {
            if (nextValue) onYearChange(Number(nextValue));
          }}
        />
      </div>
    </div>
  );
}

