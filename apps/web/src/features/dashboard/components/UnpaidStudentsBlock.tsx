'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { usePayments } from '@/features/finance';
import { formatCurrency } from '@/shared/lib/utils';
import { PortalDashboardSection } from '@/features/student-ui';
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
  const { data, isLoading } = usePayments({ status: 'OVERDUE', take: 25 });
  const { data: pendingData } = usePayments({ status: 'PENDING', take: 25 });

  const rows = useMemo(() => {
    const combined = [...(data?.items ?? []), ...(pendingData?.items ?? [])];
    return aggregate(combined).slice(0, 6);
  }, [data?.items, pendingData?.items]);

  return (
    <PortalDashboardSection
      title={t('unpaidStudents')}
      viewAllHref={`/${locale}/admin/finance`}
      viewAllLabel={t('viewAll')}
    >
      {isLoading ? (
        <p className="text-sm text-[#8b8b90]">{t('loading')}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-[#8b8b90]">{t('noUnpaid')}</p>
      ) : (
        <ul className="divide-y divide-[rgba(14,14,16,0.07)]">
          {rows.map((row) => (
            <li key={row.studentId} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <div className="min-w-0">
                <Link
                  href={`/${locale}/admin/students/${row.studentId}`}
                  className="text-sm font-medium text-[#1010a3] transition-opacity hover:opacity-80"
                >
                  {row.fullName}
                </Link>
                {row.groupName ? (
                  <p className="text-xs text-[#8b8b90]">{row.groupName}</p>
                ) : null}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-[#ff2e23]">
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
    </PortalDashboardSection>
  );
}
