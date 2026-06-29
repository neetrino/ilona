'use client';

import { useState, useEffect, useRef, startTransition } from 'react';
import { useTranslations } from 'next-intl';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import { ADMIN_CONTROL_CLASS, ADMIN_SEARCH_INPUT_CLASS } from '@/shared/lib/admin-control-theme';
import type { DailyDutiesStatusFilter } from '@/shared/lib/daily-duties/filter-by-daily-duties-status';
import { DAILY_DUTIES_STATUS_FILTER_OPTIONS } from '@/shared/lib/daily-duties/DailyDutiesLessonStatusBadge';
import type { DailyDutiesLessonStatus } from '@ilona/types';

interface DailyDutiesFiltersProps {
  searchQuery: string;
  selectedTeacherId: string;
  selectedStatus: DailyDutiesStatusFilter;
  teacherOptions: Array<{ id: string; label: string }>;
  isLoadingTeachers?: boolean;
  onSearchChange: (value: string) => void;
  onTeacherChange: (teacherId: string) => void;
  onStatusChange: (status: DailyDutiesStatusFilter) => void;
  hideTeacherFilter?: boolean;
}

export function DailyDutiesFilters({
  searchQuery,
  selectedTeacherId,
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

  const teacherSelectOptions = [{ id: '', label: t('allTeachers') }, ...teacherOptions];

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
          <div className="w-full sm:min-w-[11rem] sm:w-auto">
            <SingleSelectDropdown
              id="calendar-teacher-filter"
              options={teacherSelectOptions}
              value={selectedTeacherId}
              onValueChange={(nextValue) => onTeacherChange(nextValue ?? '')}
              isLoading={isLoadingTeachers}
              className="sm:min-w-[11rem]"
              triggerClassName={ADMIN_CONTROL_CLASS}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
