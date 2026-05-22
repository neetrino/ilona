'use client';

import { useState, useEffect, useRef, startTransition } from 'react';
import { useTranslations } from 'next-intl';

interface CalendarFiltersProps {
  searchQuery: string;
  selectedTeacherId: string;
  teacherOptions: Array<{ id: string; label: string }>;
  isLoadingTeachers?: boolean;
  onSearchChange: (value: string) => void;
  onTeacherChange: (teacherId: string) => void;
}

export function CalendarFilters({
  searchQuery,
  selectedTeacherId,
  teacherOptions,
  isLoadingTeachers = false,
  onSearchChange,
  onTeacherChange,
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
          className="w-full pl-10 pr-10 py-3 bg-white border border-[rgba(14,14,16,0.07)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20 focus:border-[#1010a3]"
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

      {/* Teacher Filter */}
      <div className="group relative w-full shrink-0 sm:w-auto">
        <select
          value={selectedTeacherId}
          onChange={(e) => onTeacherChange(e.target.value)}
          disabled={isLoadingTeachers}
          className="unified-native-select h-11 w-full min-w-0 appearance-none rounded-xl border border-[rgba(14,14,16,0.12)] bg-gradient-to-b from-white to-[#f8f8fb] pl-4 pr-12 text-sm font-medium text-[#2f2f35] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 hover:border-[#1010a3]/30 hover:shadow-[0_4px_14px_rgba(16,16,163,0.08)] focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20 focus:border-[#1010a3] cursor-pointer sm:min-w-[11rem] sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">{t('allTeachers')}</option>
          {teacherOptions.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-1.5 right-1.5 flex w-8 items-center justify-center rounded-lg bg-[#f2f2fd] text-[#63638d] transition-colors duration-200 group-hover:bg-[#e9e9ff] group-focus-within:bg-[#e3e3ff]">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
