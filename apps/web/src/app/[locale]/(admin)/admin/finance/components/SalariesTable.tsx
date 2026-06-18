'use client';

import { useTranslations } from 'next-intl';
import { DataTable } from '@/shared/components/ui';
import { getSalaryColumns } from '../utils/tableColumns';
import { InlineSelect } from '@/features/students/components/InlineSelect';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { formatCurrency } from '@/shared/lib/utils';
import type { SalaryRecord, SalaryStatus } from '@/features/finance';

interface SalariesTableProps {
  salaries: SalaryRecord[];
  isLoading: boolean;
  isIPad?: boolean;
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
  isIPad = false,
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
  const searchParams = useSearchParams();
  const columns = getSalaryColumns({
    t: t as (key: string) => string,
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

  const salaryStatusOptions: Array<{ id: SalaryStatus; labelKey: string }> = [
    { id: 'PENDING', labelKey: 'pending' },
    { id: 'PAID', labelKey: 'paid' },
  ];

  return (
    <>
      <div
        className={`${
          isIPad ? 'grid grid-cols-2 gap-3' : 'space-y-3'
        } ${isIPad ? '' : 'sm:hidden'}`}
      >
        {isLoading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={`salaries-mobile-skeleton-${idx}`}
              className="rounded-2xl border border-[rgba(14,14,16,0.08)] bg-white p-4"
            >
              <div className="h-5 w-40 animate-pulse rounded bg-[#f6f6f7]" />
              <div className="mt-3 h-4 w-28 animate-pulse rounded bg-[#f6f6f7]" />
              <div className="mt-2 h-4 w-32 animate-pulse rounded bg-[#f6f6f7]" />
            </div>
          ))
        ) : salaries.length === 0 ? (
          <div className={`rounded-2xl border border-[rgba(14,14,16,0.08)] bg-white px-4 py-10 text-center text-sm text-[#8b8b90] ${isIPad ? 'col-span-2' : ''}`}>
            {emptyMessage}
          </div>
        ) : (
          salaries.map((salary) => {
            const firstName = salary.teacher?.user?.firstName || '';
            const lastName = salary.teacher?.user?.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim();
            const initials = `${firstName[0] || ''}${lastName[0] || ''}` || '?';
            const email = salary.teacher?.user?.email || '—';
            const monthDate =
              salary.month && salary.year ? new Date(salary.year, salary.month - 1) : null;
            const monthLabel = monthDate
              ? monthDate.toLocaleDateString(locale, { month: 'short', year: 'numeric' })
              : '—';
            const deductions =
              typeof salary.totalDeductions === 'string'
                ? parseFloat(salary.totalDeductions)
                : Number(salary.totalDeductions ?? 0);
            const netSalary =
              typeof salary.netAmount === 'string'
                ? parseFloat(salary.netAmount)
                : Number(salary.netAmount);
            const monthSegment =
              salary.year && salary.month
                ? `${salary.year}-${String(salary.month).padStart(2, '0')}`
                : '';

            const params = new URLSearchParams();
            const tab = searchParams.get('tab');
            const salariesPage = searchParams.get('salariesPage');
            const salaryStatus = searchParams.get('salaryStatus');
            const q = searchParams.get('q');
            if (tab) params.set('tab', tab);
            if (salariesPage) params.set('salariesPage', salariesPage);
            if (salaryStatus) params.set('salaryStatus', salaryStatus);
            if (q) params.set('q', q);
            params.set('teacherName', encodeURIComponent(fullName));
            const href = `/${locale}/admin/finance/teacher-salaries/${salary.teacherId}/${monthSegment}${
              params.toString() ? `?${params.toString()}` : ''
            }`;

            return (
              <article
                key={`salary-mobile-${salary.id}`}
                className="rounded-[1.75rem] border border-[rgba(14,14,16,0.08)] bg-white px-4 py-4 shadow-[0_1px_2px_rgba(14,14,16,0.03)]"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="my-auto h-5 w-5 rounded border-[rgba(14,14,16,0.2)] accent-[#1010a3] text-[#1010a3]"
                    checked={selectedSalaryIds.has(salary.id)}
                    onChange={(event) => onSelectOne(salary.id, event.target.checked)}
                    aria-label={`Select salary for ${fullName}`}
                  />
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f1f1f2] text-base font-semibold text-[#3b3b40]">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[1.25rem] font-semibold leading-tight text-[#1f2937]">
                      {fullName || '—'}
                    </p>
                    <p className="truncate text-[0.95rem] text-[#64748b]">{email}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 items-center gap-3">
                    <div className="flex items-center px-1 py-3 text-[1rem]">
                      <span className="whitespace-nowrap text-[1.3rem] font-bold text-[#1010a3]">{monthLabel}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[rgba(14,14,16,0.08)] px-4 py-3.5 text-[1rem]">
                      <span className="whitespace-nowrap text-[#475569]">{t('lessons')}</span>
                      <span className="whitespace-nowrap font-semibold text-[#0f172a]">{salary.lessonsCount ?? 0}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 items-stretch gap-3">
                    <div className="flex min-h-[88px] flex-col justify-center rounded-2xl border border-[rgba(14,14,16,0.08)] px-4 py-3.5 text-[1rem]">
                      <p className="text-[#475569]">{t('deductions')}</p>
                      <p className={deductions > 0 ? 'mt-1 font-semibold text-red-600' : 'mt-1 font-semibold text-[#0f172a]'}>
                        {deductions > 0 ? '−' : ''}
                        {formatCurrency(deductions)}
                      </p>
                    </div>
                    <div className="flex min-h-[88px] flex-col justify-center rounded-2xl border border-[rgba(14,14,16,0.08)] px-4 py-3.5 text-[1rem]">
                      <p className="text-[#475569]">{t('netSalary')}</p>
                      <p className="mt-1 font-semibold text-[#0f172a]">{formatCurrency(netSalary)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 items-stretch gap-3">
                    <div className="flex min-h-[94px] flex-col justify-center rounded-2xl border border-[rgba(14,14,16,0.08)] px-4 py-3.5 text-[1rem]">
                      <p className="text-[#475569]">{t('status')}</p>
                      <div className="mt-2 min-w-0">
                        <InlineSelect
                          value={salary.status}
                          options={salaryStatusOptions.map((option) => ({
                            id: option.id,
                            label: t(option.labelKey),
                          }))}
                          onChange={async (nextStatus) => {
                            if (nextStatus && nextStatus !== salary.status) {
                              try {
                                await updateSalaryStatus.mutateAsync({
                                  id: salary.id,
                                  status: nextStatus as SalaryStatus,
                                });
                              } catch (error) {
                                console.error('Failed to update salary status:', error);
                              }
                            }
                          }}
                          disabled={updateSalaryStatus.isPending}
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div className="flex min-h-[94px] flex-col justify-center rounded-2xl border border-[rgba(14,14,16,0.08)] px-4 py-3.5 text-[1rem]">
                      <p className="text-[#475569]">{t('actions')}</p>
                      <div className="mt-2">
                        <Link
                          href={href}
                          className="inline-flex items-center rounded-full border border-amber-300 px-4 py-1.5 text-sm font-medium text-amber-700"
                        >
                          {t('view')}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className={`hidden ${isIPad ? '' : 'sm:block'}`}>
        <DataTable
          columns={columns}
          data={salaries}
          keyExtractor={(salary) => salary.id}
          isLoading={isLoading}
          emptyMessage={emptyMessage}
        />
      </div>
    </>
  );
}

