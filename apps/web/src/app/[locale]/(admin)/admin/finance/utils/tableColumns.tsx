'use client';

import { InlineSelect } from '@/features/students/components/InlineSelect';
import { PaymentStatusBadgeDropdown, buildPaymentStatusLabels } from '../components/PaymentStatusBadgeDropdown';
import { SalaryStatusBadgeDropdown } from '../components/SalaryStatusBadgeDropdown';
import { Eye, FileText } from 'lucide-react';
import { SelectAllCheckbox } from '../components/SelectAllCheckbox';
import type { Payment, SalaryRecord, PaymentStatus, SalaryStatus } from '@/features/finance';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';
import { formatCurrency } from '@/shared/lib/utils';

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
  const t = useTranslations('finance');
  const { readParam } = useAppSearchUrl();

  const firstName = salary.teacher?.user?.firstName || '';
  const lastName = salary.teacher?.user?.lastName || '';
  const teacherName = `${firstName} ${lastName}`;
  const monthStr = getMonthString(salary);

  const tab = readParam('tab');
  const salariesPage = readParam('salariesPage');
  const salaryStatus = readParam('salaryStatus');
  const q = readParam('q');
  
  const params = new URLSearchParams();
  if (tab) params.set('tab', tab);
  if (salariesPage) params.set('salariesPage', salariesPage);
  if (salaryStatus) params.set('salaryStatus', salaryStatus);
  if (q) params.set('q', q);
  params.set('teacherName', encodeURIComponent(teacherName));
  
  const queryString = params.toString();
  const href = `/${locale}/admin/finance/teacher-salaries/${salary.teacherId}/${monthStr}${queryString ? `?${queryString}` : ''}`;
  
  return (
    <div className="flex items-center justify-start">
      <Link
        href={href}
        onClick={(e) => e.stopPropagation()}
        className="p-2 hover:bg-[#f6f6f7] rounded-lg transition-colors"
        aria-label={t('viewBreakdown')}
      >
        <Eye className="w-5 h-5 text-[#3b3b40]" />
      </Link>
    </div>
  );
}

const ADMIN_METHOD_OPTIONS = [
  { id: 'CASH', labelKey: 'methodCash' },
  { id: 'CARD', labelKey: 'methodCard' },
  { id: 'TERMINAL', labelKey: 'methodTerminal' },
] as const;

function formatMethodLabel(method: string | null | undefined, t: (key: string) => string): string {
  if (!method) return '—';
  const upper = method.toUpperCase();
  if (upper === 'CASH') return t('methodCash');
  if (upper === 'CARD') return t('methodCard');
  if (upper === 'IDRAM') return t('methodIdram');
  if (upper === 'TERMINAL') return t('methodTerminal');
  return method;
}

interface PaymentColumnsProps {
  t: (key: string) => string;
  updatePaymentStatus: {
    mutateAsync: (params: { id: string; status: PaymentStatus }) => Promise<void>;
    isPending: boolean;
  };
  updatePaymentMethod?: {
    mutateAsync: (params: { id: string; paymentMethod: string }) => Promise<void>;
    isPending: boolean;
  };
  allPaymentsSelected?: boolean;
  somePaymentsSelected?: boolean;
  selectedPaymentIds?: Set<string>;
  onSelectAllPayments?: () => void;
  onToggleSelectPayment?: (paymentId: string) => void;
  isLoadingPayments?: boolean;
  notAssignedLabel?: string;
}

