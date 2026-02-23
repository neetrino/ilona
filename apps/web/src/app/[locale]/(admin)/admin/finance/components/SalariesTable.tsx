'use client';

import { useTranslations } from 'next-intl';
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
  locale: string;
  searchTerm?: string;
  noResultsKey?: string;
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
  locale,
  searchTerm,
  noResultsKey,
}: SalariesTableProps) {
  const t = useTranslations('finance');
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const columns = getSalaryColumns({
    allSalariesSelected,
    someSalariesSelected,
    isLoadingSalaries: isLoading,
    selectedSalaryIds,
    updateSalaryStatus,
    onSelectAll,
    onSelectOne,
    locale,
  });
  const emptyMessage =
    searchTerm && noResultsKey ? t(noResultsKey) : t('noSalariesFound');

  return (
    <DataTable
      columns={columns}
      data={salaries}
      keyExtractor={(salary) => salary.id}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
    />
  );
}

