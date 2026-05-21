'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useStudentRisk } from '@/features/analytics/hooks/useAnalytics';
import { PortalDashboardSection } from '@/features/student-ui';

const RISK_TONE: Record<'HIGH' | 'MEDIUM' | 'LOW', string> = {
  HIGH: 'border-[#ffc9c4] bg-[#ffe5e3] text-[#ff2e23]',
  MEDIUM: 'border-[#ffe08a] bg-[#ffeb8c] text-[#3a2f00]',
  LOW: 'border-[#b8e8d4] bg-[#d9f4e8] text-[#0d6b42]',
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
    <PortalDashboardSection
      title={t('atRiskStudents')}
      viewAllHref={`/${locale}/admin/analytics`}
      viewAllLabel={t('viewAll')}
    >
      {isLoading ? (
        <p className="text-sm text-[#8b8b90]">{t('loading')}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-[#8b8b90]">{t('noAtRisk')}</p>
      ) : (
        <ul className="divide-y divide-[rgba(14,14,16,0.07)]">
          {rows.map((risk) => (
            <li key={risk.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <div className="min-w-0">
                <Link
                  href={`/${locale}/admin/students/${risk.id}`}
                  className="text-sm font-medium text-[#1010a3] transition-opacity hover:opacity-80"
                >
                  {risk.name}
                </Link>
                <p className="text-xs text-[#8b8b90]">
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
    </PortalDashboardSection>
  );
}
