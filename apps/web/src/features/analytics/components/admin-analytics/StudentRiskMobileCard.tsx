'use client';

import { useTranslations } from 'next-intl';
import type { StudentRisk } from '@/features/analytics';
import { cn } from '@/shared/lib/utils';
import { initialFromName, riskBarColor } from './admin-analytics.utils';
import { RiskBadge } from './RiskBadge';

export function StudentRiskMobileCard({ student }: { student: StudentRisk }) {
  const t = useTranslations('analytics');
  const tNav = useTranslations('nav');
  const attendanceRate = Math.max(0, Math.min(100, student.attendanceRate));

  return (
    <article className="overflow-hidden rounded-[1.1rem] border border-[rgba(14,14,16,0.09)] bg-white shadow-[0_1px_2px_rgba(14,14,16,0.03)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(14,14,16,0.08)]">
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eceeff] text-xl font-semibold text-[#3232b3]">
          {initialFromName(student.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[1.05rem] font-semibold leading-tight text-[#1f2654]">
            {student.name}
          </p>
          <p className="truncate text-[1rem] text-[#8b8b90]">{student.email}</p>
          <p className="mt-1 truncate text-[1rem] text-[#6a6a72]">
            {student.group?.name || t('noGroup')}
          </p>
        </div>
        <div className="flex shrink-0 items-center">
          <RiskBadge level={student.riskLevel} />
        </div>
      </div>

      <div className="grid grid-cols-4 divide-x divide-[rgba(14,14,16,0.08)] border-t border-[rgba(14,14,16,0.08)]">
        <div className="px-2 py-3 text-center">
          <p className="text-xs text-[#8b8b90]">{tNav('attendance')}</p>
          <p className="mt-1 text-[1.05rem] font-semibold text-[#1f2654]">
            {student.present}/{student.totalLessons}
          </p>
        </div>
        <div className="px-2 py-3 text-center">
          <p className="text-xs text-[#8b8b90]">Rate</p>
          <div className="mx-auto mt-2 h-2 w-full max-w-[4.5rem] rounded-full bg-[#e8e8eb]">
            <div
              className={cn('h-2 rounded-full', riskBarColor(attendanceRate))}
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
          <p className="mt-1 text-[1.05rem] font-semibold text-[#1f2654]">{attendanceRate}%</p>
        </div>
        <div className="px-2 py-3 text-center">
          <p className="text-xs text-[#8b8b90]">{t('unjustifiedShort')}</p>
          <p className={cn('mt-1 text-[1.05rem] font-semibold', student.absentUnjustified > 0 ? 'text-red-600' : 'text-green-600')}>
            {student.absentUnjustified}
          </p>
        </div>
        <div className="px-2 py-3 text-center">
          <p className="text-xs text-[#8b8b90]"># Payments</p>
          <p className="mt-1 text-[1.05rem] font-semibold text-[#1f2654]">{student.pendingPayments}</p>
        </div>
      </div>
    </article>
  );
}
