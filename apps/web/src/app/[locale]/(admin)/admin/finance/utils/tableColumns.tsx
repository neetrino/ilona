'use client';

import { InlineSelect } from '@/features/students/components/InlineSelect';
import { Eye } from 'lucide-react';
import { SelectAllCheckbox } from '../components/SelectAllCheckbox';
import type { Payment, SalaryRecord, PaymentStatus, SalaryStatus } from '@/features/finance';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// Format month from salary record (month field is a number)
function formatMonthFromSalary(salary: SalaryRecord) {
  // month is a number (1-12), year is also a number
  if (salary.month && salary.year) {
    const date = new Date(salary.year, salary.month - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  return 'Unknown';
}

// Get month string in YYYY-MM format from salary record
function getMonthString(salary: SalaryRecord): string {
  // month is a number (1-12), year is also a number
  if (salary.year && salary.month) {
    return `${salary.year}-${String(salary.month).padStart(2, '0')}`;
  }
  return '';
}

// Component for the action cell that can use hooks
function SalaryActionCell({ salary, locale }: { salary: SalaryRecord; locale: string }) {
  const searchParams = useSearchParams();
  
  const firstName = salary.teacher?.user?.firstName || '';
  const lastName = salary.teacher?.user?.lastName || '';
  const teacherName = `${firstName} ${lastName}`;
  const monthStr = getMonthString(salary);
  
  // Build URL with query params to preserve state
  const tab = searchParams.get('tab');
  const salariesPage = searchParams.get('salariesPage');
  const salaryStatus = searchParams.get('salaryStatus');
  const q = searchParams.get('q');
  
  const params = new URLSearchParams();
  if (tab) params.set('tab', tab);
  if (salariesPage) params.set('salariesPage', salariesPage);
  if (salaryStatus) params.set('salaryStatus', salaryStatus);
  if (q) params.set('q', q);
  params.set('teacherName', encodeURIComponent(teacherName));
  
  const queryString = params.toString();
  const href = `/${locale}/admin/finance/teacher-salaries/${salary.teacherId}/${monthStr}${queryString ? `?${queryString}` : ''}`;
  
  return (
    <div className="flex items-center justify-center">
      <Link
        href={href}
        onClick={(e) => e.stopPropagation()}
        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        aria-label="View breakdown"
      >
        <Eye className="w-5 h-5 text-slate-900" />
      </Link>
    </div>
  );
}

interface PaymentColumnsProps {
  t: (key: string) => string;
  updatePaymentStatus: {
    mutateAsync: (params: { id: string; status: PaymentStatus }) => Promise<void>;
    isPending: boolean;
  };
}

export function getPaymentColumns({ t, updatePaymentStatus }: PaymentColumnsProps) {

  return [
    {
      key: 'student',
      header: t('student'),
      render: (payment: Payment) => {
        const firstName = payment.student?.user?.firstName || '';
        const lastName = payment.student?.user?.lastName || '';
        const initials = `${firstName[0] || ''}${lastName[0] || ''}` || '?';
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold">
              {initials}
            </div>
            <div>
              <p className="font-semibold text-slate-800">
                {firstName} {lastName}
              </p>
              <p className="text-sm text-slate-500">{payment.student?.user?.email || ''}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'amount',
      header: t('amount'),
      render: (payment: Payment) => {
        const amount = typeof payment.amount === 'string' ? parseFloat(payment.amount) : Number(payment.amount);
        return (
          <span className="font-semibold text-slate-800">
            {new Intl.NumberFormat('hy-AM', {
              style: 'currency',
              currency: 'AMD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(amount)}
          </span>
        );
      },
    },
    {
      key: 'dueDate',
      header: t('dueDate'),
      render: (payment: Payment) => {
        const date = new Date(payment.dueDate);
        return (
          <span className="text-slate-500">
            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: t('status'),
      className: 'text-left',
      render: (payment: Payment) => (
        <div className="w-32">
          <InlineSelect
            value={payment.status}
            options={[
              { id: 'PENDING', label: t('pending') },
              { id: 'PAID', label: t('paid') },
              { id: 'OVERDUE', label: t('overdue') },
              { id: 'CANCELLED', label: t('cancelled') },
              { id: 'REFUNDED', label: t('refunded') },
            ]}
            onChange={async (newStatus) => {
              if (newStatus && newStatus !== payment.status) {
                try {
                  await updatePaymentStatus.mutateAsync({
                    id: payment.id,
                    status: newStatus as PaymentStatus,
                  });
                } catch (error) {
                  console.error('Failed to update payment status:', error);
                }
              }
            }}
            disabled={updatePaymentStatus.isPending}
            className="w-full"
          />
        </div>
      ),
    },
  ];
}

interface SalaryColumnsProps {
  allSalariesSelected: boolean;
  someSalariesSelected: boolean;
  isLoadingSalaries: boolean;
  selectedSalaryIds: Set<string>;
  updateSalaryStatus: {
    mutateAsync: (params: { id: string; status: SalaryStatus }) => Promise<void>;
    isPending: boolean;
  };
  onSelectAll: () => void;
  onSelectOne: (salaryId: string, checked: boolean) => void;
  locale: string;
}

export function getSalaryColumns({
  allSalariesSelected,
  someSalariesSelected,
  isLoadingSalaries,
  selectedSalaryIds,
  updateSalaryStatus,
  onSelectAll,
  onSelectOne,
  locale,
}: SalaryColumnsProps) {
  return [
    {
      key: 'checkbox',
      header: (
        <SelectAllCheckbox
          checked={allSalariesSelected}
          indeterminate={someSalariesSelected}
          onChange={onSelectAll}
          disabled={isLoadingSalaries}
        />
      ),
      className: 'w-12',
      render: (salary: SalaryRecord) => (
        <input
          type="checkbox"
          checked={selectedSalaryIds.has(salary.id)}
          onChange={(e) => onSelectOne(salary.id, e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-slate-300 cursor-pointer"
          aria-label={`Select salary for ${salary.teacher?.user?.firstName} ${salary.teacher?.user?.lastName}`}
        />
      ),
    },
    {
      key: 'teacher',
      header: 'Teacher Name',
      className: 'text-left',
      render: (salary: SalaryRecord) => {
        const firstName = salary.teacher?.user?.firstName || '';
        const lastName = salary.teacher?.user?.lastName || '';
        return (
          <span className="font-semibold text-slate-800">
            {firstName} {lastName}
          </span>
        );
      },
    },
    {
      key: 'month',
      header: 'Month',
      className: 'text-left',
      render: (salary: SalaryRecord) => (
        <span className="text-slate-700">{formatMonthFromSalary(salary)}</span>
      ),
    },
    {
      key: 'salary',
      header: 'Salary',
      className: 'text-right',
      render: (salary: SalaryRecord) => {
        const amount = typeof salary.netAmount === 'string' ? parseFloat(salary.netAmount) : Number(salary.netAmount);
        return (
          <span className="font-semibold text-slate-800">
            {new Intl.NumberFormat('hy-AM', {
              style: 'currency',
              currency: 'AMD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(amount)}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      className: 'text-left',
      render: (salary: SalaryRecord) => (
        <div className="w-32">
          <InlineSelect
            value={salary.status}
            options={[
              { id: 'PENDING', label: 'Pending' },
              { id: 'PAID', label: 'Paid' },
            ]}
            onChange={async (newStatus) => {
              if (newStatus && newStatus !== salary.status) {
                try {
                  await updateSalaryStatus.mutateAsync({
                    id: salary.id,
                    status: newStatus as SalaryStatus,
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
      ),
    },
    {
      key: 'action',
      header: 'Action',
      className: 'text-center',
      render: (salary: SalaryRecord) => (
        <SalaryActionCell salary={salary} locale={locale} />
      ),
    },
  ];
}

