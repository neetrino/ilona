'use client';

import { useMemo } from 'react';
import { useMyStudentCalendar } from '@/features/attendance';
import { getMonthStart, getMonthEnd } from '@/features/attendance/utils/dateUtils';

/**
 * Calendar month: group lesson schedule + attendance + planned absences
 */
export function useMonthAttendance(month: Date) {
  const { dateFrom, dateTo } = useMemo(() => {
    const monthStart = getMonthStart(month);
    const monthEnd = getMonthEnd(month);

    monthStart.setHours(0, 0, 0, 0);
    monthEnd.setHours(23, 59, 59, 999);

    return {
      dateFrom: monthStart.toISOString(),
      dateTo: monthEnd.toISOString(),
    };
  }, [month]);

  return useMyStudentCalendar(dateFrom, dateTo, true);
}
