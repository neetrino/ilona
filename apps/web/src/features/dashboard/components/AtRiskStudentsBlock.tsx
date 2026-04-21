'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useStudentRisk } from '@/features/analytics/hooks/useAnalytics';

const RISK_TONE: Record<'HIGH' | 'MEDIUM' | 'LOW', string> = {
  HIGH: 'bg-red-50 text-red-700 border-red-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export function AtRiskStudentsBlock() {
  const t = useTranslations('dashboard');
  const { locale } = useParams<{ locale: string }>();
  const { data, isLoading } = useStudentRisk();

  const rows = useMemo(() => {
    return (data ?? [])
      .filter((s) => s.riskLevel === 'HIGH' || s.riskLevel === 'MEDIUM')
      .slice(0, 6);
  }, [data]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">{t('atRiskStudents')}</h2>
        <Link href={`/${locale}/admin/analytics`} className="text-sm text-blue-600 hover:underline">
          {t('viewAll')}
        </Link>
      </header>
      {isLoading ? (
        <p className="text-sm text-slate-400">{t('loading')}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-500">{t('noAtRisk')}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((risk) => (
            <li key={risk.id} className="flex items-center justify-between py-2">
              <div>
                <Link
                  href={`/${locale}/admin/students/${risk.id}`}
                  className="text-sm font-medium text-slate-800 hover:text-blue-600"
                >
                  {risk.name}
                </Link>
                <p className="text-xs text-slate-500">
                  {risk.group?.name ?? t('noGroup')} · {risk.attendanceRate}%
                </p>
              </div>
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-medium ${RISK_TONE[risk.riskLevel]}`}
              >
                {t(`risk.${risk.riskLevel.toLowerCase()}`)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
