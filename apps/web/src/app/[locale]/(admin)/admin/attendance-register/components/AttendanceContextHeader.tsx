'use client';

import { cn } from '@/shared/lib/utils';
import { formatDateDisplay, formatWeekRange } from '@/features/attendance/utils/dateUtils';
import type { Group } from '@/features/groups';

interface AttendanceContextHeaderProps {
  group: Group | null;
  date?: Date;
  weekRange?: string;
  viewMode: 'day' | 'week' | 'month';
  lessonsCount: number;
  studentsCount: number;
  hasUnsavedChanges: boolean;
  isCurrentDateToday?: boolean;
}

export function AttendanceContextHeader({
  group,
  date,
  weekRange,
  viewMode,
  lessonsCount,
  studentsCount,
  hasUnsavedChanges,
  isCurrentDateToday,
}: AttendanceContextHeaderProps) {
  return (
    <div className="mb-6 pb-4 border-b-2 border-slate-200">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Group:</span>
              <span className="text-xl font-bold text-slate-900">{group?.name || 'N/A'}</span>
              {group?.level && (
                <span className="text-sm font-medium text-slate-600">({group.level})</span>
              )}
            </div>
            <div className="h-6 w-px bg-slate-300"></div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {viewMode === 'week' ? 'Week:' : 'Date:'}
              </span>
              <span className="text-xl font-bold text-slate-900">
                {viewMode === 'week' ? weekRange : date ? formatDateDisplay(date) : 'N/A'}
              </span>
              {isCurrentDateToday && viewMode === 'day' && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-primary/20 text-primary rounded-full">Today</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <span>
              <span className="font-semibold">{lessonsCount}</span> {lessonsCount === 1 ? 'session' : 'sessions'}
            </span>
            <span>•</span>
            <span>
              <span className="font-semibold">{studentsCount}</span> {studentsCount === 1 ? 'student' : 'students'}
            </span>
          </div>
        </div>
        {hasUnsavedChanges && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 border-2 border-amber-400 rounded-lg">
            <div className="h-2 w-2 rounded-full bg-amber-600 animate-pulse"></div>
            <span className="text-sm font-semibold text-amber-800">Unsaved Changes</span>
          </div>
        )}
      </div>
    </div>
  );
}


