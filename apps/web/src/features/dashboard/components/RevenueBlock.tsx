'use client';

import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRevenueAnalytics } from '@/features/analytics/hooks/useAnalytics';
import { formatCurrency } from '@/shared/lib/utils';
import { PortalDashboardSection } from '@/features/student-ui';
import { portalInnerCardClass } from '@/shared/lib/portal-theme';

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
    <PortalDashboardSection
      title={t('revenueLast6Months')}
      viewAllHref={`/${locale}/admin/finance`}
      viewAllLabel={t('viewFinance')}
    >
      {isLoading ? (
        <p className="text-sm text-[#8b8b90]">{t('loading')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className={portalInnerCardClass}>
            <p className="text-xs font-medium text-[#0d6b42]">{t('totalIncome')}</p>
            <p className="mt-1 text-lg font-semibold text-[#1010a3]">{formatCurrency(totals.income)}</p>
          </div>
          <div className={portalInnerCardClass}>
            <p className="text-xs font-medium text-[#ff2e23]">{t('totalExpenses')}</p>
            <p className="mt-1 text-lg font-semibold text-[#1010a3]">{formatCurrency(totals.expenses)}</p>
          </div>
          <div className={portalInnerCardClass}>
            <p className="text-xs font-medium text-[#8b8b90]">{t('profit')}</p>
            <p className="mt-1 text-lg font-semibold text-[#1010a3]">{formatCurrency(totals.profit)}</p>
            {totals.latest ? (
              <p className="mt-1 text-xs text-[#8b8b90]">
                {t('latest')}: {totals.latest.monthName} · {formatCurrency(totals.latest.profit)}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </PortalDashboardSection>
  );
}
