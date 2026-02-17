'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { StatCard, DataTable, Badge, Button } from '@/shared/components/ui';
import {
  useFinanceDashboard,
  usePayments,
  useSalaries,
  useProcessPayment,
  useProcessSalary,
  type Payment,
  type SalaryRecord,
  type PaymentStatus,
  type SalaryStatus,
} from '@/features/finance';

export default function FinancePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Initialize state from URL params
  const [activeTab, setActiveTab] = useState<'payments' | 'salaries'>(() => {
    const tabFromUrl = searchParams.get('tab');
    return (tabFromUrl === 'payments' || tabFromUrl === 'salaries') ? tabFromUrl : 'payments';
  });
  const [paymentsPage, setPaymentsPage] = useState(() => {
    const page = parseInt(searchParams.get('paymentsPage') || '0', 10);
    return isNaN(page) ? 0 : Math.max(0, page);
  });
  const [salariesPage, setSalariesPage] = useState(() => {
    const page = parseInt(searchParams.get('salariesPage') || '0', 10);
    return isNaN(page) ? 0 : Math.max(0, page);
  });
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | ''>(() => {
    const status = searchParams.get('paymentStatus') as PaymentStatus | null;
    return status && ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED'].includes(status) ? status : '';
  });
  const [salaryStatus, setSalaryStatus] = useState<SalaryStatus | ''>(() => {
    const status = searchParams.get('salaryStatus') as SalaryStatus | null;
    return status && ['PENDING', 'PAID'].includes(status) ? status : '';
  });
  
  const t = useTranslations('finance');
  const tTeachers = useTranslations('teachers');
  const pageSize = 10;

  // Update URL params when filters change
  const updateUrlParams = useCallback((updates: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === 0) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  // Handle tab change
  const handleTabChange = (tab: 'payments' | 'salaries') => {
    setActiveTab(tab);
    updateUrlParams({ tab });
  };

  // Handle search change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (activeTab === 'payments') {
      setPaymentsPage(0);
      updateUrlParams({ q: value || null, paymentsPage: null });
    } else {
      setSalariesPage(0);
      updateUrlParams({ q: value || null, salariesPage: null });
    }
  };

  // Handle payment status change
  const handlePaymentStatusChange = (status: PaymentStatus | '') => {
    setPaymentStatus(status);
    setPaymentsPage(0);
    updateUrlParams({ paymentStatus: status || null, paymentsPage: null });
  };

  // Handle salary status change
  const handleSalaryStatusChange = (status: SalaryStatus | '') => {
    setSalaryStatus(status);
    setSalariesPage(0);
    updateUrlParams({ salaryStatus: status || null, salariesPage: null });
  };

  // Handle page changes
  const handlePaymentsPageChange = (page: number) => {
    setPaymentsPage(page);
    updateUrlParams({ paymentsPage: page || null });
  };

  const handleSalariesPageChange = (page: number) => {
    setSalariesPage(page);
    updateUrlParams({ salariesPage: page || null });
  };

  // Fetch dashboard stats
  const { data: dashboard, isLoading: isLoadingDashboard } = useFinanceDashboard();

  // Fetch payments
  const { 
    data: paymentsData, 
    isLoading: isLoadingPayments 
  } = usePayments({
    skip: paymentsPage * pageSize,
    take: pageSize,
    status: paymentStatus || undefined,
  });

  // Fetch salaries
  const {
    data: salariesData,
    isLoading: isLoadingSalaries,
  } = useSalaries({
    skip: salariesPage * pageSize,
    take: pageSize,
    status: salaryStatus || undefined,
  });

  // Mutations
  const processPayment = useProcessPayment();
  const processSalary = useProcessSalary();

  const payments = paymentsData?.items || [];
  const totalPayments = paymentsData?.total || 0;
  const paymentsTotalPages = paymentsData?.totalPages || 1;

  const salaries = salariesData?.items || [];
  const totalSalaries = salariesData?.total || 0;
  const salariesTotalPages = salariesData?.totalPages || 1;

  const isLoading = activeTab === 'payments' ? isLoadingPayments : isLoadingSalaries;

  // Handle process payment
  const handleProcessPayment = async (id: string) => {
    try {
      await processPayment.mutateAsync({ id });
    } catch (err) {
      console.error('Failed to process payment:', err);
    }
  };

  // Handle process salary
  const handleProcessSalary = async (id: string) => {
    try {
      await processSalary.mutateAsync(id);
    } catch (err) {
      console.error('Failed to process salary:', err);
    }
  };

  // Format month/year
  const formatMonth = (month: number, year: number) => {
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const paymentColumns = [
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
      render: (payment: Payment) => {
        switch (payment.status) {
          case 'PAID':
            return <Badge variant="success">{t('paid')}</Badge>;
          case 'PENDING':
            return <Badge variant="warning">{t('pending')}</Badge>;
          case 'OVERDUE':
            return (
              <div className="flex items-center gap-2">
                <span className="text-red-500">!</span>
                <Badge variant="error">{t('overdue')}</Badge>
              </div>
            );
          case 'CANCELLED':
            return <Badge variant="default">{t('cancelled')}</Badge>;
          case 'REFUNDED':
            return <Badge variant="info">{t('refunded')}</Badge>;
          default:
            return <Badge variant="default">{payment.status}</Badge>;
        }
      },
    },
    {
      key: 'actions',
      header: t('actions'),
      render: (payment: Payment) => (
        payment.status !== 'PAID' && payment.status !== 'CANCELLED' ? (
          <Button 
            size="sm" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm"
            onClick={() => handleProcessPayment(payment.id)}
            disabled={processPayment.isPending}
          >
            {t('markPaid')}
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="text-primary text-sm">
            {t('view')}
          </Button>
        )
      ),
    },
  ];

  const salaryColumns = [
    {
      key: 'teacher',
      header: t('teacher'),
      render: (salary: SalaryRecord) => {
        const firstName = salary.teacher?.user?.firstName || '';
        const lastName = salary.teacher?.user?.lastName || '';
        const initials = `${firstName[0] || ''}${lastName[0] || ''}` || '?';
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold">
              {initials}
            </div>
            <span className="font-semibold text-slate-800">
              {firstName} {lastName}
            </span>
          </div>
        );
      },
    },
    {
      key: 'period',
      header: t('period'),
      render: (salary: SalaryRecord) => (
        <span className="text-slate-700">{formatMonth(salary.month, salary.year)}</span>
      ),
    },
    {
      key: 'lessons',
      header: tTeachers('lessons'),
      className: 'text-center',
      render: (salary: SalaryRecord) => (
        <span className="text-slate-700">{salary.lessonsCount}</span>
      ),
    },
    {
      key: 'obligations',
      header: 'Obligations',
      className: 'text-center',
      render: (salary: SalaryRecord) => {
        // Use obligationsInfo from response or parse from notes
        const obligationsInfo = salary.obligationsInfo || (salary.notes ? (() => {
          try {
            return JSON.parse(salary.notes);
          } catch {
            return null;
          }
        })() : null);
        
        if (obligationsInfo && obligationsInfo.completed !== undefined && obligationsInfo.required !== undefined) {
          return (
            <span className="text-slate-700 font-medium">
              {obligationsInfo.completed}/{obligationsInfo.required}
            </span>
          );
        }
        
        return <span className="text-slate-400">-</span>;
      },
    },
    {
      key: 'gross',
      header: t('salaryAmount'),
      className: 'text-right',
      render: (salary: SalaryRecord) => {
        const amount = typeof salary.grossAmount === 'string' ? parseFloat(salary.grossAmount) : Number(salary.grossAmount);
        return (
          <span className="text-slate-700">
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
      key: 'deductions',
      header: 'Deductions',
      className: 'text-right',
      render: (salary: SalaryRecord) => {
        const amount = typeof salary.totalDeductions === 'string' ? parseFloat(salary.totalDeductions) : Number(salary.totalDeductions);
        return amount > 0 ? (
          <span className="text-red-500 font-medium">
            -{new Intl.NumberFormat('hy-AM', {
              style: 'currency',
              currency: 'AMD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(amount)}
          </span>
        ) : (
          <span className="text-slate-400">
            {new Intl.NumberFormat('hy-AM', {
              style: 'currency',
              currency: 'AMD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(0)}
          </span>
        );
      },
    },
    {
      key: 'net',
      header: t('netSalary'),
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
      header: t('status'),
      render: (salary: SalaryRecord) => (
        salary.status === 'PAID' ? (
          <Badge variant="success">Paid</Badge>
        ) : (
          <Badge variant="warning">Pending</Badge>
        )
      ),
    },
    {
      key: 'actions',
      header: t('actions'),
      render: (salary: SalaryRecord) => (
        salary.status === 'PENDING' ? (
          <Button 
            size="sm" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm"
            onClick={() => handleProcessSalary(salary.id)}
            disabled={processSalary.isPending}
          >
            Process
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="text-primary text-sm">
            Details
          </Button>
        )
      ),
    },
  ];

  return (
    <DashboardLayout 
      title={t('title')} 
      subtitle={t('adminSubtitle')}
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title={t('totalRevenue')}
            value={new Intl.NumberFormat('hy-AM', {
              style: 'currency',
              currency: 'AMD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(dashboard?.revenue?.totalRevenue || 0)}
            change={{ value: '+8.2%', type: 'positive' }}
          />
          <StatCard
            title={t('pendingPayments')}
            value={new Intl.NumberFormat('hy-AM', {
              style: 'currency',
              currency: 'AMD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(dashboard?.pendingPayments?.totalPending || 0)}
            change={{ 
              value: t('pendingCount', { count: dashboard?.pendingPayments?.count || 0 }), 
              type: (dashboard?.pendingPayments?.overdueCount || 0) > 0 ? 'warning' : 'neutral' 
            }}
          />
          <StatCard
            title={t('totalExpenses')}
            value={new Intl.NumberFormat('hy-AM', {
              style: 'currency',
              currency: 'AMD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(dashboard?.expenses?.totalExpenses || 0)}
            change={{ value: t('salariesPaid', { count: dashboard?.expenses?.salariesPaid || 0 }), type: 'neutral' }}
          />
          <StatCard
            title={t('netProfit')}
            value={new Intl.NumberFormat('hy-AM', {
              style: 'currency',
              currency: 'AMD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(dashboard?.profit || 0)}
            change={{ value: dashboard?.profit && dashboard.profit > 0 ? 'Positive' : 'Review needed', type: dashboard?.profit && dashboard.profit > 0 ? 'positive' : 'warning' }}
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 border-b border-slate-200">
          <button
            onClick={() => handleTabChange('payments')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'payments'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Student Payments ({totalPayments})
          </button>
          <button
            onClick={() => handleTabChange('salaries')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'salaries'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Teacher Salaries ({totalSalaries})
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={`Search ${activeTab === 'payments' ? 'payments' : 'salaries'}...`}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          {/* Status Filter */}
          <div className="relative">
            <select
              value={activeTab === 'payments' ? paymentStatus : salaryStatus}
              onChange={(e) => {
                if (activeTab === 'payments') {
                  handlePaymentStatusChange(e.target.value as PaymentStatus | '');
                } else {
                  handleSalaryStatusChange(e.target.value as SalaryStatus | '');
                }
              }}
              className="pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer min-w-[160px]"
            >
              <option value="">All statuses</option>
              {activeTab === 'payments' ? (
                <>
                  <option value="PENDING">{t('pending')}</option>
                  <option value="PAID">{t('paid')}</option>
                  <option value="OVERDUE">{t('overdue')}</option>
                  <option value="CANCELLED">{t('cancelled')}</option>
                  <option value="REFUNDED">{t('refunded')}</option>
                </>
              ) : (
                <>
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                </>
              )}
            </select>
            <svg 
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          {activeTab === 'payments' ? (
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-medium">
              + Record Payment
            </Button>
          ) : (
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-medium">
              Generate Monthly
            </Button>
          )}
          <button className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>

        {/* Table */}
        {activeTab === 'payments' ? (
          <>
            <DataTable
              columns={paymentColumns}
              data={payments}
              keyExtractor={(payment) => payment.id}
              isLoading={isLoading || isLoadingDashboard}
              emptyMessage="No payments found"
            />
            {/* Pagination */}
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>
                Showing {Math.min(paymentsPage * pageSize + 1, totalPayments)}-{Math.min((paymentsPage + 1) * pageSize, totalPayments)} of {totalPayments}
              </span>
              <div className="flex items-center gap-2">
                <button 
                  className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50" 
                  disabled={paymentsPage === 0}
                  onClick={() => handlePaymentsPageChange(Math.max(0, paymentsPage - 1))}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span>Page {paymentsPage + 1} of {paymentsTotalPages || 1}</span>
                <button 
                  className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50"
                  disabled={paymentsPage >= paymentsTotalPages - 1}
                  onClick={() => handlePaymentsPageChange(paymentsPage + 1)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DataTable
              columns={salaryColumns}
              data={salaries}
              keyExtractor={(salary) => salary.id}
              isLoading={isLoading || isLoadingDashboard}
              emptyMessage="No salary records found"
            />
            {/* Pagination */}
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>
                Showing {Math.min(salariesPage * pageSize + 1, totalSalaries)}-{Math.min((salariesPage + 1) * pageSize, totalSalaries)} of {totalSalaries}
              </span>
              <div className="flex items-center gap-2">
                <button 
                  className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50" 
                  disabled={salariesPage === 0}
                  onClick={() => handleSalariesPageChange(Math.max(0, salariesPage - 1))}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span>Page {salariesPage + 1} of {salariesTotalPages || 1}</span>
                <button 
                  className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50"
                  disabled={salariesPage >= salariesTotalPages - 1}
                  onClick={() => handleSalariesPageChange(salariesPage + 1)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-50 rounded-xl">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 mb-2">Overdue Payments</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {dashboard?.pendingPayments?.overdueCount || 0} payments are overdue. 
                  Send automated reminders to improve collection rates.
                </p>
                <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/90">
                  Send Reminders
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 mb-2">Monthly Report</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Generate comprehensive financial reports for accounting and business analysis.
                </p>
                <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/90">
                  Generate Report
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
