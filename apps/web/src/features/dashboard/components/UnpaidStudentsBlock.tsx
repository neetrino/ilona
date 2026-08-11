'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { usePayments } from '@/features/finance';
import { PublicAssetImage } from '@/shared/components/ui';
import { STUDENT_DASHBOARD_ASSETS } from '@/features/student-dashboard/assets';
import { formatCurrency } from '@/shared/lib/utils';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { getAdminPortalBasePath } from '@/shared/lib/role-routes';
import type { Payment } from '@/features/finance/types';

interface AggregatedDebt {
  studentId: string;
  fullName: string;
  groupName?: string;
  totalAmount: number;
  overdueCount: number;
  pendingCount: number;
}

function aggregate(items: Payment[]): AggregatedDebt[] {
  const map = new Map<string, AggregatedDebt>();
  for (const p of items) {
    const fullName = `${p.student.user.firstName} ${p.student.user.lastName}`.trim();
    const key = p.studentId;
    const entry = map.get(key) ?? {
      studentId: key,
      fullName,
      groupName: p.student.group?.name,
      totalAmount: 0,
      overdueCount: 0,
      pendingCount: 0,
    };
    entry.totalAmount += Number(p.amount ?? 0);
    if (p.status === 'OVERDUE') entry.overdueCount += 1;
    else entry.pendingCount += 1;
    map.set(key, entry);
  }
  return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
}

export function UnpaidStudentsBlock() {
  const t = useTranslations('dashboard');
  const { locale } = useParams<{ locale: string }>();
  const { user } = useAuthStore();
  const basePath = getAdminPortalBasePath(user?.role);
  const { data, isLoading } = usePayments({ status: 'OVERDUE', take: 25 });
  const { data: pendingData } = usePayments({ status: 'PENDING', take: 25 });

  const rows = useMemo(() => {
    const combined = [...(data?.items ?? []), ...(pendingData?.items ?? [])];
    return aggregate(combined).slice(0, 6);
  }, [data?.items, pendingData?.items]);

  return (
    <section className="rounded-3xl border border-[rgba(14,14,16,0.07)] bg-[#f6f7ff] p-5 shadow-[0_10px_30px_-24px_rgba(16,16,163,0.45)] sm:p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-5">
        <h2 className="text-[clamp(0.875rem,1.25vw,1rem)] font-semibold tracking-tight text-[#1010a3]">
          {t('unpaidStudents')}
        </h2>
        <Link
          href={`/${locale}${basePath}/finance`}
          className="inline-flex h-9 items-center rounded-full border border-[#1010a3]/20 bg-white px-4 text-sm font-medium text-[#1010a3] transition-colors hover:bg-[#ececff]"
        >
          {t('viewAll')}
        </Link>
      </header>
      {isLoading ? (
        <p className="text-sm text-[#8b8b90]">{t('loading')}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-[#8b8b90]">{t('noUnpaid')}</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li
              key={row.studentId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white p-4 shadow-[0_14px_30px_-28px_rgba(16,16,163,0.9)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(14,14,16,0.08)]"
            >
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-[2.25rem] w-[2.25rem] shrink-0 items-center justify-center rounded-[0.875rem] bg-[#ffe1e1]">
                  <PublicAssetImage
                    src={STUDENT_DASHBOARD_ASSETS.iconCard}
                    alt=""
                    width={18}
                    height={18}
                    className="h-[1.125rem] w-[1.125rem] object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/${locale}${basePath}/students/${row.studentId}`}
                    className="text-sm font-semibold text-[#1010a3] transition-opacity hover:opacity-80"
                  >
                    {row.fullName}
                  </Link>
                  {row.groupName ? <p className="text-xs text-[#8b8b90]">{row.groupName}</p> : null}
                </div>
              </div>
              <div className="text-right">
                <p className="break-words text-base font-bold tracking-[-0.01em] text-[#8c2f0f]">
                  {formatCurrency(row.totalAmount)}
                </p>
                <p className="text-xs text-[#8b8b90]">
                  {row.overdueCount > 0
                    ? t('overdueCount', { count: row.overdueCount })
                    : t('pendingCount', { count: row.pendingCount })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
