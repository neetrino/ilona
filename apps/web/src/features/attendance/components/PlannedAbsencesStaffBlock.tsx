'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useStaffPlannedAbsences } from '../hooks/useAttendance';
import { StudentCard, StudentInnerCard, StudentSectionHeader } from '@/features/student-ui';

export function PlannedAbsencesStaffBlock() {
  const t = useTranslations('attendance');
  const { dateFrom, dateTo } = useMemo(() => {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 60);
    to.setHours(23, 59, 59, 999);
    return { dateFrom: from.toISOString(), dateTo: to.toISOString() };
  }, []);

  const { data = [], isLoading } = useStaffPlannedAbsences(dateFrom, dateTo, true);

  return (
    <StudentCard>
      <StudentSectionHeader title={t('plannedAbsencesStaffTitle')} />
      {isLoading ? (
        <div className="space-y-2">
          <div className="h-10 animate-pulse rounded-lg bg-[#f1f1f2]" />
          <div className="h-10 animate-pulse rounded-lg bg-[#f1f1f2]" />
        </div>
      ) : data.length === 0 ? (
        <p className="text-sm text-[#8b8b90]">{t('plannedAbsencesStaffEmpty')}</p>
      ) : (
        <ul className="max-h-64 space-y-3 overflow-y-auto">
          {data.map((row) => (
            <li key={row.id}>
              <StudentInnerCard className="text-sm">
                <div className="font-medium text-[#1010a3]">{row.student.name}</div>
                <div className="mt-0.5 text-xs text-[#8b8b90]">
                  {row.student.group?.name ?? '—'} · {row.date}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-[#3b3b40]">{row.comment}</p>
              </StudentInnerCard>
            </li>
          ))}
        </ul>
      )}
    </StudentCard>
  );
}
