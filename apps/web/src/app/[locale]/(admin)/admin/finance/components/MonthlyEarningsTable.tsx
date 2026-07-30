'use client';

import { useTranslations } from 'next-intl';
import { Eye } from 'lucide-react';
import Link from 'next/link';
import { DataTable } from '@/shared/components/ui';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';
import { formatCurrency } from '@/shared/lib/utils';
import type { SalaryRecord } from '@/features/finance';
import {
  formatEarningsMonth,
  formatEarningsPeriodLabel,
} from '../utils/earnings-month';

interface MonthlyEarningsTableProps {
  earnings: SalaryRecord[];
  isLoading: boolean;
  isIPad?: boolean;
  locale: string;
  earningsMonth: string;
  searchTerm?: string;
  noResultsKey?: string;
}

function getMonthString(salary: SalaryRecord, fallbackMonth: string): string {
  if (salary.year && salary.month) {
    return formatEarningsMonth(salary.year, salary.month);
  }
  return fallbackMonth;
}

function EarningsActionCell({
  salary,
  locale,
  earningsMonth,
}: {
  salary: SalaryRecord;
  locale: string;
  earningsMonth: string;
}) {
  const t = useTranslations('finance');
  const { readParam } = useAppSearchUrl();

  const firstName = salary.teacher?.user?.firstName || '';
  const lastName = salary.teacher?.user?.lastName || '';
  const teacherName = `${firstName} ${lastName}`.trim();
  const monthStr = getMonthString(salary, earningsMonth);

  const params = new URLSearchParams();
  params.set('tab', 'earnings');
  const earningsPage = readParam('earningsPage');
  const q = readParam('q');
  const monthParam = readParam('earningsMonth');
  if (earningsPage) params.set('earningsPage', earningsPage);
  if (monthParam) params.set('earningsMonth', monthParam);
  if (q) params.set('q', q);
  if (teacherName) params.set('teacherName', encodeURIComponent(teacherName));

  const href = `/${locale}/admin/finance/teacher-salaries/${salary.teacherId}/${monthStr}?${params.toString()}`;

  return (
    <div className="flex items-center justify-start">
      <Link
        href={href}
        onClick={(e) => e.stopPropagation()}
        className="rounded-lg p-2 transition-colors hover:bg-[#f6f6f7]"
        aria-label={t('viewBreakdown')}
      >
        <Eye className="h-5 w-5 text-[#3b3b40]" />
      </Link>
    </div>
  );
}

export function MonthlyEarningsTable({
  earnings,
  isLoading,
  isIPad = false,
  locale,
  earningsMonth,
  searchTerm,
  noResultsKey,
}: MonthlyEarningsTableProps) {
  const t = useTranslations('finance');
  const emptyMessage =
    searchTerm && noResultsKey ? t(noResultsKey) : t('noEarningsFound');
  const periodLabel = formatEarningsPeriodLabel(earningsMonth, locale);

  const columns = [
    {
      key: 'teacher',
      header: t('teacher'),
      render: (row: SalaryRecord) => {
        const firstName = row.teacher?.user?.firstName || '';
        const lastName = row.teacher?.user?.lastName || '';
        const initials = `${firstName[0] || ''}${lastName[0] || ''}` || '?';
        const email = row.teacher?.user?.email || '';
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f1f1f2] font-semibold text-[#3b3b40]">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-[#3b3b40]">
                {firstName} {lastName}
              </p>
              <p className="truncate text-sm text-[#8b8b90]">{email}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'period',
      header: t('earningsPeriod'),
      className: 'text-center',
      render: () => <span className="text-[#8b8b90]">{periodLabel}</span>,
    },
    {
      key: 'lessons',
      header: t('lessons'),
      className: 'text-center',
      render: (row: SalaryRecord) => (
        <span className="text-[#3b3b40]">{row.lessonsCount ?? 0}</span>
      ),
    },
    {
      key: 'deductions',
      header: t('deductions'),
      className: 'text-right',
      render: (row: SalaryRecord) => {
        const amount = Number(row.totalDeductions) || 0;
        return (
          <span className={amount > 0 ? 'font-medium text-red-600' : 'text-[#8b8b90]'}>
            {amount > 0 ? `-${formatCurrency(amount)}` : formatCurrency(0)}
          </span>
        );
      },
    },
    {
      key: 'net',
      header: t('earnedAmount'),
      className: 'text-right',
      render: (row: SalaryRecord) => (
        <span className="font-semibold text-[#3b3b40]">
          {formatCurrency(Number(row.netAmount) || 0)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('actions'),
      className: 'w-16',
      render: (row: SalaryRecord) => (
        <EarningsActionCell salary={row} locale={locale} earningsMonth={earningsMonth} />
      ),
    },
  ];

  return (
    <>
      <div
        className={`${isIPad ? 'grid grid-cols-2 gap-3' : 'space-y-3'} ${isIPad ? '' : 'sm:hidden'}`}
      >
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-[20px] border border-[rgba(14,14,16,0.07)] bg-white"
            />
          ))
        ) : earnings.length === 0 ? (
          <div className="rounded-[20px] border border-[rgba(14,14,16,0.07)] bg-white p-8 text-center text-sm text-[#8b8b90]">
            {emptyMessage}
          </div>
        ) : (
          earnings.map((row) => {
            const firstName = row.teacher?.user?.firstName || '';
            const lastName = row.teacher?.user?.lastName || '';
            const deductions = Number(row.totalDeductions) || 0;
            return (
              <div
                key={row.id}
                className="rounded-[20px] border border-[rgba(14,14,16,0.07)] bg-white p-4 shadow-sm"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#3b3b40]">
                      {firstName} {lastName}
                    </p>
                    <p className="text-xs text-[#8b8b90]">{periodLabel}</p>
                  </div>
                  <EarningsActionCell
                    salary={row}
                    locale={locale}
                    earningsMonth={earningsMonth}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-[#8b8b90]">{t('lessons')}</p>
                    <p className="font-medium text-[#3b3b40]">{row.lessonsCount ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-[#8b8b90]">{t('deductions')}</p>
                    <p className={deductions > 0 ? 'font-medium text-red-600' : 'text-[#8b8b90]'}>
                      {deductions > 0 ? `-${formatCurrency(deductions)}` : formatCurrency(0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#8b8b90]">{t('earnedAmount')}</p>
                    <p className="font-semibold text-[#3b3b40]">
                      {formatCurrency(Number(row.netAmount) || 0)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className={isIPad ? 'hidden' : 'hidden sm:block'}>
        <DataTable
          columns={columns}
          data={earnings}
          isLoading={isLoading}
          emptyMessage={emptyMessage}
          keyExtractor={(row) => row.id}
        />
      </div>
    </>
  );
}
