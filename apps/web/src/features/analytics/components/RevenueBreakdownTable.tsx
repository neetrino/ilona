'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { cn, formatCurrency } from '@/shared/lib/utils';
import type { RevenueData } from '../api/analytics.api';
import { analyticsTableScrollClass } from '../analytics-table-scroll';
import { AnalyticsMobilePagination } from './AnalyticsMobilePagination';

console.log('RevenueBreakdownTable');
interface RevenueBreakdownTableProps {
  revenue: RevenueData[];
  isLoading: boolean;
  periodColumnLabel: string;
  breakdownTitle: string;
  loadingLabel: string;
  emptyLabel: string;
  mobilePageSize?: number;
}

type RevenuePeriodLines = {
  primary: string;
  secondary: string | null;
};

function formatRevenuePeriodMobile(row: RevenueData, locale: string): RevenuePeriodLines {
  const trimmed = row.monthName.trim();

  if (/[–—]/.test(trimmed)) {
    return { primary: trimmed, secondary: null };
  }

  const date = new Date(row.month);
  if (Number.isNaN(date.getTime())) {
    return { primary: trimmed, secondary: null };
  }

  const year = String(date.getUTCFullYear());
  const monthLong = date.toLocaleDateString(locale, { month: 'long', timeZone: 'UTC' });

  if (/^[A-Za-z]{3,9}\s+\d{4}$/.test(trimmed)) {
    return { primary: `${monthLong},`, secondary: year };
  }

  const day = date.getUTCDate();
  return { primary: `${monthLong}\u00A0${day},`, secondary: year };
}

function RevenuePeriodCell({ row, locale }: { row: RevenueData; locale: string }) {
  const { primary, secondary } = formatRevenuePeriodMobile(row, locale);

  return (
    <td className="min-w-[5.25rem] px-3 py-3 font-medium text-[#3b3b40] align-top sm:min-w-0 sm:px-4">
      <span className="hidden sm:inline">{row.monthName}</span>
      <span className="sm:hidden">
        <span className="block whitespace-nowrap text-sm leading-snug">{primary}</span>
        {secondary ? (
          <span className="mt-0.5 block whitespace-nowrap text-sm leading-snug">{secondary}</span>
        ) : null}
      </span>
    </td>
  );
}

function RevenueRows({ rows, locale }: { rows: RevenueData[]; locale: string }) {
  return rows.map((row) => (
    <tr key={row.month} className="hover:bg-[#fafafa]">
      <RevenuePeriodCell row={row} locale={locale} />
      <td className="px-4 py-3 text-center font-medium text-green-600">{formatCurrency(row.income)}</td>
      <td className="px-4 py-3 text-center font-medium text-red-600">{formatCurrency(row.expenses)}</td>
      <td
        className={cn(
          'px-4 py-3 text-center font-semibold',
          row.profit >= 0 ? 'text-blue-600' : 'text-orange-600',
        )}
      >
        {formatCurrency(row.profit)}
      </td>
      <td className="px-4 py-3 text-center text-[#3b3b40]">{row.paymentsCount}</td>
    </tr>
  ));
}

function RevenueTableBody({
  rows,
  isLoading,
  loadingLabel,
  emptyLabel,
  locale,
}: {
  rows: RevenueData[];
  isLoading: boolean;
  loadingLabel: string;
  emptyLabel: string;
  locale: string;
}) {
  if (isLoading) {
    return (
      <tr>
        <td colSpan={5} className="px-4 py-8 text-center text-[#8b8b90]">
          {loadingLabel}
        </td>
      </tr>
    );
  }

  if (rows.length === 0) {
    return (
      <tr>
        <td colSpan={5} className="px-4 py-8 text-center text-[#8b8b90]">
          {emptyLabel}
        </td>
      </tr>
    );
  }

  return <RevenueRows rows={rows} locale={locale} />;
}

function RevenueTableHeader({ periodColumnLabel }: { periodColumnLabel: string }) {
  const tFinance = useTranslations('finance');
  const tDashboard = useTranslations('dashboard');
  return (
    <thead className="border-b border-[rgba(14,14,16,0.07)] bg-[#fafafa]">
      <tr>
        <th className="min-w-[5.25rem] whitespace-nowrap px-3 py-3 text-left text-sm font-medium text-[#3b3b40] sm:min-w-0 sm:px-4">
          {periodColumnLabel}
        </th>
        <th className="px-4 py-3 text-center text-sm font-medium text-[#3b3b40]">{tFinance('income')}</th>
        <th className="px-4 py-3 text-center text-sm font-medium text-[#3b3b40]">{tFinance('expenses')}</th>
        <th className="px-4 py-3 text-center text-sm font-medium text-[#3b3b40]">{tDashboard('profit')}</th>
        <th className="px-4 py-3 text-center text-sm font-medium text-[#3b3b40]"># Payments</th>
      </tr>
    </thead>
  );
}

export function RevenueBreakdownTable({
  revenue,
  isLoading,
  periodColumnLabel,
  breakdownTitle,
  loadingLabel,
  emptyLabel,
  mobilePageSize,
}: RevenueBreakdownTableProps) {
  const locale = useLocale();
  const pageStartRef = useRef<HTMLDivElement | null>(null);
  const [page, setPage] = useState(1);

  const totalPages = mobilePageSize ? Math.max(1, Math.ceil(revenue.length / mobilePageSize)) : 1;
  const safePage = Math.min(page, totalPages);
  const rangeStart =
    !mobilePageSize || revenue.length === 0 ? 0 : (safePage - 1) * mobilePageSize + 1;
  const rangeEnd = mobilePageSize ? Math.min(revenue.length, safePage * mobilePageSize) : revenue.length;
  const paginatedRevenue = useMemo(
    () =>
      mobilePageSize
        ? revenue.slice((safePage - 1) * mobilePageSize, safePage * mobilePageSize)
        : revenue,
    [mobilePageSize, revenue, safePage],
  );

  useEffect(() => {
    setPage(1);
  }, [revenue.length, mobilePageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const goToPage = (nextPage: number) => {
    setPage(nextPage);
    requestAnimationFrame(() => {
      pageStartRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  const displayedRevenue = mobilePageSize ? paginatedRevenue : revenue;

  return (
    <div className="overflow-hidden rounded-xl border border-[rgba(14,14,16,0.07)] bg-white">
      <div className="border-b border-[rgba(14,14,16,0.07)] p-4">
        <h3 className="font-semibold text-[#3b3b40]">{breakdownTitle}</h3>
      </div>

      <div ref={pageStartRef} />
      <div className={analyticsTableScrollClass}>
        <table className="w-full">
          <RevenueTableHeader periodColumnLabel={periodColumnLabel} />
          <tbody className="divide-y divide-[rgba(14,14,16,0.07)]">
            <RevenueTableBody
              rows={displayedRevenue}
              isLoading={isLoading}
              loadingLabel={loadingLabel}
              emptyLabel={emptyLabel}
              locale={locale}
            />
          </tbody>
        </table>
      </div>
      {mobilePageSize && !isLoading && revenue.length > mobilePageSize ? (
        <AnalyticsMobilePagination
          page={safePage}
          totalPages={totalPages}
          start={rangeStart}
          end={rangeEnd}
          total={revenue.length}
          onPrevious={() => goToPage(Math.max(1, safePage - 1))}
          onNext={() => goToPage(Math.min(totalPages, safePage + 1))}
        />
      ) : null}
    </div>
  );
}
