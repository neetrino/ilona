'use client';

import { useState, useEffect, useRef, startTransition } from 'react';
import { useTranslations } from 'next-intl';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import { ADMIN_CONTROL_CLASS, ADMIN_SEARCH_INPUT_CLASS } from '@/shared/lib/admin-control-theme';

interface CalendarFiltersProps {
  searchQuery: string;
  selectedTeacherId: string;
  teacherOptions: Array<{ id: string; label: string }>;
  isLoadingTeachers?: boolean;
  onSearchChange: (value: string) => void;
  onTeacherChange: (teacherId: string) => void;
  hideTeacherFilter?: boolean;
}

export function CalendarFilters({
  searchQuery,
  selectedTeacherId,
  teacherOptions,
  isLoadingTeachers = false,
  onSearchChange,
  onTeacherChange,
  hideTeacherFilter = false,
}: CalendarFiltersProps) {
  const t = useTranslations('calendar');
  const tc = useTranslations('common');
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const onSearchChangeRef = useRef(onSearchChange);

  // Keep ref updated
  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  }, [onSearchChange]);

  // Debounce search input. Use startTransition to avoid "setTimeout handler took Xms" violations.
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        onSearchChangeRef.current(localSearchQuery);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchQuery]);

  // Sync with external searchQuery changes (e.g., from URL)
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  const handleClearSearch = () => {
    setLocalSearchQuery('');
    onSearchChange('');
  };
  const teacherSelectOptions = [
    { id: '', label: t('allTeachers') },
    ...teacherOptions,
  ];

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      {/* Search Input */}
      <div className="relative min-w-0 flex-1">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8b8b90]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          value={localSearchQuery}
          onChange={(e) => setLocalSearchQuery(e.target.value)}
          placeholder={t('searchLessonsPlaceholder')}
          className={ADMIN_SEARCH_INPUT_CLASS}
        />
        {localSearchQuery && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8b8b90] hover:text-[#3b3b40]"
            aria-label={tc('search')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {!hideTeacherFilter ? (
        <div className="w-full shrink-0 sm:w-auto sm:min-w-[11rem]">
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
  );
}
