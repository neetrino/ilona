'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useStudentRisk } from '@/features/analytics/hooks/useAnalytics';
import { PublicAssetImage } from '@/shared/components/ui';
import { STUDENT_DASHBOARD_ASSETS } from '@/features/student-dashboard/assets';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { getAdminPortalBasePath } from '@/shared/lib/role-routes';

const RISK_TONE: Record<'HIGH' | 'MEDIUM' | 'LOW', string> = {
  HIGH: 'border-[#ffc9c4] bg-[#ffe5e3] text-[#ff2e23]',
  MEDIUM: 'border-[#ffe08a] bg-[#ffeb8c] text-[#3a2f00]',
  LOW: 'border-[#b8e8d4] bg-[#d9f4e8] text-[#0d6b42]',
};

export function AtRiskStudentsBlock() {
  const t = useTranslations('dashboard');
  const { locale } = useParams<{ locale: string }>();
  const { user } = useAuthStore();
  const basePath = getAdminPortalBasePath(user?.role);
  const { data, isLoading } = useStudentRisk();

  const rows = useMemo(() => {
    return (data ?? []).filter((s) => s.isAtRisk || s.riskLevel === 'HIGH').slice(0, 6);
  }, [data]);

  return (
    <section className="rounded-3xl border border-[rgba(14,14,16,0.07)] bg-[#f6f7ff] p-5 shadow-[0_10px_30px_-24px_rgba(16,16,163,0.45)] sm:p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-5">
        <h2 className="text-[clamp(0.875rem,1.25vw,1rem)] font-semibold tracking-tight text-[#1010a3]">
          {t('atRiskStudents')}
        </h2>
        <Link
          href={`/${locale}${basePath}/analytics?tab=risk`}
          className="inline-flex h-9 items-center rounded-full border border-[#1010a3]/20 bg-white px-4 text-sm font-medium text-[#1010a3] transition-colors hover:bg-[#ececff]"
        >
          {t('viewAll')}
        </Link>
      </header>
      {isLoading ? (
        <p className="text-sm text-[#8b8b90]">{t('loading')}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-[#8b8b90]">{t('noAtRisk')}</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((risk) => (
            <li
              key={risk.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white p-4 shadow-[0_14px_30px_-28px_rgba(16,16,163,0.9)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(14,14,16,0.08)]"
            >
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-[2.25rem] w-[2.25rem] shrink-0 items-center justify-center rounded-[0.875rem] bg-[#ffeb8c]">
                  <PublicAssetImage
                    src={STUDENT_DASHBOARD_ASSETS.fireIcon}
                    alt=""
                    width={18}
                    height={18}
                    className="h-[1.125rem] w-[1.125rem] object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/${locale}${basePath}/students/${risk.id}`}
                    className="text-sm font-semibold text-[#1010a3] transition-opacity hover:opacity-80"
                  >
                    {risk.name}
                  </Link>
                  <p className="text-xs text-[#8b8b90]">
                    {risk.group?.name ?? t('noGroup')} ·{' '}
                    {t('atRiskReason', { absences: risk.absenceCount ?? 0 })}
                  </p>
                </div>
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
