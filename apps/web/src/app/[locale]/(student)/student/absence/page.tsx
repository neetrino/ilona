'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useMonthAttendance } from './hooks/useMonthAttendance';
import { StudentAbsenceCalendar } from './components/StudentAbsenceCalendar';
import { cn } from '@/shared/lib/utils';

export default function StudentAbsencePage() {
  const t = useTranslations('attendance');
  const tCommon = useTranslations('common');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fetch attendance for the current month
  const {
    data: attendanceData,
    isLoading,
    error,
    refetch,
  } = useMonthAttendance(currentMonth);

  const handleRetry = () => {
    refetch();
  };

  const statistics = attendanceData?.statistics || {
    total: 0,
    present: 0,
    absent: 0,
    absentJustified: 0,
    absentUnjustified: 0,
    attendanceRate: 0,
  };

  return (
    <DashboardLayout
      title={t('absenceHistory') || 'Absence History'}
      subtitle={t('viewAttendanceRecord') || 'View your attendance record and absences.'}
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
              <p className="text-sm text-slate-500">{t('attendanceRate')}</p>
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
              <p className="text-sm text-slate-500">{t('present')}</p>
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
              <p className="text-sm text-slate-500">{t('justified')}</p>
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
              <p className="text-sm text-slate-500">{t('unjustified')}</p>
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
              <p className="font-semibold text-red-800">
                {t('attentionRequired') || 'Attention Required'}
              </p>
              <p className="text-sm text-red-600">
                {t('unjustifiedAbsencesWarning', { count: statistics.absentUnjustified }) ||
                  `You have ${statistics.absentUnjustified} unjustified absences. Please contact administration to discuss your attendance.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Calendar */}
      {error ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">
            {t('errorLoadingAttendance') || 'Error Loading Attendance'}
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            {error instanceof Error ? error.message : t('failedToLoadAttendance') || 'Failed to load attendance data. Please try again.'}
          </p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            {tCommon('retry') || 'Retry'}
          </button>
        </div>
      ) : (
        <StudentAbsenceCalendar
          attendanceData={attendanceData}
          isLoading={isLoading}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
        />
      )}
    </DashboardLayout>
  );
}
