'use client';

import { DataTable } from '@/shared/components/ui';
import { getSalaryColumns } from '../utils/tableColumns';
import type { SalaryRecord, SalaryStatus } from '@/features/finance';

interface SalariesTableProps {
  salaries: SalaryRecord[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
  allSalariesSelected: boolean;
  someSalariesSelected: boolean;
  selectedSalaryIds: Set<string>;
  updateSalaryStatus: {
    mutateAsync: (params: { id: string; status: SalaryStatus }) => Promise<void>;
    isPending: boolean;
  };
  onSelectAll: () => void;
  onSelectOne: (salaryId: string, checked: boolean) => void;
  onPageChange: (page: number) => void;
  onViewBreakdown: (data: { teacherId: string; teacherName: string; month: string }) => void;
}

export function SalariesTable({
  salaries,
  isLoading,
  page,
  pageSize,
  totalPages,
  total,
  allSalariesSelected,
  someSalariesSelected,
  selectedSalaryIds,
  updateSalaryStatus,
  onSelectAll,
  onSelectOne,
  onPageChange,
  onViewBreakdown,
}: SalariesTableProps) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const columns = getSalaryColumns({
    allSalariesSelected,
    someSalariesSelected,
    isLoadingSalaries: isLoading,
    selectedSalaryIds,
    updateSalaryStatus,
    onSelectAll,
    onSelectOne,
    onViewBreakdown,
  });

  return (
    <>
      <DataTable
        columns={columns}
        data={salaries}
        keyExtractor={(salary) => salary.id}
        isLoading={isLoading}
        emptyMessage="No salary records found"
      />
      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          Showing {Math.min(page * pageSize + 1, total)}-{Math.min((page + 1) * pageSize, total)} of {total}
        </span>
        <div className="flex items-center gap-2">
          <button 
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50" 
            disabled={page === 0}
            onClick={() => onPageChange(Math.max(0, page - 1))}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span>Page {page + 1} of {totalPages || 1}</span>
          <button 
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50"
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

