'use client';

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
  selectedCenterIds: Set<string>;
  onCenterChange: (ids: Set<string>) => void;
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
  centerFilterOptions: Array<{ id: string; label: string }>;
  isLoadingTeachers: boolean;
  isLoadingCenters: boolean;
  isDeleting: boolean;
  t: (key: string) => string;
  now: Date;
}

export function StudentsFilters({
  searchQuery,
  onSearchChange,
  selectedStatusIds,
  onStatusChange,
  selectedTeacherIds,
  onTeacherChange,
  selectedCenterIds,
  onCenterChange,
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
  centerFilterOptions,
  isLoadingTeachers,
  isLoadingCenters,
  isDeleting,
  t,
  now,
}: StudentsFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={onSearchChange}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        {selectedStudentIds.size > 0 && (
          <Button
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium"
            onClick={onBulkDelete}
            disabled={isDeleting}
          >
            Delete All ({selectedStudentIds.size})
          </Button>
        )}
        {/* View Mode Toggle */}
        <div className="inline-flex rounded-lg border-2 border-slate-300 bg-white p-1 shadow-sm">
          <button
            onClick={() => onViewModeChange('list')}
            className={cn(
              'px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center gap-2',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              viewMode === 'list'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-slate-700 hover:bg-slate-100'
            )}
            aria-pressed={viewMode === 'list'}
          >
            <List className="w-4 h-4" />
            List
          </button>
          <button
            onClick={() => onViewModeChange('board')}
            className={cn(
              'px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center gap-2',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              viewMode === 'board'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-slate-700 hover:bg-slate-100'
            )}
            aria-pressed={viewMode === 'board'}
          >
            <LayoutGrid className="w-4 h-4" />
            Board
          </button>
        </div>
        <Button 
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-medium"
          onClick={onAddStudent}
        >
          + {t('addStudent')}
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <FilterDropdown
          label="Status"
          options={statusFilterOptions}
          selectedIds={selectedStatusIds}
          onSelectionChange={onStatusChange}
          placeholder="All Statuses"
        />
        <FilterDropdown
          label="Teacher"
          options={teacherFilterOptions}
          selectedIds={selectedTeacherIds}
          onSelectionChange={onTeacherChange}
          placeholder="All Teachers"
          isLoading={isLoadingTeachers}
        />
        <FilterDropdown
          label="Center"
          options={centerFilterOptions}
          selectedIds={selectedCenterIds}
          onSelectionChange={onCenterChange}
          placeholder="All Centers"
          isLoading={isLoadingCenters}
        />
        {/* Month Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Month</label>
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(Number(e.target.value))}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value={1}>January</option>
            <option value={2}>February</option>
            <option value={3}>March</option>
            <option value={4}>April</option>
            <option value={5}>May</option>
            <option value={6}>June</option>
            <option value={7}>July</option>
            <option value={8}>August</option>
            <option value={9}>September</option>
            <option value={10}>October</option>
            <option value={11}>November</option>
            <option value={12}>December</option>
          </select>
        </div>
        {/* Year Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Year</label>
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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

