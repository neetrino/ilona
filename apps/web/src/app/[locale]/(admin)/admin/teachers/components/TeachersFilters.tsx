'use client';

import { Button, ListBoardViewToggle } from '@/shared/components/ui';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import { cn } from '@/shared/lib/utils';
import type { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useTranslations as useTranslationsRuntime } from 'next-intl';
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
}

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
}: TeachersFiltersProps) {
  const locale = useLocale();
  const tCommon = useTranslationsRuntime('common');
  const tGroups = useTranslationsRuntime('groups');
  const statusOptions = [
    { id: '', label: t('allStatuses') },
    { id: 'ACTIVE', label: tStatus('active') },
    { id: 'INACTIVE', label: tStatus('inactive') },
    { id: 'SUSPENDED', label: tStatus('suspended') },
  ];
  const isLg = useIsLgViewport();
  const toolbarControlClass = 'h-11 min-h-11 rounded-[15px]';

  useEffect(() => {
    if (isLg === false && viewMode !== 'board') {
      onViewModeChange('board');
    }
  }, [isLg, onViewModeChange, viewMode]);

  return (
    <div className="space-y-4 w-full min-w-0">
      <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      {/* Search and Status - equal width in one row */}
      <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
      {/* Search by Keywords */}
      <div className="min-w-0">
        <label className="mb-1.5 block text-sm font-medium text-[#8b8b90]">
          {tCommon('search')}
        </label>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8b8b90]"
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
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={onSearchChange}
            className={cn(
              'w-full border border-[rgba(14,14,16,0.07)] bg-white py-0 pl-10 pr-4 text-sm focus:border-[#1010a3] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20',
              toolbarControlClass,
            )}
          />
        </div>
      </div>

      {/* Status Filter */}
      <div className="min-w-0">
        <SingleSelectDropdown
          id="teachers-status-filter"
          label={tCommon('status')}
          options={statusOptions}
          value={selectedStatus}
          onValueChange={(nextValue) => {
            onStatusChange((nextValue ?? '') as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | '');
          }}
          triggerClassName={toolbarControlClass}
        />
      </div>

      </div>

      {isLg ? (
        <div className="flex w-full shrink-0 items-center gap-3 sm:w-auto">
          <ListBoardViewToggle
            value={viewMode}
            onChange={onViewModeChange}
            listLabel={tGroups('listView')}
            boardLabel={tGroups('boardView')}
            className={cn(toolbarControlClass, 'w-full sm:w-auto')}
          />
          <Button
            size="lg"
            className={cn(
              toolbarControlClass,
              'whitespace-nowrap px-4 py-0 text-sm font-medium bg-[#1010a3] text-white hover:bg-[#1010a3]/90',
            )}
            onClick={onAddTeacher}
            disabled={isDeleting}
          >
            + {t('addTeacher')}
          </Button>
        </div>
      ) : null}

      {/* Add Teacher Button (mobile + tablet) */}
      {!isLg ? (
        <div className="w-full shrink-0">
          <div className="hidden w-full items-center justify-end gap-3 tablet:flex">
            <Button
              size="lg"
              className={cn(
                toolbarControlClass,
                'whitespace-nowrap px-4 py-0 text-sm font-medium bg-[#1010a3] text-white hover:bg-[#1010a3]/90',
              )}
              onClick={onAddTeacher}
              disabled={isDeleting}
            >
              + {t('addTeacher')}
            </Button>
          </div>
          <Button
            className={cn(
              toolbarControlClass,
              'flex w-full items-center justify-center gap-2 px-4 py-0 font-medium bg-[#1010a3] text-white hover:bg-[#1010a3]/90 tablet:hidden',
            )}
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
            <span className={locale === 'hy' ? 'text-sm' : 'text-base'}>{t('addTeacher')}</span>
          </Button>
        </div>
      ) : null}
      </div>

    </div>
  );
}

