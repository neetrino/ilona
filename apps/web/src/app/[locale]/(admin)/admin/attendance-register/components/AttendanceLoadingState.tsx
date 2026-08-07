'use client';

import { useTranslations } from 'next-intl';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';

interface AttendanceLoadingStateProps {
  isLoadingAttendance: boolean;
}

/** Approximate grid skeleton: 6 lesson columns, 8 student rows */
const SKELETON_COLS = 6;
const SKELETON_ROWS = 8;

export function AttendanceLoadingState({ isLoadingAttendance }: AttendanceLoadingStateProps) {
  const t = useTranslations('attendance');

  if (isLoadingAttendance) {
    return (
      <div className="space-y-2 p-4">
        <div className="flex gap-2">
          {/* Header row: student label + lesson columns */}
          <Skeleton className="h-8 w-32 shrink-0" />
          {Array.from({ length: SKELETON_COLS }).map((_, i) => (
            <Skeleton key={i} className="h-8 flex-1 min-w-[4rem]" />
          ))}
        </div>
        {Array.from({ length: SKELETON_ROWS }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex gap-2">
            <Skeleton className="h-10 w-32 shrink-0" />
            {Array.from({ length: SKELETON_COLS }).map((_, colIdx) => (
              <Skeleton key={colIdx} className="h-10 flex-1 min-w-[4rem]" />
            ))}
          </div>
        ))}
        <p className="text-center text-sm text-muted-foreground">{t('loadingAttendanceRecords')}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-12">
      <div className="text-center">
        <LoadingSpinner size="md" />
        <p className="mt-4 text-sm text-[#8b8b90]">{t('loadingLessons')}</p>
      </div>
    </div>
  );
}
