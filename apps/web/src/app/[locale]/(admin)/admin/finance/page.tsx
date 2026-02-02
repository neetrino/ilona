'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { StatCard, DataTable, Badge, Button } from '@/shared/components/ui';

interface Payment {
  id: string;
  student: {
    firstName: string;
    lastName: string;
    email: string;
  };
  amount: number;
  month: string;
  status: 'paid' | 'pending' | 'overdue';
  paidAt?: string;
  dueDate: string;
}

interface SalaryRecord {
  id: string;
  teacher: {
    firstName: string;
    lastName: string;
  };
  lessonsCount: number;
  grossAmount: number;
  deductions: number;
  netAmount: number;
  status: 'pending' | 'paid';
}

export default function FinancePage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'payments' | 'salaries'>('payments');

  useEffect(() => {
    // Mock data
    setPayments([
      { id: '1', student: { firstName: 'Anna', lastName: 'Kowalski', email: 'anna.k@student.edu' }, amount: 150, month: 'January 2026', status: 'paid', paidAt: '2026-01-15', dueDate: '2026-01-10' },
      { id: '2', student: { firstName: 'Michael', lastName: 'Brown', email: 'm.brown@student.edu' }, amount: 150, month: 'January 2026', status: 'pending', dueDate: '2026-01-10' },
      { id: '3', student: { firstName: 'Sofia', lastName: 'Garcia', email: 'sofia.g@student.edu' }, amount: 200, month: 'January 2026', status: 'paid', paidAt: '2026-01-08', dueDate: '2026-01-10' },
      { id: '4', student: { firstName: 'James', lastName: 'Wilson', email: 'j.wilson@student.edu' }, amount: 175, month: 'January 2026', status: 'overdue', dueDate: '2026-01-10' },
    ]);

    setSalaries([
      { id: '1', teacher: { firstName: 'Sarah', lastName: 'Jenkins' }, lessonsCount: 48, grossAmount: 1200, deductions: 30, netAmount: 1170, status: 'pending' },
      { id: '2', teacher: { firstName: 'Marcus', lastName: 'Thorne' }, lessonsCount: 36, grossAmount: 1080, deductions: 0, netAmount: 1080, status: 'paid' },
      { id: '3', teacher: { firstName: 'Elena', lastName: 'Rodriguez' }, lessonsCount: 24, grossAmount: 528, deductions: 15, netAmount: 513, status: 'pending' },
    ]);

    setIsLoading(false);
  }, []);

  const stats = {
    totalRevenue: 156750,
    pendingPayments: 23400,
    totalSalaries: 12500,
    netProfit: 120850,
  };

  const paymentColumns = [
    {
      key: 'student',
      header: 'Student',
      render: (payment: Payment) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold">
            {payment.student.firstName[0]}{payment.student.lastName[0]}
          </div>
          <div>
            <p className="font-semibold text-slate-800">
              {payment.student.firstName} {payment.student.lastName}
            </p>
            <p className="text-sm text-slate-500">{payment.student.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'month',
      header: 'Month',
      render: (payment: Payment) => <span className="text-slate-700">{payment.month}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      className: 'text-right',
      render: (payment: Payment) => (
        <span className="font-semibold text-slate-800">${payment.amount}</span>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (payment: Payment) => (
        <span className="text-slate-500">{new Date(payment.dueDate).toLocaleDateString()}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (payment: Payment) => {
        switch (payment.status) {
          case 'paid':
            return <Badge variant="success">Paid</Badge>;
          case 'pending':
            return <Badge variant="warning">Pending</Badge>;
          case 'overdue':
            return (
              <div className="flex items-center gap-2">
                <span className="text-red-500">!</span>
                <Badge variant="error">Overdue</Badge>
              </div>
            );
        }
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (payment: Payment) => (
        payment.status !== 'paid' ? (
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-sm">
            Mark Paid
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="text-blue-600 text-sm">
            View Receipt
          </Button>
        )
      ),
    },
  ];

  const salaryColumns = [
    {
      key: 'teacher',
      header: 'Teacher',
      render: (salary: SalaryRecord) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold">
            {salary.teacher.firstName[0]}{salary.teacher.lastName[0]}
          </div>
          <span className="font-semibold text-slate-800">
            {salary.teacher.firstName} {salary.teacher.lastName}
          </span>
        </div>
      ),
    },
    {
      key: 'lessons',
      header: 'Lessons',
      className: 'text-center',
      render: (salary: SalaryRecord) => (
        <span className="text-slate-700">{salary.lessonsCount}</span>
      ),
    },
    {
      key: 'gross',
      header: 'Gross',
      className: 'text-right',
      render: (salary: SalaryRecord) => (
        <span className="text-slate-700">${salary.grossAmount}</span>
      ),
    },
    {
      key: 'deductions',
      header: 'Deductions',
      className: 'text-right',
      render: (salary: SalaryRecord) => (
        salary.deductions > 0 ? (
          <span className="text-red-500">-${salary.deductions}</span>
        ) : (
          <span className="text-slate-400">$0</span>
        )
      ),
    },
    {
      key: 'net',
      header: 'Net Amount',
      className: 'text-right',
      render: (salary: SalaryRecord) => (
        <span className="font-semibold text-slate-800">${salary.netAmount}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (salary: SalaryRecord) => (
        salary.status === 'paid' ? (
          <Badge variant="success">Paid</Badge>
        ) : (
          <Badge variant="warning">Pending</Badge>
        )
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (salary: SalaryRecord) => (
        salary.status === 'pending' ? (
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-sm">
            Process
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="text-blue-600 text-sm">
            Details
          </Button>
        )
      ),
    },
  ];

  return (
    <DashboardLayout 
      title="Finance Management" 
      subtitle="Track revenue, payments and teacher salaries."
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Total Revenue"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            change={{ value: '+8.2%', type: 'positive' }}
          />
          <StatCard
            title="Pending Payments"
            value={`$${stats.pendingPayments.toLocaleString()}`}
            change={{ value: '156 students', type: 'warning' }}
          />
          <StatCard
            title="Salaries (This Month)"
            value={`$${stats.totalSalaries.toLocaleString()}`}
          />
          <StatCard
            title="Net Profit"
            value={`$${stats.netProfit.toLocaleString()}`}
            change={{ value: '+12.5%', type: 'positive' }}
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'payments'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Student Payments
          </button>
          <button
            onClick={() => setActiveTab('salaries')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'salaries'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Teacher Salaries
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              placeholder={`Search ${activeTab === 'payments' ? 'payments' : 'salaries'}...`}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          {activeTab === 'payments' ? (
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium">
              + Record Payment
            </Button>
          ) : (
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium">
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
          <DataTable
            columns={paymentColumns}
            data={payments}
            keyExtractor={(payment) => payment.id}
            isLoading={isLoading}
            emptyMessage="No payments found"
          />
        ) : (
          <DataTable
            columns={salaryColumns}
            data={salaries}
            keyExtractor={(salary) => salary.id}
            isLoading={isLoading}
            emptyMessage="No salary records found"
          />
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
                  12 payments are overdue totaling $1,800. Send automated reminders to improve collection rates.
                </p>
                <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
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
              <div className="p-3 bg-blue-50 rounded-xl">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 mb-2">Monthly Report</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Generate comprehensive financial reports for accounting and business analysis.
                </p>
                <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
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


