'use client';

import { formatCurrency } from '@/shared/lib/utils';
import type { SalaryBreakdownTotalsRowProps } from './salary-breakdown-modal.types';

export function SalaryBreakdownTotalsRow({
  totalSalary,
  totalDeduction,
  totalNet,
}: SalaryBreakdownTotalsRowProps) {
  return (
    <div className="mt-4 pt-4 border-t border-slate-200">
      <div className="grid grid-cols-12 gap-4 text-sm font-semibold">
        <div className="col-span-5"></div>
        <div className="col-span-2 text-right text-slate-600">Totals:</div>
        <div className="col-span-1 text-right text-slate-800">{formatCurrency(totalSalary)}</div>
        <div className="col-span-1 text-right text-red-500">-{formatCurrency(totalDeduction)}</div>
        <div className="col-span-1 text-right text-slate-900">{formatCurrency(totalNet)}</div>
        <div className="col-span-2"></div>
      </div>
    </div>
  );
}
