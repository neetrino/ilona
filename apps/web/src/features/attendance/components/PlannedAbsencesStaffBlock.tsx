'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useStaffPlannedAbsences } from '../hooks/useAttendance';

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
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-800 mb-4">{t('plannedAbsencesStaffTitle')}</h3>
      {isLoading ? (
        <div className="space-y-2">
          <div className="h-10 bg-slate-100 rounded animate-pulse" />
          <div className="h-10 bg-slate-100 rounded animate-pulse" />
        </div>
      ) : data.length === 0 ? (
        <p className="text-sm text-slate-500">{t('plannedAbsencesStaffEmpty')}</p>
      ) : (
        <ul className="space-y-3 max-h-64 overflow-y-auto">
          {data.map((row) => (
            <li
              key={row.id}
              className="text-sm border border-slate-100 rounded-lg p-3 bg-slate-50/80"
            >
              <div className="font-medium text-slate-900">{row.student.name}</div>
              <div className="text-slate-600 text-xs mt-0.5">
                {row.student.group?.name ?? '—'} · {row.date}
              </div>
              <p className="text-slate-700 mt-2 whitespace-pre-wrap">{row.comment}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
