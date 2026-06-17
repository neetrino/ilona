'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { StatCard } from '@/shared/components/ui';
import type { FinanceDashboard } from '@/features/finance';
import { formatCurrency } from '@/shared/lib/utils';

interface FinanceStatsProps {
  dashboard: FinanceDashboard | undefined;
  isLoading: boolean;
}

export function FinanceStats({ dashboard, isLoading }: FinanceStatsProps) {
  const t = useTranslations('finance');
  const locale = useLocale();

  if (isLoading) {
    return (
      <div className="grid w-full min-w-0 grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-[#f6f6f7] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid w-full min-w-0 grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-6">
      <StatCard
        title={t('totalRevenue')}
        value={formatCurrency(dashboard?.revenue?.totalRevenue || 0)}
        change={{ value: '+8.2%', type: 'positive' }}
        wrapTitle
      />
      <StatCard
        title={t('pendingPayments')}
        value={formatCurrency(dashboard?.pendingPayments?.totalPending || 0)}
        change={{ 
          value: t('pendingCount', { count: dashboard?.pendingPayments?.count || 0 }), 
          type: (dashboard?.pendingPayments?.overdueCount || 0) > 0 ? 'warning' : 'neutral' 
        }}
        wrapTitle
      />
      <StatCard
        title={t('totalExpenses')}
        value={formatCurrency(dashboard?.expenses?.totalExpenses || 0)}
        change={{ value: t('salariesPaid', { count: dashboard?.expenses?.salariesPaid || 0 }), type: 'neutral' }}
        wrapTitle
        stackChangeOnDesktop={locale !== 'en'}
      />
      <StatCard
        title={t('netProfit')}
        value={formatCurrency(dashboard?.profit || 0)}
        change={{ value: dashboard?.profit && dashboard.profit > 0 ? 'Positive' : 'Review needed', type: dashboard?.profit && dashboard.profit > 0 ? 'positive' : 'warning' }}
        wrapTitle
      />
    </div>
  );
}

