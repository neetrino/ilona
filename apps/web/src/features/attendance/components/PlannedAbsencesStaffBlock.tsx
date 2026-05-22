'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useStaffPlannedAbsences } from '../hooks/useAttendance';
import { PublicAssetImage } from '@/shared/components/ui';
import { STUDENT_DASHBOARD_ASSETS } from '@/features/student-dashboard/assets';

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
    <section className="rounded-3xl border border-[rgba(14,14,16,0.07)] bg-[#f6f7ff] p-5 shadow-[0_10px_30px_-24px_rgba(16,16,163,0.45)] sm:p-6">
      <header className="mb-4 sm:mb-5">
        <h2 className="text-[clamp(0.875rem,1.25vw,1rem)] font-semibold tracking-tight text-[#1010a3]">
          {t('plannedAbsencesStaffTitle')}
        </h2>
      </header>
      {isLoading ? (
        <div className="space-y-2">
          <div className="h-20 animate-pulse rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white" />
          <div className="h-20 animate-pulse rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white" />
        </div>
      ) : data.length === 0 ? (
        <p className="text-sm text-[#8b8b90]">{t('plannedAbsencesStaffEmpty')}</p>
      ) : (
        <ul className="max-h-64 space-y-3 overflow-y-auto">
          {data.map((row) => (
            <li key={row.id}>
              <div className="rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white p-4 text-sm shadow-[0_14px_30px_-28px_rgba(16,16,163,0.9)] transition-shadow hover:shadow-[0_22px_40px_-32px_rgba(16,16,163,0.9)]">
                <div className="flex items-start gap-3">
                  <div className="flex h-[2.25rem] w-[2.25rem] shrink-0 items-center justify-center rounded-[0.875rem] bg-[#ddecff]">
                    <PublicAssetImage
                      src={STUDENT_DASHBOARD_ASSETS.calendarIcon}
                      alt=""
                      width={18}
                      height={18}
                      className="h-[1.125rem] w-[1.125rem] object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[#1010a3]">{row.student.name}</div>
                    <div className="mt-0.5 text-xs text-[#8b8b90]">
                      {row.student.group?.name ?? '—'} · {row.date}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-[#3b3b40]">{row.comment}</p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
