'use client';

import { List, LayoutGrid } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { FilterDropdown } from '@/shared/components/ui/filter-dropdown';
import { cn } from '@/shared/lib/utils';
import type { useTranslations } from 'next-intl';

interface TeachersFiltersProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | '';
  onStatusChange: (status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | '') => void;
  selectedBranchIds: Set<string>;
  onBranchFilterChange: (selectedIds: Set<string>) => void;
  viewMode: 'list' | 'board';
  onViewModeChange: (mode: 'list' | 'board') => void;
  onAddTeacher: () => void;
  centersData?: Array<{ id: string; name: string }>;
  isLoadingCenters: boolean;
  centersError: unknown;
  t: ReturnType<typeof useTranslations<'teachers'>>;
  tCommon: ReturnType<typeof useTranslations<'common'>>;
  tStatus: ReturnType<typeof useTranslations<'status'>>;
  isDeleting: boolean;
}

export function TeachersFilters({
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedBranchIds,
  onBranchFilterChange,
  viewMode,
  onViewModeChange,
  onAddTeacher,
  centersData,
  isLoadingCenters,
  centersError,
  t,
  tCommon,
  tStatus,
  isDeleting,
}: TeachersFiltersProps) {
  return (
    <div className="flex items-end gap-4">
      {/* Search by Keywords */}
      <div className="flex-1">
        <label className="block text-sm font-medium text-slate-500 mb-1.5">
          Search by Keywords
        </label>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="search"
            placeholder="Search teachers by name, email or group..."
            value={searchQuery}
            onChange={onSearchChange}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex-shrink-0">
        <label className="block text-sm font-medium text-slate-500 mb-1.5">
          Status
        </label>
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | '')}
            className="pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer min-w-[160px]"
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">{tStatus('active')}</option>
            <option value="INACTIVE">{tStatus('inactive')}</option>
            <option value="SUSPENDED">{tStatus('suspended')}</option>
          </select>
          <svg 
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Center Filter */}
      <div className="flex-shrink-0">
        <FilterDropdown
          label={t('center')}
          options={(centersData || []).map(center => ({
            id: center.id,
            label: center.name,
          }))}
          selectedIds={selectedBranchIds}
          onSelectionChange={onBranchFilterChange}
          placeholder={tCommon('all')}
          isLoading={isLoadingCenters}
          error={centersError ? 'Failed to load centers' : null}
          className="w-[200px]"
        />
      </div>

      {/* View Mode Toggle */}
      <div className="inline-flex rounded-lg border-2 border-slate-300 bg-white p-1 shadow-sm">
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
      </div>

      {/* Add Teacher Button */}
      <div className="flex-shrink-0">
        <Button 
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium flex items-center gap-2"
          onClick={onAddTeacher}
          disabled={isDeleting}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          {t('addTeacher')}
        </Button>
      </div>
    </div>
  );
}

