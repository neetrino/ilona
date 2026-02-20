'use client';

import { useState, useEffect, useRef } from 'react';

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
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const onSearchChangeRef = useRef(onSearchChange);

  // Keep ref updated
  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  }, [onSearchChange]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChangeRef.current(localSearchQuery);
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
    <div className="flex items-center gap-4">
      {/* Search Input */}
      <div className="flex-1 relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          value={localSearchQuery}
          onChange={(e) => setLocalSearchQuery(e.target.value)}
          placeholder="Search lessons by keyword, group, or teacher..."
          className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        {localSearchQuery && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 hover:text-slate-600"
            aria-label="Clear search"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Teacher Filter */}
      <div className="relative">
        <select
          value={selectedTeacherId}
          onChange={(e) => onTeacherChange(e.target.value)}
          disabled={isLoadingTeachers}
          className="pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer min-w-[180px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">All teachers</option>
          {teacherOptions.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.label}
            </option>
          ))}
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
  );
}
