'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRevenueAnalytics } from '@/features/analytics/hooks/useAnalytics';
import { STUDENT_DASHBOARD_ASSETS } from '@/features/student-dashboard/assets';
import { PublicAssetImage } from '@/shared/components/ui';
import { formatCurrency } from '@/shared/lib/utils';

type RevenueMetricCardProps = {
  label: string;
  value: string;
  iconSrc: string;
  iconBgClass: string;
  valueClassName?: string;
  subtitle?: string;
};

function RevenueMetricCard({
  label,
  value,
  iconSrc,
  iconBgClass,
  valueClassName,
  subtitle,
}: RevenueMetricCardProps) {
  return (
    <article className="rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white p-5 shadow-[0_14px_30px_-28px_rgba(16,16,163,0.9)] transition-shadow hover:shadow-[0_22px_40px_-32px_rgba(16,16,163,0.9)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs tracking-wide text-[#8b8b90]">{label}</p>
        <div
          className={`flex h-[2.625rem] w-[2.625rem] shrink-0 items-center justify-center rounded-[0.875rem] ${iconBgClass}`}
        >
          <PublicAssetImage src={iconSrc} alt="" width={24} height={24} className="h-6 w-6 object-contain" />
        </div>
      </div>
      <p
        className={`mt-3 break-words text-[clamp(1.375rem,3vw,2rem)] font-bold leading-none tracking-[-0.03em] text-[#1010a3] ${valueClassName ?? ''}`}
      >
        {value}
      </p>
      {subtitle ? <p className="mt-2 text-xs text-[#3b3b40]">{subtitle}</p> : null}
    </article>
  );
}

export function RevenueBlock() {
  const t = useTranslations('dashboard');
  const { locale } = useParams<{ locale: string }>();
  const { data, isLoading } = useRevenueAnalytics(6);

  const totals = useMemo(() => {
    const items = data ?? [];
    return {
      income: items.reduce((sum, m) => sum + m.income, 0),
      expenses: items.reduce((sum, m) => sum + m.expenses, 0),
      profit: items.reduce((sum, m) => sum + m.profit, 0),
      latest: items.at(-1),
    };
  }, [data]);

  return (
    <section className="rounded-3xl border border-[rgba(14,14,16,0.07)] bg-[#f6f7ff] p-5 shadow-[0_10px_30px_-24px_rgba(16,16,163,0.45)] sm:p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-5">
        <h2 className="text-[clamp(0.875rem,1.25vw,1rem)] font-semibold tracking-tight text-[#1010a3]">
          {t('revenueLast6Months')}
        </h2>
        <Link
          href={`/${locale}/admin/finance`}
          className="inline-flex h-9 items-center rounded-full border border-[#1010a3]/20 bg-white px-4 text-sm font-medium text-[#1010a3] transition-colors hover:bg-[#ececff]"
        >
          {t('viewFinance')}
        </Link>
      </header>
      {isLoading ? (
        <p className="text-sm text-[#8b8b90]">{t('loading')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <RevenueMetricCard
            label={t('totalIncome')}
            value={formatCurrency(totals.income)}
            iconSrc={STUDENT_DASHBOARD_ASSETS.iconCard}
            iconBgClass="bg-[#dffc76]"
            valueClassName="text-[#0a7a3e]"
          />
          <RevenueMetricCard
            label={t('totalExpenses')}
            value={formatCurrency(totals.expenses)}
            iconSrc={STUDENT_DASHBOARD_ASSETS.calendarIcon}
            iconBgClass="bg-[#ffe1e1]"
            valueClassName="text-[#8c2f0f]"
          />
          <RevenueMetricCard
            label={t('profit')}
            value={formatCurrency(totals.profit)}
            iconSrc={STUDENT_DASHBOARD_ASSETS.iconBook}
            iconBgClass="bg-[#ddecff]"
            subtitle={
              totals.latest
                ? `${t('latest')}: ${totals.latest.monthName} · ${formatCurrency(totals.latest.profit)}`
                : undefined
            }
          />
        </div>
      )}
    </section>
  );
}
