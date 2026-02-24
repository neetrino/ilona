'use client';

import { Skeleton } from '@/shared/components/ui/Skeleton';

interface AttendanceLoadingStateProps {
  isLoadingAttendance: boolean;
}

/** Approximate grid skeleton: 6 lesson columns, 8 student rows */
const SKELETON_COLS = 6;
const SKELETON_ROWS = 8;

export function AttendanceLoadingState({ isLoadingAttendance }: AttendanceLoadingStateProps) {
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
        <p className="text-center text-sm text-muted-foreground">Loading attendance records...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-12">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
        <p className="mt-4 text-sm text-slate-500">Loading lessons...</p>
      </div>
    </div>
  );
}






