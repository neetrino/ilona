'use client';

import { useMemo } from 'react';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useStudentAttendance } from '@/features/attendance';
import { useMyProfile } from '@/features/students';
import { cn } from '@/shared/lib/utils';

function AbsenceTypeBadge({ type }: { type: 'JUSTIFIED' | 'UNJUSTIFIED' | null | undefined }) {
  if (!type) {
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
        Not Specified
      </span>
    );
  }

  const isJustified = type === 'JUSTIFIED';

  return (
    <span className={cn(
      'px-2 py-1 text-xs font-medium rounded-full',
      isJustified ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
    )}>
      {isJustified ? 'Justified' : 'Unjustified'}
    </span>
  );
}

export default function StudentAbsencePage() {
  // Get date range for last 3 months (memoized to prevent query key changes)
  const { dateFrom, dateTo } = useMemo(() => {
    const today = new Date();
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    return {
      dateFrom: threeMonthsAgo.toISOString(),
      dateTo: today.toISOString(),
    };
  }, []);

  // Fetch current student profile to get studentId
  const { data: studentProfile, isLoading: isLoadingProfile, error: profileError, refetch: refetchProfile } = useMyProfile();

  // Fetch attendance history using studentId
  const { 
    data: attendanceData, 
    isLoading: isLoadingAttendance, 
    error: attendanceError,
    refetch: refetchAttendance 
  } = useStudentAttendance(
    studentProfile?.id || '',
    dateFrom,
    dateTo,
    !!studentProfile?.id // Only enable when studentId is available
  );

  const isLoading = isLoadingProfile || isLoadingAttendance;
  const error = profileError || attendanceError;

  const handleRetry = () => {
    if (profileError) {
      refetchProfile();
    }
    if (attendanceError) {
      refetchAttendance();
    }
  };

  const statistics = attendanceData?.statistics || {
    total: 0,
    present: 0,
    absent: 0,
    absentJustified: 0,
    absentUnjustified: 0,
    attendanceRate: 0,
  };

  // Filter to only show absences
  const absences = (attendanceData?.attendances || []).filter((a) => !a.isPresent);

  return (
    <DashboardLayout
      title="Absence History"
      subtitle="View your attendance record and absences."
    >
      {/* Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-500">Attendance Rate</p>
              {isLoading ? (
                <div className="h-6 w-16 bg-slate-200 rounded animate-pulse" />
              ) : (
                <p className="text-lg font-bold text-slate-800">
                  {statistics.attendanceRate.toFixed(1)}%
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-500">Present</p>
              {isLoading ? (
                <div className="h-6 w-12 bg-slate-200 rounded animate-pulse" />
              ) : (
                <p className="text-lg font-bold text-slate-800">
                  {statistics.present}/{statistics.total}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-500">Justified</p>
              {isLoading ? (
                <div className="h-6 w-8 bg-slate-200 rounded animate-pulse" />
              ) : (
                <p className="text-lg font-bold text-slate-800">{statistics.absentJustified}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-500">Unjustified</p>
              {isLoading ? (
                <div className="h-6 w-8 bg-slate-200 rounded animate-pulse" />
              ) : (
                <p className="text-lg font-bold text-red-600">{statistics.absentUnjustified}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Warning if too many unjustified absences */}
      {statistics.absentUnjustified >= 3 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-red-800">Attention Required</p>
              <p className="text-sm text-red-600">
                You have {statistics.absentUnjustified} unjustified absences. Please contact administration to discuss your attendance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Absences List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-800">Absence History</h3>
          <p className="text-sm text-slate-500">Last 3 months</p>
        </div>

        <div className="divide-y divide-slate-100">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center justify-between">
                  <div>
                    <div className="h-4 bg-slate-200 rounded w-32 mb-2" />
                    <div className="h-3 bg-slate-200 rounded w-24" />
                  </div>
                  <div className="h-6 bg-slate-200 rounded w-20" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-1">Error Loading Attendance</h3>
              <p className="text-sm text-slate-500 mb-4">
                {error instanceof Error ? error.message : 'Failed to load absence data. Please try again.'}
              </p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Retry
              </button>
            </div>
          ) : absences.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-1">Perfect Attendance!</h3>
              <p className="text-sm text-slate-500">You have no absences in the last 3 months. Great job!</p>
            </div>
          ) : (
            absences.map((absence) => {
              const lessonDate = new Date(absence.lesson.scheduledAt);

              return (
                <div key={absence.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-slate-800">
                          {lessonDate.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                        <AbsenceTypeBadge type={absence.absenceType} />
                      </div>
                      <p className="text-sm text-slate-500">
                        {absence.lesson.group.name}
                        {absence.lesson.topic && ` - ${absence.lesson.topic}`}
                      </p>
                      {absence.note && (
                        <p className="text-xs text-slate-400 mt-1 italic">{absence.note}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">
                        {lessonDate.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
