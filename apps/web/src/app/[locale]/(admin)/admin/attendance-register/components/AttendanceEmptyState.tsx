'use client';

import { formatDateDisplay } from '@/features/attendance/utils/dateUtils';

interface AttendanceEmptyStateProps {
  date?: Date;
  dateString?: string;
  message?: string;
}

export function AttendanceEmptyState({ date, dateString, message }: AttendanceEmptyStateProps) {
  const displayDate = date ? formatDateDisplay(date) : dateString || 'this date';
  
  return (
    <div className="text-center p-12">
      <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-slate-600 mb-1">{message || 'No lessons found'}</p>
      <p className="text-xs text-slate-500">
        {message ? '' : `No lessons scheduled for ${displayDate}`}
      </p>
    </div>
  );
}

