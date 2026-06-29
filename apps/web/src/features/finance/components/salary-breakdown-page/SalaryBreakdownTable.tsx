'use client';

import type { ReactNode } from 'react';
import { Wallet, TrendingDown, TrendingUp } from 'lucide-react';
import { DataTable } from '@/shared/components/ui';
import { substituteLessonChipClassName } from '@/features/finance';
import type { SalaryBreakdownLesson } from '@/features/finance/types';
import { formatCurrency } from '@/shared/lib/utils';

type BreakdownColumn = {
  key: string;
  header: ReactNode;
  sortable?: boolean;
  render?: (lesson: SalaryBreakdownLesson) => ReactNode;
  className?: string;
};

interface SalaryBreakdownTableProps {
  sortedLessons: SalaryBreakdownLesson[];
  breakdownColumns: BreakdownColumn[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (key: string) => void;
  selectedLessonIds: Set<string>;
  onSelectOne: (lessonId: string, checked: boolean) => void;
  onOpenObligation: (lessonId: string) => void;
  formatDate: (dateString: string | null | undefined) => string;
  teacherName: string;
  emptyMessage: string;
  totalsLabel: string;
  lessonDateLabel: string;
  obligationLabel: string;
  lessonSalaryLabel: string;
  lessonDeductionLabel: string;
  rowTotalLabel: string;
  substituteLessonBadgeLabel: string;
  totalSalary: number;
  totalDeduction: number;
  totalNet: number;
}

export function SalaryBreakdownTable({
  sortedLessons,
  breakdownColumns,
  sortBy,
  sortOrder,
  onSort,
  selectedLessonIds,
  onSelectOne,
  onOpenObligation,
  formatDate,
  teacherName,
  emptyMessage,
  totalsLabel,
  lessonDateLabel,
  obligationLabel,
  lessonSalaryLabel,
  lessonDeductionLabel,
  rowTotalLabel,
  substituteLessonBadgeLabel,
  totalSalary,
  totalDeduction,
  totalNet,
}: SalaryBreakdownTableProps) {
  return (
    <>
      <div className="space-y-3 p-3 sm:hidden">
        {sortedLessons.map((lesson) => (
          <article
            key={`mobile-${lesson.lessonId}`}
            className="rounded-2xl border border-[rgba(14,14,16,0.08)] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(14,14,16,0.03)]"
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedLessonIds.has(lesson.lessonId)}
                onChange={(e) => onSelectOne(lesson.lessonId, e.target.checked)}
                className="my-auto h-5 w-5 rounded border-[rgba(14,14,16,0.2)] accent-[#1010a3]"
                aria-label={`Select lesson ${lesson.lessonName}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2 min-w-0">
                  {lesson.isSubstituteLesson ? (
                    <span className={`${substituteLessonChipClassName} mt-0.5`}>
                      {substituteLessonBadgeLabel}
                    </span>
                  ) : null}
                  <p className="truncate text-[1.05rem] font-semibold text-[#1f2937]">
                    {lesson.groupName || lesson.lessonName}
                  </p>
                </div>
                <p className="mt-1 text-sm text-[#64748b]">{teacherName}</p>
              </div>
            </div>

            <div className="my-3 border-t border-[rgba(14,14,16,0.08)]" />

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[rgba(14,14,16,0.08)] px-3 py-3">
                <p className="text-sm text-[#64748b]">{lessonDateLabel}</p>
                <p className="mt-1 text-sm font-semibold text-[#0f172a]">{formatDate(lesson.lessonDate)}</p>
              </div>
              <div className="rounded-2xl border border-[rgba(14,14,16,0.08)] px-3 py-3">
                <p className="text-sm text-[#64748b]">{obligationLabel}</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenObligation(lesson.lessonId);
                  }}
                  className="mt-1 text-sm font-semibold text-[#1010a3]"
                >
                  {lesson.obligationCompleted}/{lesson.obligationTotal}
                </button>
              </div>
              <div className="rounded-2xl border border-[rgba(14,14,16,0.08)] px-3 py-3">
                <p className="text-sm text-[#64748b]">{lessonSalaryLabel}</p>
                <p className="mt-1 text-sm font-semibold text-[#0f172a]">{formatCurrency(lesson.salary)}</p>
              </div>
              <div className="rounded-2xl border border-[rgba(14,14,16,0.08)] px-3 py-3">
                <p className="text-sm text-[#64748b]">{lessonDeductionLabel}</p>
                <p className="mt-1 text-sm font-semibold text-red-600">
                  {lesson.deduction > 0 ? '−' : ''}
                  {formatCurrency(lesson.deduction)}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden sm:block">
        <DataTable
          columns={breakdownColumns}
          data={sortedLessons}
          keyExtractor={(lesson) => lesson.lessonId}
          isLoading={false}
          emptyMessage={emptyMessage}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
          embedInParentCard
        />
      </div>

      <div className="border-t border-[rgba(14,14,16,0.07)] bg-[#fafafa]/60">
        <div className="space-y-3 p-3 sm:hidden">
          <div className="rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(14,14,16,0.03)]">
            <p className="mb-4 text-[1.9rem] font-semibold leading-none text-[#111827]">{totalsLabel}</p>
            <div className="rounded-2xl border border-[rgba(14,14,16,0.08)] bg-[#fafafa] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex size-11 items-center justify-center rounded-full bg-[#eef0ff] text-[#5b6470]">
                  <Wallet className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[#7c828d]">{lessonSalaryLabel}</p>
                </div>
                <p className="whitespace-nowrap text-right text-[clamp(1rem,5.3vw,1.5rem)] font-semibold leading-none text-[#111827]">
                  {formatCurrency(totalSalary)}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[rgba(14,14,16,0.08)] bg-[#fafafa] px-4 py-3">
                <div className="mb-2 inline-flex size-11 items-center justify-center rounded-full bg-[#ffeef0] text-[#d22839]">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <p className="text-sm text-[#5f6672]">{lessonDeductionLabel}</p>
                <p className="mt-1 whitespace-nowrap text-[clamp(1rem,5.2vw,1.5rem)] font-semibold leading-none text-[#d22839]">
                  {totalDeduction > 0 ? '−' : ''}
                  {formatCurrency(totalDeduction)}
                </p>
              </div>
              <div className="rounded-2xl border border-[rgba(14,14,16,0.08)] bg-[#fafafa] px-4 py-3">
                <div className="mb-2 inline-flex size-11 items-center justify-center rounded-full bg-[#e9f8f0] text-[#0f8a47]">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <p className="text-sm text-[#5f6672]">{rowTotalLabel}</p>
                <p className="mt-1 whitespace-nowrap text-[clamp(1rem,5.2vw,1.5rem)] font-semibold leading-none text-[#111827]">
                  {formatCurrency(totalNet)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden flex-col gap-3 px-6 py-4 text-sm sm:flex">
          <span className="text-[#8b8b90] font-medium uppercase tracking-wide">{totalsLabel}</span>
          <div className="flex flex-col gap-2">
            <span className="flex items-center justify-between gap-4">
              <span className="text-[#8b8b90]">{lessonSalaryLabel}</span>
              <span className="font-semibold text-[#3b3b40]">{formatCurrency(totalSalary)}</span>
            </span>
            <span className="flex items-center justify-between gap-4">
              <span className="text-[#8b8b90]">{lessonDeductionLabel}</span>
              <span className="font-medium text-red-600">
                {totalDeduction > 0 ? '−' : ''}
                {formatCurrency(totalDeduction)}
              </span>
            </span>
            <span className="flex items-center justify-between gap-4">
              <span className="text-[#8b8b90]">{rowTotalLabel}</span>
              <span className="font-semibold text-[#3b3b40]">{formatCurrency(totalNet)}</span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
