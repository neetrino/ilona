'use client';

import { useMemo } from 'react';
import { useStudentAttendance } from '@/features/attendance';
import { useMyProfile } from '@/features/students';
import { getMonthStart, getMonthEnd } from '@/features/attendance/utils/dateUtils';

/**
 * Hook to fetch attendance data for a specific month
 */
export function useMonthAttendance(month: Date) {
  // Get student profile
  const { data: studentProfile, isLoading: isLoadingProfile } = useMyProfile();

  // Calculate month date range
  const { dateFrom, dateTo } = useMemo(() => {
    const monthStart = getMonthStart(month);
    const monthEnd = getMonthEnd(month);
    
    // Set to start of day and end of day
    monthStart.setHours(0, 0, 0, 0);
    monthEnd.setHours(23, 59, 59, 999);
    
    return {
      dateFrom: monthStart.toISOString(),
      dateTo: monthEnd.toISOString(),
    };
  }, [month]);

  // Fetch attendance for the month
  const attendanceQuery = useStudentAttendance(
    studentProfile?.id || '',
    dateFrom,
    dateTo,
    !!studentProfile?.id
  );

  return {
    ...attendanceQuery,
    isLoading: isLoadingProfile || attendanceQuery.isLoading,
  };
}

