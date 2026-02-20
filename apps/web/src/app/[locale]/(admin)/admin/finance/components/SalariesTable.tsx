'use client';

import { DataTable } from '@/shared/components/ui';
import { getSalaryColumns } from '../utils/tableColumns';
import type { SalaryRecord, SalaryStatus } from '@/features/finance';

interface SalariesTableProps {
  salaries: SalaryRecord[];
  isLoading: boolean;
  allSalariesSelected: boolean;
  someSalariesSelected: boolean;
  selectedSalaryIds: Set<string>;
  updateSalaryStatus: {
    mutateAsync: (params: { id: string; status: SalaryStatus }) => Promise<void>;
    isPending: boolean;
  };
  onSelectAll: () => void;
  onSelectOne: (salaryId: string, checked: boolean) => void;
  onViewBreakdown: (data: { teacherId: string; teacherName: string; month: string }) => void;
}

export function SalariesTable({
  salaries,
  isLoading,
  allSalariesSelected,
  someSalariesSelected,
  selectedSalaryIds,
  updateSalaryStatus,
  onSelectAll,
  onSelectOne,
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
    <DataTable
      columns={columns}
      data={salaries}
      keyExtractor={(salary) => salary.id}
      isLoading={isLoading}
      emptyMessage="No salary records found"
    />
  );
}

