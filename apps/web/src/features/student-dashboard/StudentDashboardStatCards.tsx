'use client';

import type { ReactNode } from 'react';
import { PublicAssetImage } from '@/shared/components/ui';
import { useTranslations } from 'next-intl';
import { formatCurrency } from '@/shared/lib/utils';
import { STUDENT_DASHBOARD_ASSETS } from './assets';

type StudentDashboardStatCardsProps = {
  attendanceRate: number;
  presentCount: number;
  totalSessions: number;
  totalLessons: number;
  attendedLessons: number;
  nextPaymentAmount: number | null;
  daysUntilDue: number | null;
  isLoading?: boolean;
};

function ProgressBar({ percent }: { percent: number }) {
  const width = `${Math.max(0, Math.min(100, percent))}%`;
  return (
    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#f1f1f2]">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#0e0e10] to-[#3b3b40]"
        style={{ width }}
      />
    </div>
  );
}

type StatCardProps = {
  label: string;
  valueNode: ReactNode;
  caption: string;
  progress: number;
  badge?: ReactNode;
  iconSrc: string;
  iconBg: string;
};

function DashboardStatCard({
  label,
  valueNode,
  caption,
  progress,
  badge,
  iconSrc,
  iconBg,
}: StatCardProps) {
  return (
    <article className="rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs tracking-wide text-[#8b8b90]">{label}</p>
        <div
          className={`flex h-[2.625rem] w-[2.625rem] shrink-0 items-center justify-center rounded-[0.875rem] ${iconBg}`}
        >
          <PublicAssetImage src={iconSrc} alt="" width={24} height={24} className="h-6 w-6 object-contain" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        {valueNode}
        {badge}
      </div>
      <p className="mt-2 text-xs text-[#3b3b40]">{caption}</p>
      <ProgressBar percent={progress} />
    </article>
  );
}

export function StudentDashboardStatCards({
  attendanceRate,
  presentCount,
  totalSessions,
  totalLessons,
  attendedLessons,
  nextPaymentAmount,
  daysUntilDue,
  isLoading,
}: StudentDashboardStatCardsProps) {
  const t = useTranslations('dashboard');

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-[10.75rem] animate-pulse rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white"
          />
        ))}
      </div>
    );
  }

  const attendancePct = Math.round(attendanceRate);
  const lessonsTarget = Math.max(totalLessons, attendedLessons, 1);
  const lessonsPct = Math.round((attendedLessons / lessonsTarget) * 100);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
      <DashboardStatCard
        label={t('stats.attendanceLabel')}
        valueNode={
          <>
            <span className="text-[2.375rem] font-bold leading-none tracking-[-0.03em] text-[#1010a3]">
              {attendancePct}
            </span>
            <span className="pb-1 text-sm font-medium text-[#8b8b90]">%</span>
          </>
        }
        badge={
          attendancePct >= 90 ? (
            <span className="rounded-full bg-[#e7f6ec] px-2 py-0.5 text-[0.6875rem] font-semibold text-[#0a7a3e]">
              ▲ {t('excellent')}
            </span>
          ) : null
        }
        caption={t('stats.sessionsAttended', { present: presentCount, total: totalSessions })}
        progress={attendancePct}
        iconSrc={STUDENT_DASHBOARD_ASSETS.iconAttendance}
        iconBg="bg-[#dffc76]"
      />
      <DashboardStatCard
        label={t('stats.lessonsLabel')}
        valueNode={
          <>
            <span className="text-[2.375rem] font-bold leading-none tracking-[-0.03em] text-[#1010a3]">
              {attendedLessons}
            </span>
            <span className="pb-1 text-sm font-medium text-[#8b8b90]">/ {totalLessons}</span>
          </>
        }
        badge={
          <span className="rounded-full bg-[#e7f6ec] px-2 py-0.5 text-[0.6875rem] font-semibold text-[#0a7a3e]">
            ▲ {presentCount}
          </span>
        }
        caption={t('stats.lessonsRemaining', {
          remaining: Math.max(0, totalLessons - attendedLessons),
        })}
        progress={lessonsPct}
        iconSrc={STUDENT_DASHBOARD_ASSETS.iconBook}
        iconBg="bg-[#ddecff]"
      />
      <DashboardStatCard
        label={t('stats.paymentLabel')}
        valueNode={
          nextPaymentAmount != null ? (
            <>
              <span className="text-[2.375rem] font-bold leading-none tracking-[-0.03em] text-[#1010a3]">
                {formatCurrency(nextPaymentAmount).replace(/\.00$/, '')}
              </span>
            </>
          ) : (
            <span className="text-2xl font-bold text-[#1010a3]">{t('allPaid')}</span>
          )
        }
        badge={
          daysUntilDue != null ? (
            <span className="rounded-full bg-[#fff0d6] px-2 py-0.5 text-[0.6875rem] font-semibold text-[#8b4a00]">
              {t('stats.daysLeft', { count: daysUntilDue })}
            </span>
          ) : null
        }
        caption={
          nextPaymentAmount != null
            ? t('stats.paymentCaption')
            : t('allPaid')
        }
        progress={daysUntilDue != null ? Math.max(10, 100 - daysUntilDue * 10) : 100}
        iconSrc={STUDENT_DASHBOARD_ASSETS.iconCard}
        iconBg="bg-[#ffe1e1]"
      />
    </div>
  );
}
