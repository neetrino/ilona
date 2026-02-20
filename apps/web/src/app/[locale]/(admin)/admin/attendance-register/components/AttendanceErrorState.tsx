'use client';

export function AttendanceErrorState() {
  return (
    <div className="text-center p-12">
      <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-red-600 mb-1">Error loading attendance data</p>
      <p className="text-xs text-slate-500">Please try again or contact support if the problem persists</p>
    </div>
  );
}




