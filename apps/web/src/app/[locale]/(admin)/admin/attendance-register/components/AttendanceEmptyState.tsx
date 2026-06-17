'use client';

import { formatDateDisplay } from '@/features/attendance/utils/dateUtils';
import { useTranslations } from 'next-intl';

interface AttendanceEmptyStateProps {
  date?: Date;
  dateString?: string;
  message?: string;
}

export function AttendanceEmptyState({ date, dateString, message }: AttendanceEmptyStateProps) {
  const t = useTranslations('attendance');
  const displayDate = date ? formatDateDisplay(date) : dateString || t('thisDate');
  const subtitle = message ? '' : t('noLessonsScheduledFor', { date: displayDate });
  
  return (
    <div className="py-6 text-center md:py-8">
      <div className="relative mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-[#f2f4ff]">
        <svg className="h-12 w-12 text-[#7d84a8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 3h5l5 5v13H8a2 2 0 01-2-2V5a2 2 0 012-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 3v5h5" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 13h4M10 17h4" />
        </svg>
        <span className="absolute left-[-8px] top-1/2 h-1 w-4 -translate-y-1/2 rounded-full bg-[#4f7cff]" />
        <span className="absolute right-[-8px] top-1/2 h-1 w-4 -translate-y-1/2 rounded-full bg-[#4f7cff]" />
        <span className="absolute left-4 top-6 text-[#c2c9de]">✧</span>
        <span className="absolute right-5 top-7 text-[#7b84ff]">✦</span>
        <span className="absolute bottom-7 left-7 text-[#c2c9de]">✧</span>
      </div>
      <p className="mb-6 text-[20px] font-semibold leading-tight tracking-[-0.02em] text-[#141b3b]">
        {message || t('noLessonsFound')}
      </p>
      {subtitle && <p className="text-[16px] leading-tight text-[#7f859d]">{subtitle}</p>}
    </div>
  );
}






