'use client';

import { useState, useEffect, useRef, startTransition } from 'react';
import { useTranslations } from 'next-intl';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import { MultiSelectChipsDropdown } from '@/shared/components/ui/multi-select-chips-dropdown';
import { ADMIN_CONTROL_CLASS, ADMIN_SEARCH_INPUT_CLASS } from '@/shared/lib/admin-control-theme';
import { cn } from '@/shared/lib/utils';
import type { DailyDutiesStatusFilter } from '@/shared/lib/daily-duties/filter-by-daily-duties-status';
import { DAILY_DUTIES_STATUS_FILTER_OPTIONS } from '@/shared/lib/daily-duties/DailyDutiesLessonStatusBadge';
import type { DailyDutiesLessonStatus } from '@ilona/types';

interface DailyDutiesFiltersProps {
  searchQuery: string;
  selectedTeacherIds: Set<string>;
  selectedStatus: DailyDutiesStatusFilter;
  teacherOptions: Array<{ id: string; label: string }>;
  isLoadingTeachers?: boolean;
  onSearchChange: (value: string) => void;
  onTeacherChange: (teacherIds: Set<string>) => void;
  onStatusChange: (status: DailyDutiesStatusFilter) => void;
  hideTeacherFilter?: boolean;
}

export function DailyDutiesFilters({
  searchQuery,
  selectedTeacherIds,
  selectedStatus,
  teacherOptions,
  isLoadingTeachers = false,
  onSearchChange,
  onTeacherChange,
  onStatusChange,
  hideTeacherFilter = false,
}: DailyDutiesFiltersProps) {
  const t = useTranslations('dailyDuties');
  const tc = useTranslations('common');
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const onSearchChangeRef = useRef(onSearchChange);

  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  }, [onSearchChange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        onSearchChangeRef.current(localSearchQuery);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchQuery]);

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  const handleClearSearch = () => {
    setLocalSearchQuery('');
    onSearchChange('');
  };

  const teacherSelectOptions = teacherOptions;

  const statusLabel = (status: DailyDutiesLessonStatus): string => {
    const keys: Record<DailyDutiesLessonStatus, `lessonStatus.${string}`> = {
      DONE: 'lessonStatus.done',
      CAUTION: 'lessonStatus.caution',
      IN_PROGRESS: 'lessonStatus.inProgress',
      WAITING: 'lessonStatus.waiting',
    };
    return t(keys[status]);
  };

  const statusSelectOptions = [
    { id: '', label: t('allStatuses') },
    ...DAILY_DUTIES_STATUS_FILTER_OPTIONS.map((status) => ({
      id: status,
      label: statusLabel(status),
    })),
  ];

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
      <div className="relative min-w-0 flex-1 lg:max-w-md">
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
          value={localSearchQuery}
          onChange={(e) => setLocalSearchQuery(e.target.value)}
          placeholder={t('searchLessonsPlaceholder')}
          className={ADMIN_SEARCH_INPUT_CLASS}
        />
        {localSearchQuery ? (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8b8b90] hover:text-[#3b3b40]"
            aria-label={tc('search')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : null}
      </div>

      <div className="flex w-full shrink-0 flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
        <div className="w-full sm:min-w-[10.5rem] sm:w-auto">
          <SingleSelectDropdown
            id="daily-duties-status-filter"
            options={statusSelectOptions}
            value={selectedStatus}
            onValueChange={(nextValue) => onStatusChange((nextValue ?? '') as DailyDutiesStatusFilter)}
            className="sm:min-w-[10.5rem]"
            triggerClassName={ADMIN_CONTROL_CLASS}
          />
        </div>

        {!hideTeacherFilter ? (
          <div className="w-full sm:w-auto">
            <MultiSelectChipsDropdown
              options={teacherSelectOptions}
              selectedIds={selectedTeacherIds}
              onSelectionChange={onTeacherChange}
              placeholder={t('allTeachers')}
              searchPlaceholder={t('searchTeachers')}
              noResultsHint={t('noTeachersFound')}
              isLoading={isLoadingTeachers}
              closedTriggerMode="summary"
              fitContentWidth
              triggerClassName={cn(ADMIN_CONTROL_CLASS, 'px-4 py-0 items-center')}
              selectedCountLabel={(count) => t('teachersSelected', { count })}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
