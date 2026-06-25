'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/shared/lib/utils';
import type { TeacherPerformance } from '../api/analytics.api';
import { analyticsTableScrollClass } from '../analytics-table-scroll';
import { AnalyticsMobilePagination } from './AnalyticsMobilePagination';

export type TeacherRatioMetric =
  | 'feedbacksRate'
  | 'voiceRate'
  | 'textRate'
  | 'absenceMarkedRate'
  | 'vocabularySentRate';

interface TeacherRatioTableProps {
  teachers: TeacherPerformance[];
  isLoading: boolean;
  metric: TeacherRatioMetric;
  metricLabel: string;
  /** Right-rail column rendered after the metric. Defaults to "Completed" */
  trailingHeader?: string;
  /** Mobile: show metric as percent only (hide progress bar). */
  mobilePercentOnly?: boolean;
  /** Page size; when set, paginates rows on all screen sizes. */
  mobilePageSize?: number;
}

function rateColor(rate: number): string {
  if (rate >= 90) return 'bg-green-500';
  if (rate >= 70) return 'bg-yellow-500';
  return 'bg-red-500';
}

function MetricBar({
  value,
  mobilePercentOnly = false,
}: {
  value: number;
  mobilePercentOnly?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn('flex items-center gap-2', mobilePercentOnly && 'justify-center sm:justify-normal')}>
      <div className={cn('flex-1 bg-slate-200 rounded-full h-2', mobilePercentOnly && 'hidden sm:block')}>
        <div
          className={cn('h-2 rounded-full transition-all', rateColor(pct))}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn('text-sm font-medium', mobilePercentOnly ? 'w-auto text-center sm:w-12 sm:text-right' : 'w-12 text-right')}>
        {pct}%
      </span>
    </div>
  );
}

function TeacherRatioRows({
  teachers,
  metric,
  mobilePercentOnly,
  isLoading,
}: {
  teachers: TeacherPerformance[];
  metric: TeacherRatioMetric;
  mobilePercentOnly: boolean;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <tr>
        <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
          Loading…
        </td>
      </tr>
    );
  }

  if (teachers.length === 0) {
    return (
      <tr>
        <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
          No teachers found
        </td>
      </tr>
    );
  }

  return teachers.map((teacher) => {
    const value = teacher[metric] ?? 0;
    return (
      <tr key={teacher.id} className="hover:bg-slate-50">
        <td className="px-4 py-3">
          <div>
            <p className="font-medium text-slate-800">{teacher.name}</p>
            <p className="text-xs text-slate-500">{teacher.email}</p>
          </div>
        </td>
        <td className="px-4 py-3">
          <MetricBar value={value} mobilePercentOnly={mobilePercentOnly} />
        </td>
        <td className="px-4 py-3 text-center">
          <span className="font-semibold">{teacher.completedLessons}</span>
          <span className="text-slate-400">/{teacher.totalLessons}</span>
        </td>
      </tr>
    );
  });
}

export function TeacherRatioTable({
  teachers,
  isLoading,
  metric,
  metricLabel,
  trailingHeader = 'Completed Lessons',
  mobilePercentOnly = false,
  mobilePageSize,
}: TeacherRatioTableProps) {
  const pageStartRef = useRef<HTMLDivElement | null>(null);
  const [page, setPage] = useState(1);

  const sorted = useMemo(
    () =>
      [...teachers].sort((a, b) => {
        const av = a[metric] ?? 0;
        const bv = b[metric] ?? 0;
        return bv - av;
      }),
    [teachers, metric],
  );

  const totalPages = mobilePageSize ? Math.max(1, Math.ceil(sorted.length / mobilePageSize)) : 1;
  const safePage = Math.min(page, totalPages);
  const rangeStart =
    !mobilePageSize || sorted.length === 0 ? 0 : (safePage - 1) * mobilePageSize + 1;
  const rangeEnd = mobilePageSize ? Math.min(sorted.length, safePage * mobilePageSize) : sorted.length;
  const paginatedTeachers = useMemo(
    () =>
      mobilePageSize
        ? sorted.slice((safePage - 1) * mobilePageSize, safePage * mobilePageSize)
        : sorted,
    [mobilePageSize, safePage, sorted],
  );

  useEffect(() => {
    setPage(1);
  }, [teachers.length, metric, mobilePageSize]);

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

  const tableHeader = (
    <thead className="bg-slate-50 border-b border-slate-200">
      <tr>
        <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Teacher</th>
        <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 w-[40%]">{metricLabel}</th>
        <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">{trailingHeader}</th>
      </tr>
    </thead>
  );

  const displayedTeachers = mobilePageSize ? paginatedTeachers : sorted;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div ref={pageStartRef} />
      <div className={analyticsTableScrollClass}>
        <table className="w-full">
          {tableHeader}
          <tbody className="divide-y divide-slate-100">
            <TeacherRatioRows
              teachers={displayedTeachers}
              isLoading={isLoading}
              metric={metric}
              mobilePercentOnly={mobilePercentOnly}
            />
          </tbody>
        </table>
      </div>
      {mobilePageSize && !isLoading && sorted.length > mobilePageSize ? (
        <AnalyticsMobilePagination
          page={safePage}
          totalPages={totalPages}
          start={rangeStart}
          end={rangeEnd}
          total={sorted.length}
          onPrevious={() => goToPage(Math.max(1, safePage - 1))}
          onNext={() => goToPage(Math.min(totalPages, safePage + 1))}
        />
      ) : null}
    </div>
  );
}
