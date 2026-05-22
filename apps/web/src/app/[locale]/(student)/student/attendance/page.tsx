'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useMonthAttendance } from './hooks/useMonthAttendance';
import { StudentAbsenceCalendar } from './components/StudentAbsenceCalendar';
import {
  StudentAlert,
  StudentErrorState,
  StudentPageStack,
  StudentStatTile,
} from '@/features/student-ui';

export default function StudentAbsencePage() {
  const t = useTranslations('attendance');
  const tCommon = useTranslations('common');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const {
    data: calendarData,
    isLoading,
    error,
    refetch,
  } = useMonthAttendance(currentMonth);

  const statistics = calendarData?.statistics || {
    total: 0,
    present: 0,
    absent: 0,
    absentJustified: 0,
    absentUnjustified: 0,
    attendanceRate: 0,
  };

  return (
    <DashboardLayout
      title={t('scheduleAndAbsenceTitle')}
      subtitle={t('scheduleAndAbsenceSubtitle')}
    >
      <StudentPageStack>
        <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 md:grid-cols-4">
          <StudentStatTile
            label={t('attendanceRate')}
            value={`${statistics.attendanceRate.toFixed(1)}%`}
            isLoading={isLoading}
            tone="sky"
            icon={
              <svg className="h-5 w-5 text-[#1010a3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StudentStatTile
            label={t('present')}
            value={`${statistics.present}/${statistics.total}`}
            isLoading={isLoading}
            tone="lime"
            icon={
              <svg className="h-5 w-5 text-[#1010a3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            }
          />
          <StudentStatTile
            label={t('justified')}
            value={statistics.absentJustified}
            isLoading={isLoading}
            tone="amber"
            icon={
              <svg className="h-5 w-5 text-[#8b4a00]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />
          <StudentStatTile
            label={t('unjustified')}
            value={statistics.absentUnjustified}
            isLoading={isLoading}
            tone="rose"
            valueClassName="text-[#b42318]"
            icon={
              <svg className="h-5 w-5 text-[#b42318]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            }
          />
        </div>

        {statistics.absentUnjustified >= 3 && (
          <StudentAlert variant="danger" title={t('attentionRequired') || 'Attention Required'}>
            {t('unjustifiedAbsencesWarning', { count: statistics.absentUnjustified }) ||
              `You have ${statistics.absentUnjustified} unjustified absences. Please contact administration.`}
          </StudentAlert>
        )}

        {error ? (
          <StudentErrorState
            title={t('errorLoadingAttendance') || 'Error Loading Attendance'}
            message={
              error instanceof Error
                ? error.message
                : t('failedToLoadAttendance') || 'Failed to load attendance data.'
            }
            onRetry={() => refetch()}
            retryLabel={tCommon('retry') || 'Retry'}
          />
        ) : (
          <StudentAbsenceCalendar
            calendarData={calendarData}
            isLoading={isLoading}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
          />
        )}
      </StudentPageStack>
    </DashboardLayout>
  );
}
