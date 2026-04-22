'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRevenueAnalytics } from '@/features/analytics/hooks/useAnalytics';
import { formatCurrency } from '@/shared/lib/utils';

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
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">{t('revenueLast6Months')}</h2>
        <Link href={`/${locale}/admin/finance`} className="text-sm text-blue-600 hover:underline">
          {t('viewFinance')}
        </Link>
      </header>
      {isLoading ? (
        <p className="text-sm text-slate-400">{t('loading')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-xs font-medium text-emerald-700">{t('totalIncome')}</p>
            <p className="mt-1 text-lg font-semibold text-emerald-800">{formatCurrency(totals.income)}</p>
          </div>
          <div className="rounded-xl bg-rose-50 p-4">
            <p className="text-xs font-medium text-rose-700">{t('totalExpenses')}</p>
            <p className="mt-1 text-lg font-semibold text-rose-800">{formatCurrency(totals.expenses)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-600">{t('profit')}</p>
            <p className="mt-1 text-lg font-semibold text-slate-800">{formatCurrency(totals.profit)}</p>
            {totals.latest && (
              <p className="mt-1 text-xs text-slate-500">
                {t('latest')}: {totals.latest.monthName} · {formatCurrency(totals.latest.profit)}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
