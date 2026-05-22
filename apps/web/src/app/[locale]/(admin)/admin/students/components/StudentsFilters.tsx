'use client';

import { useTranslations } from 'next-intl';
import { List, LayoutGrid } from 'lucide-react';
import { Button, FilterDropdown } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';

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
        {/* View Mode Toggle */}
        <div className="inline-flex w-full shrink-0 rounded-lg border-2 border-[rgba(14,14,16,0.12)] bg-white p-1 shadow-sm sm:w-auto">
          <button
            onClick={() => onViewModeChange('list')}
            className={cn(
              'px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center gap-2',
              'focus:outline-none focus:ring-2 focus:ring-[#1010a3] focus:ring-offset-2',
              viewMode === 'list'
                ? 'bg-[#1010a3] text-white shadow-md'
                : 'text-[#3b3b40] hover:bg-[#f6f6f7]'
            )}
            aria-pressed={viewMode === 'list'}
          >
            <List className="w-4 h-4" />
            {t('listView')}
          </button>
          <button
            onClick={() => onViewModeChange('board')}
            className={cn(
              'px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center gap-2',
              'focus:outline-none focus:ring-2 focus:ring-[#1010a3] focus:ring-offset-2',
              viewMode === 'board'
                ? 'bg-[#1010a3] text-white shadow-md'
                : 'text-[#3b3b40] hover:bg-[#f6f6f7]'
            )}
            aria-pressed={viewMode === 'board'}
          >
            <LayoutGrid className="w-4 h-4" />
            {t('boardView')}
          </button>
        </div>
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
        <div className="relative">
          <label className="block text-sm font-medium text-[#8b8b90] mb-1.5">{tc('month')}</label>
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(Number(e.target.value))}
            className="h-12 w-full appearance-none rounded-lg border border-[rgba(14,14,16,0.07)] bg-white px-4 text-left text-sm transition-colors hover:border-[rgba(14,14,16,0.12)] focus:border-[#1010a3]/45 focus:outline-none focus:ring-4 focus:ring-[#1010a3]/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {monthKeys.map((m) => (
              <option key={m} value={m}>
                {tc(`months.${m}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="relative">
          <label className="block text-sm font-medium text-[#8b8b90] mb-1.5">{tc('year')}</label>
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="h-12 w-full appearance-none rounded-lg border border-[rgba(14,14,16,0.07)] bg-white px-4 text-left text-sm transition-colors hover:border-[rgba(14,14,16,0.12)] focus:border-[#1010a3]/45 focus:outline-none focus:ring-4 focus:ring-[#1010a3]/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {Array.from({ length: 5 }, (_, i) => {
              const year = now.getFullYear() - 2 + i;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>
        </div>
      </div>
    </div>
  );
}

