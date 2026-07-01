'use client';

import { Trash2 } from 'lucide-react';
import { Button, ChatBackButton, StatCard } from '@/shared/components/ui';
import { cn, formatCurrency } from '@/shared/lib/utils';
import type { SalaryBreakdownSubstituteSummary } from '@/features/finance/types';

interface SalaryBreakdownHeaderProps {
  onBack: () => void;
  backLabel: string;
  isLoading: boolean;
  error: unknown;
  hasLessons: boolean;
  lessonCount: number;
  monthLabel: string;
  periodLabel: string;
  totalSalary: number;
  totalDeduction: number;
  totalNet: number;
  substituteSummary: SalaryBreakdownSubstituteSummary;
  substituteStatTitle: string;
  lessonsLabel: string;
  earningsLabel: string;
  deductionsLabel: string;
  netTotalLabel: string;
  selectedCount: number;
  deleteButtonLabel: string;
  onDeleteClick: () => void;
  isDeletePending: boolean;
}

export function SalaryBreakdownHeader({
  onBack,
  backLabel,
  isLoading,
  error,
  hasLessons,
  lessonCount,
  monthLabel,
  periodLabel,
  totalSalary,
  totalDeduction,
  totalNet,
  substituteSummary,
  substituteStatTitle,
  lessonsLabel,
  earningsLabel,
  deductionsLabel,
  netTotalLabel,
  selectedCount,
  deleteButtonLabel,
  onDeleteClick,
  isDeletePending,
}: SalaryBreakdownHeaderProps) {
  return (
    <>
      <ChatBackButton onClick={onBack} aria-label={backLabel} />

      {!isLoading && !error && hasLessons && (
        <div
          className={cn(
            'grid grid-cols-2 gap-4 md:gap-5 lg:gap-6',
            substituteSummary.lessonCount > 0 ? 'lg:grid-cols-5' : 'lg:grid-cols-4',
          )}
        >
          <StatCard
            title={lessonsLabel}
            value={lessonCount}
            change={{ value: monthLabel || periodLabel, type: 'neutral' }}
          />
          <StatCard title={earningsLabel} value={formatCurrency(totalSalary)} />
          <StatCard title={deductionsLabel} value={formatCurrency(totalDeduction)} />
          <StatCard title={netTotalLabel} value={formatCurrency(totalNet)} />
          {substituteSummary.lessonCount > 0 ? (
            <StatCard
              title={substituteStatTitle}
              value={formatCurrency(substituteSummary.netAmount)}
              change={{
                value: `${lessonsLabel}: ${substituteSummary.lessonCount}`,
                type: 'neutral',
              }}
            />
          ) : null}
        </div>
      )}

      {selectedCount > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-4">
          <Button
            type="button"
            variant="destructive"
            className="px-6 py-3 rounded-xl font-medium flex items-center gap-2 w-full sm:w-auto justify-center"
            onClick={onDeleteClick}
            disabled={isDeletePending}
          >
            <Trash2 className="w-4 h-4" />
            {deleteButtonLabel}
          </Button>
        </div>
      )}
    </>
  );
}
