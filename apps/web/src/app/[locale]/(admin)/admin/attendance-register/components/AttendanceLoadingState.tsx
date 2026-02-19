'use client';

interface AttendanceLoadingStateProps {
  isLoadingAttendance: boolean;
}

export function AttendanceLoadingState({ isLoadingAttendance }: AttendanceLoadingStateProps) {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="mt-4 text-sm text-slate-500">
          {isLoadingAttendance ? 'Loading attendance records...' : 'Loading lessons...'}
        </p>
      </div>
    </div>
  );
}


