'use client';

import { Button, ListBoardViewToggle } from '@/shared/components/ui';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import type { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useIsLgViewport } from '@/shared/hooks/useIsLgViewport';

interface TeachersFiltersProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | '';
  onStatusChange: (status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | '') => void;
  viewMode: 'list' | 'board';
  onViewModeChange: (mode: 'list' | 'board') => void;
  onAddTeacher: () => void;
  t: ReturnType<typeof useTranslations<'teachers'>>;
  tStatus: ReturnType<typeof useTranslations<'status'>>;
  isDeleting: boolean;
  // Pagination props
  page?: number;
  totalPages?: number;
  totalTeachers?: number;
  onPageChange?: (page: number) => void;
  isUpdating?: boolean;
}

const PAGE_SIZE = 10;

export function TeachersFilters({
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  viewMode,
  onViewModeChange,
  onAddTeacher,
  t,
  tStatus,
  isDeleting,
  page = 0,
  totalPages = 1,
  totalTeachers = 0,
  onPageChange,
  isUpdating = false,
}: TeachersFiltersProps) {
  const statusOptions = [
    { id: '', label: 'All statuses' },
    { id: 'ACTIVE', label: tStatus('active') },
    { id: 'INACTIVE', label: tStatus('inactive') },
    { id: 'SUSPENDED', label: tStatus('suspended') },
  ];
  const isLg = useIsLgViewport();

  useEffect(() => {
    if (isLg === false && viewMode !== 'board') {
      onViewModeChange('board');
    }
  }, [isLg, onViewModeChange, viewMode]);

  return (
    <div className="space-y-4 w-full min-w-0">
      <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      {/* Search and Status - equal width in one row */}
      <div className="grid grid-cols-1 gap-3 flex-1 min-w-0 sm:grid-cols-2 sm:gap-4">
      {/* Search by Keywords */}
      <div className="min-w-0">
        <label className="block text-sm font-medium text-[#8b8b90] mb-1.5">
          Search by Keywords
        </label>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8b8b90]"
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
            className="w-full h-12 pl-10 pr-4 py-3 bg-white border border-[rgba(14,14,16,0.07)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20 focus:border-[#1010a3]"
          />
        </div>
      </div>

      {/* Status Filter */}
      <div className="min-w-0">
        <SingleSelectDropdown
          id="teachers-status-filter"
          label="Status"
          options={statusOptions}
          value={selectedStatus}
          onValueChange={(nextValue) => {
            onStatusChange((nextValue ?? '') as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | '');
          }}
        />
      </div>

      </div>

      {isLg ? (
        <ListBoardViewToggle
          value={viewMode}
          onChange={onViewModeChange}
          listLabel="List"
          boardLabel="Board"
          className="w-full shrink-0 sm:w-auto"
        />
      ) : null}

      {/* Add Teacher Button */}
      <div className="w-full shrink-0 sm:w-auto">
        <Button 
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1010a3] px-6 py-3 font-medium text-white hover:bg-[#1010a3]/90 sm:w-auto"
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

      {/* Pagination - shown only in list view */}
      {viewMode === 'list' && onPageChange && (
        <div className="flex items-center justify-between text-sm text-[#8b8b90]">
          <span>
            {t('showing', {
              start: page * PAGE_SIZE + 1,
              end: Math.min((page + 1) * PAGE_SIZE, totalTeachers),
              total: totalTeachers
            })}
          </span>
          <div className="flex items-center gap-2">
            <button 
              className="p-2 rounded-lg hover:bg-[#f6f6f7] disabled:opacity-50" 
              disabled={page === 0 || isDeleting || isUpdating}
              onClick={() => onPageChange(Math.max(0, page - 1))}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span>{t('page', { current: page + 1, total: totalPages })}</span>
            <button 
              className="p-2 rounded-lg hover:bg-[#f6f6f7] disabled:opacity-50"
              disabled={page >= totalPages - 1 || isDeleting || isUpdating}
              onClick={() => onPageChange(page + 1)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

