'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import {
  useTeacherPerformance,
  useStudentRisk,
  useRevenueAnalytics,
  useAttendanceOverview,
} from '@/features/analytics';
import { cn } from '@/shared/lib/utils';

type ReportType = 'teachers' | 'students' | 'attendance' | 'revenue';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('hy-AM', {
    style: 'currency',
    currency: 'AMD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminReportsPage() {
  const t = useTranslations('analytics');
  const tHome = useTranslations('home');
  const [selectedReport, setSelectedReport] = useState<ReportType>('teachers');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch data based on selected report
  const { data: teachers = [] } = useTeacherPerformance(dateFrom, dateTo);
  const { data: students = [] } = useStudentRisk();
  const { data: revenue = [] } = useRevenueAnalytics(6);
  const { data: attendance } = useAttendanceOverview(dateFrom, dateTo);

  const reports: { id: ReportType; label: string; description: string; icon: React.ReactNode }[] = [
    {
      id: 'teachers',
      label: 'Teacher Performance',
      description: 'Lessons, completion rate, vocabulary, deductions',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: 'students',
      label: 'Student Risk Analysis',
      description: 'Attendance, risk levels, unjustified absences',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      id: 'attendance',
      label: 'Attendance Report',
      description: 'Daily attendance breakdown',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      id: 'revenue',
      label: 'Revenue Report',
      description: 'Income, expenses, profit by month',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  const handleExportCSV = () => {
    setIsExporting(true);
    
    let csvContent = '';
    let filename = '';

    switch (selectedReport) {
      case 'teachers':
        csvContent = 'Name,Email,Total Lessons,Completed,Completion Rate,Vocabulary Rate,Deductions,Salary Earned\n';
        teachers.forEach((t) => {
          csvContent += `"${t.name}","${t.email}",${t.totalLessons},${t.completedLessons},${t.completionRate}%,${t.vocabularySentRate}%,${t.deductionsAmount},${t.salaryEarned}\n`;
        });
        filename = `teacher-performance-${dateFrom}-${dateTo}.csv`;
        break;

      case 'students':
        csvContent = 'Name,Email,Group,Total Lessons,Present,Unjustified Absences,Attendance Rate,Risk Level\n';
        students.forEach((s) => {
          csvContent += `"${s.name}","${s.email}","${s.group?.name || ''}",${s.totalLessons},${s.present},${s.absentUnjustified},${s.attendanceRate}%,${s.riskLevel}\n`;
        });
        filename = `student-risk-analysis-${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'attendance':
        if (attendance) {
          csvContent = 'Date,Present,Absent\n';
          attendance.daily.forEach((d) => {
            csvContent += `${d.date},${d.present},${d.absent}\n`;
          });
        }
        filename = `attendance-report-${dateFrom}-${dateTo}.csv`;
        break;

      case 'revenue':
        csvContent = 'Month,Income,Expenses,Profit,Payments Count\n';
        revenue.forEach((r) => {
          csvContent += `"${r.monthName}",${r.income},${r.expenses},${r.profit},${r.paymentsCount}\n`;
        });
        filename = `revenue-report-6months.csv`;
        break;
    }

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();

    setTimeout(() => setIsExporting(false), 500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardLayout
      title={t('reports')}
      subtitle={t('reportsSubtitle')}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Report Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800">Report Type</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {reports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  className={cn(
                    'w-full p-4 text-left transition-colors flex items-start gap-3',
                    selectedReport === report.id
                      ? 'bg-blue-50 border-l-2 border-blue-600'
                      : 'hover:bg-slate-50'
                  )}
                >
                  <div className={cn(
                    'p-2 rounded-lg',
                    selectedReport === report.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                  )}>
                    {report.icon}
                  </div>
                  <div>
                    <p className={cn('font-medium', selectedReport === report.id ? 'text-blue-600' : 'text-slate-800')}>
                      {report.label}
                    </p>
                    <p className="text-xs text-slate-500">{report.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          {selectedReport !== 'revenue' && (
            <div className="mt-4 bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-800 mb-3">Date Range</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Export Actions */}
          <div className="mt-4 space-y-2">
            <button
              onClick={handleExportCSV}
              disabled={isExporting}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <button
              onClick={handlePrint}
              className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
          </div>
        </div>

        {/* Report Preview */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden print:border-none print:shadow-none">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between print:hidden">
              <div>
                <h3 className="font-semibold text-slate-800">
                  {reports.find((r) => r.id === selectedReport)?.label}
                </h3>
                <p className="text-sm text-slate-500">
                  {selectedReport === 'revenue' ? 'Last 6 months' : `${dateFrom} to ${dateTo}`}
                </p>
              </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block p-4 border-b">
              <h1 className="text-xl font-bold">{tHome('title')}</h1>
              <h2 className="text-lg">{reports.find((r) => r.id === selectedReport)?.label}</h2>
              <p className="text-sm text-slate-500">Generated: {new Date().toLocaleDateString()}</p>
            </div>

            <div className="overflow-x-auto">
              {/* Teachers Report */}
              {selectedReport === 'teachers' && (
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Teacher</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Lessons</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Completion</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Vocabulary</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">Deductions</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">Earned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teachers.map((t) => (
                      <tr key={t.id}>
                        <td className="px-4 py-3">
                          <p className="font-medium">{t.name}</p>
                          <p className="text-xs text-slate-500">{t.email}</p>
                        </td>
                        <td className="px-4 py-3 text-center">{t.completedLessons}/{t.totalLessons}</td>
                        <td className="px-4 py-3 text-center">{t.completionRate}%</td>
                        <td className="px-4 py-3 text-center">{t.vocabularySentRate}%</td>
                        <td className="px-4 py-3 text-right text-red-600">{formatCurrency(t.deductionsAmount)}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(t.salaryEarned)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Students Report */}
              {selectedReport === 'students' && (
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Student</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Group</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Attendance</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Rate</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Unjustified</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((s) => (
                      <tr key={s.id} className={s.riskLevel === 'HIGH' ? 'bg-red-50' : ''}>
                        <td className="px-4 py-3">
                          <p className="font-medium">{s.name}</p>
                          <p className="text-xs text-slate-500">{s.email}</p>
                        </td>
                        <td className="px-4 py-3">{s.group?.name || '-'}</td>
                        <td className="px-4 py-3 text-center">{s.present}/{s.totalLessons}</td>
                        <td className="px-4 py-3 text-center">{s.attendanceRate}%</td>
                        <td className="px-4 py-3 text-center text-red-600">{s.absentUnjustified}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            'px-2 py-1 text-xs font-medium rounded',
                            s.riskLevel === 'HIGH' ? 'bg-red-100 text-red-700' :
                            s.riskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          )}>
                            {s.riskLevel}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Attendance Report */}
              {selectedReport === 'attendance' && attendance && (
                <>
                  <div className="p-4 bg-slate-50 border-b">
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-slate-800">{attendance.summary.total}</p>
                        <p className="text-sm text-slate-500">Total Records</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">{attendance.summary.present}</p>
                        <p className="text-sm text-slate-500">Present</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-red-600">{attendance.summary.absentUnjustified}</p>
                        <p className="text-sm text-slate-500">Unjustified</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{attendance.summary.attendanceRate}%</p>
                        <p className="text-sm text-slate-500">Rate</p>
                      </div>
                    </div>
                  </div>
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Date</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Present</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Absent</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attendance.daily.map((d) => {
                        const total = d.present + d.absent;
                        const rate = total > 0 ? Math.round((d.present / total) * 100) : 0;
                        return (
                          <tr key={d.date}>
                            <td className="px-4 py-3 font-medium">{d.date}</td>
                            <td className="px-4 py-3 text-center text-green-600">{d.present}</td>
                            <td className="px-4 py-3 text-center text-red-600">{d.absent}</td>
                            <td className="px-4 py-3 text-center">{rate}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </>
              )}

              {/* Revenue Report */}
              {selectedReport === 'revenue' && (
                <>
                  <div className="p-4 bg-slate-50 border-b">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(revenue.reduce((s, r) => s + r.income, 0))}
                        </p>
                        <p className="text-sm text-slate-500">Total Income</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-red-600">
                          {formatCurrency(revenue.reduce((s, r) => s + r.expenses, 0))}
                        </p>
                        <p className="text-sm text-slate-500">Total Expenses</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(revenue.reduce((s, r) => s + r.profit, 0))}
                        </p>
                        <p className="text-sm text-slate-500">Net Profit</p>
                      </div>
                    </div>
                  </div>
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Month</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">Income</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">Expenses</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">Profit</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Payments</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {revenue.map((r) => (
                        <tr key={r.month}>
                          <td className="px-4 py-3 font-medium">{r.monthName}</td>
                          <td className="px-4 py-3 text-right text-green-600">{formatCurrency(r.income)}</td>
                          <td className="px-4 py-3 text-right text-red-600">{formatCurrency(r.expenses)}</td>
                          <td className={cn('px-4 py-3 text-right font-medium', r.profit >= 0 ? 'text-blue-600' : 'text-orange-600')}>
                            {formatCurrency(r.profit)}
                          </td>
                          <td className="px-4 py-3 text-center">{r.paymentsCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
