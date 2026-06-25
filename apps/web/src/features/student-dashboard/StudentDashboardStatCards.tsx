'use client';

import { useTranslations } from 'next-intl';
import { formatCurrency } from '@/shared/lib/utils';
import { STUDENT_DASHBOARD_ASSETS } from './assets';
import { PortalDashboardStatCard } from '@/features/student-ui/PortalDashboardStatCard';

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
      <PortalDashboardStatCard
        label={t('stats.attendanceLabel')}
        valueNode={
          <>
            <span className="text-[2.375rem] font-bold leading-none tracking-[-0.03em] text-[#1010a3]">
              {attendancePct}
            </span>
            <span className="text-sm font-medium text-[#8b8b90]">%</span>
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
      <PortalDashboardStatCard
        label={t('stats.lessonsLabel')}
        valueNode={
          <>
            <span className="text-[2.375rem] font-bold leading-none tracking-[-0.03em] text-[#1010a3]">
              {attendedLessons}
            </span>
            <span className="text-sm font-medium text-[#8b8b90]">/ {totalLessons}</span>
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
      <PortalDashboardStatCard
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