export function getPaymentColumns({
  t,
  updatePaymentStatus,
  updatePaymentMethod,
  allPaymentsSelected = false,
  somePaymentsSelected = false,
  selectedPaymentIds = new Set(),
  onSelectAllPayments,
  onToggleSelectPayment,
  isLoadingPayments = false,
  notAssignedLabel = 'Not assigned',
}: PaymentColumnsProps) {
  const paymentStatusLabels = buildPaymentStatusLabels(t);
  const showCheckboxes = onSelectAllPayments != null && onToggleSelectPayment != null;
  const isPending = (p: Payment) => p.status === 'PENDING' || p.status === 'OVERDUE';
  const canEditMethod = updatePaymentMethod != null;

  const baseColumns = [
    ...(showCheckboxes
      ? [
          {
            key: 'checkbox',
            header: (
              <SelectAllCheckbox
                checked={allPaymentsSelected}
                indeterminate={somePaymentsSelected}
                onChange={onSelectAllPayments}
                disabled={isLoadingPayments}
              />
            ),
            className: '!pl-4 !pr-2 w-12',
            render: (payment: Payment) => (
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-[rgba(14,14,16,0.12)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                checked={selectedPaymentIds.has(payment.id)}
                onChange={() => onToggleSelectPayment(payment.id)}
                onClick={(e) => e.stopPropagation()}
                disabled={isLoadingPayments}
                aria-label={`Select payment for ${payment.student?.user?.firstName} ${payment.student?.user?.lastName}`}
              />
            ),
          },
        ]
      : []),
    {
      key: 'student',
      header: t('student'),
      render: (payment: Payment) => {
        const firstName = payment.student?.user?.firstName || '';
        const lastName = payment.student?.user?.lastName || '';
        const initials = `${firstName[0] || ''}${lastName[0] || ''}` || '?';
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#f1f1f2] flex items-center justify-center text-[#3b3b40] font-semibold">
              {initials}
            </div>
            <div>
              <p className="font-semibold text-[#3b3b40]">
                {firstName} {lastName}
              </p>
              <p className="text-sm text-[#8b8b90]">{payment.student?.user?.email || ''}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'amount',
      header: t('amount'),
      className: 'text-center',
      render: (payment: Payment) => {
        const amount = typeof payment.amount === 'string' ? parseFloat(payment.amount) : Number(payment.amount);
        return (
          <span className="font-semibold text-[#3b3b40]">
            {formatCurrency(amount)}
          </span>
        );
      },
    },
    {
      key: 'dueDate',
      header: t('dueDate'),
      className: 'text-center',
      render: (payment: Payment) => {
        const date = new Date(payment.dueDate);
        return (
          <span className="text-[#8b8b90]">
            {date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        );
      },
    },
    {
      key: 'method',
      header: t('method'),
      className: 'text-center',
      render: (payment: Payment) => {
        const pending = isPending(payment);
        const currentMethod = payment.paymentMethod ?? '';
        if (pending && canEditMethod) {
          return (
            <div className="flex justify-center">
              <div className="w-32">
                <InlineSelect
                value={currentMethod || null}
                placeholder={notAssignedLabel}
                options={ADMIN_METHOD_OPTIONS.map((o) => ({ id: o.id, label: t(o.labelKey) }))}
                onChange={async (newMethod) => {
                  if (newMethod && newMethod !== currentMethod) {
                    try {
                      await updatePaymentMethod?.mutateAsync({
                        id: payment.id,
                        paymentMethod: newMethod,
                      });
                    } catch (error) {
                      console.error('Failed to update payment method:', error);
                    }
                  }
                }}
                disabled={updatePaymentMethod?.isPending}
                className="w-full"
              />
              </div>
            </div>
          );
        }
        return (
          <span className="text-[#3b3b40]">{formatMethodLabel(payment.paymentMethod, t)}</span>
        );
      },
    },
    {
      key: 'status',
      header: t('status'),
      className: 'text-center',
      render: (payment: Payment) => (
        <div className="flex justify-center">
          <PaymentStatusBadgeDropdown
            status={payment.status}
            labels={paymentStatusLabels}
            notAssignedLabel={notAssignedLabel}
            disabled={updatePaymentStatus.isPending}
            onStatusChange={(newStatus) => {
              if (newStatus !== payment.status) {
                void updatePaymentStatus
                  .mutateAsync({
                    id: payment.id,
                    status: newStatus,
                  })
                  .catch((error) => {
                    console.error('Failed to update payment status:', error);
                  });
              }
            }}
          />
        </div>
      ),
    },
  ];
  return baseColumns;
}

interface SalaryColumnsProps {
  t: (key: string) => string;
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
  onOpenSalaryDetail?: (salaryId: string) => void;
  notAssignedLabel?: string;
}

export function getSalaryColumns({
  t,
  allSalariesSelected,
  someSalariesSelected,
  isLoadingSalaries,
  selectedSalaryIds,
  updateSalaryStatus,
  onSelectAll,
  onSelectOne,
  locale,
  onOpenSalaryDetail,
  notAssignedLabel = 'Not assigned',
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
      className: '!pl-4 !pr-2 w-12',
      render: (salary: SalaryRecord) => (
        <input
          type="checkbox"
          checked={selectedSalaryIds.has(salary.id)}
          onChange={(e) => onSelectOne(salary.id, e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          className="my-auto w-4 h-4 rounded border-[rgba(14,14,16,0.12)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoadingSalaries}
          aria-label={`Select salary for ${salary.teacher?.user?.firstName} ${salary.teacher?.user?.lastName}`}
        />
      ),
    },
    {
      key: 'teacher',
      header: t('teacher'),
      render: (salary: SalaryRecord) => {
        const firstName = salary.teacher?.user?.firstName || '';
        const lastName = salary.teacher?.user?.lastName || '';
        const initials = `${firstName[0] || ''}${lastName[0] || ''}` || '?';
        const email = salary.teacher?.user?.email || '';
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#f1f1f2] flex items-center justify-center text-[#3b3b40] font-semibold shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-[#3b3b40] truncate">
                {firstName} {lastName}
              </p>
              <p className="text-sm text-[#8b8b90] truncate">{email}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'month',
      header: t('month'),
      className: 'text-center',
      render: (salary: SalaryRecord) => {
        const date =
          salary.month && salary.year ? new Date(salary.year, salary.month - 1) : null;
        return (
          <span className="text-[#8b8b90]">
            {date ? date.toLocaleDateString(locale, { month: 'short', year: 'numeric' }) : '—'}
          </span>
        );
      },
    },
    {
      key: 'lessons',
      header: t('lessons'),
      className: 'text-center',
      render: (salary: SalaryRecord) => (
        <span className="text-[#3b3b40]">{salary.lessonsCount ?? 0}</span>
      ),
    },
    {
      key: 'deductions',
      header: t('deductions'),
      className: 'text-center',
      render: (salary: SalaryRecord) => {
        const amount =
          typeof salary.totalDeductions === 'string'
            ? parseFloat(salary.totalDeductions)
            : Number(salary.totalDeductions ?? 0);
        return (
          <span
            className={
              amount > 0
                ? 'font-medium text-red-600'
                : 'text-[#3b3b40]'
            }
          >
            {amount > 0 ? '−' : ''}
            {formatCurrency(amount)}
          </span>
        );
      },
    },
    {
      key: 'salary',
      header: t('netSalary'),
      className: 'text-center',
      render: (salary: SalaryRecord) => {
        const amount =
          typeof salary.netAmount === 'string' ? parseFloat(salary.netAmount) : Number(salary.netAmount);
        return (
          <span className="font-semibold text-[#3b3b40]">
            {formatCurrency(amount)}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: t('status'),
      className: 'text-center',
      render: (salary: SalaryRecord) => (
        <div className="flex justify-center">
          <SalaryStatusBadgeDropdown
            status={salary.status}
            pendingLabel={t('pending')}
            paidLabel={t('paid')}
            notAssignedLabel={notAssignedLabel}
            disabled={updateSalaryStatus.isPending}
            onStatusChange={(newStatus) => {
              if (newStatus !== salary.status) {
                void updateSalaryStatus
                  .mutateAsync({
                    id: salary.id,
                    status: newStatus,
                  })
                  .catch((error) => {
                    console.error('Failed to update salary status:', error);
                  });
              }
            }}
          />
        </div>
      ),
    },
    {
      key: 'action',
      header: t('actions'),
      className: 'text-center',
      render: (salary: SalaryRecord) => (
        <div className="flex items-center justify-center gap-1">
          {onOpenSalaryDetail ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenSalaryDetail(salary.id);
              }}
              className="p-2 hover:bg-[#f6f6f7] rounded-lg transition-colors"
              aria-label={t('viewSalaryDetails')}
            >
              <FileText className="w-5 h-5 text-[#3b3b40]" />
            </button>
          ) : null}
          <SalaryActionCell salary={salary} locale={locale} />
        </div>
      ),
    },
  ];
}

