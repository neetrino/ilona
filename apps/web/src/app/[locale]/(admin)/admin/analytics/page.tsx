'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import {
  useTeacherPerformance,
  useStudentRisk,
  useRevenueAnalytics,
  useAttendanceOverview,
  useLessonsOverview,
  type TeacherPerformance,
  type StudentRisk,
} from '@/features/analytics';
import { cn } from '@/shared/lib/utils';

type TabType = 'overview' | 'teachers' | 'students' | 'revenue';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('hy-AM', {
    style: 'currency',
    currency: 'AMD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function RiskBadge({ level }: { level: 'LOW' | 'MEDIUM' | 'HIGH' }) {
  const styles = {
    LOW: { bg: 'bg-green-100', text: 'text-green-700', label: '🟢 Low Risk' },
    MEDIUM: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '🟡 Medium Risk' },
    HIGH: { bg: 'bg-red-100', text: 'text-red-700', label: '🔴 High Risk' },
  };

  const style = styles[level];

  return (
    <span className={cn('px-2 py-1 text-xs font-medium rounded-full', style.bg, style.text)}>
      {style.label}
    </span>
  );
}

function ProgressBar({ value, max = 100, color = 'blue' }: { value: number; max?: number; color?: string }) {
  const percentage = Math.min((value / max) * 100, 100);
  const colors: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  return (
    <div className="w-full bg-slate-200 rounded-full h-2">
      <div
        className={cn('h-2 rounded-full transition-all', colors[color] || colors.blue)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

function TeacherRow({ teacher }: { teacher: TeacherPerformance }) {
  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3">
        <div>
          <p className="font-medium text-slate-800">{teacher.name}</p>
          <p className="text-xs text-slate-500">{teacher.email}</p>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="font-semibold">{teacher.completedLessons}</span>
        <span className="text-slate-400">/{teacher.totalLessons}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <ProgressBar 
            value={teacher.completionRate} 
            color={teacher.completionRate >= 90 ? 'green' : teacher.completionRate >= 70 ? 'yellow' : 'red'} 
          />
          <span className="text-sm font-medium w-12">{teacher.completionRate}%</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <ProgressBar 
            value={teacher.vocabularySentRate} 
            color={teacher.vocabularySentRate >= 90 ? 'green' : teacher.vocabularySentRate >= 70 ? 'yellow' : 'red'} 
          />
          <span className="text-sm font-medium w-12">{teacher.vocabularySentRate}%</span>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        {teacher.deductionsCount > 0 ? (
          <span className="text-red-600 font-medium">
            {teacher.deductionsCount} ({formatCurrency(teacher.deductionsAmount)})
          </span>
        ) : (
          <span className="text-green-600">None</span>
        )}
      </td>
      <td className="px-4 py-3 text-right font-semibold text-slate-800">
        {formatCurrency(teacher.salaryEarned)}
      </td>
    </tr>
  );
}

function StudentRiskRow({ student }: { student: StudentRisk }) {
  return (
    <tr className={cn('hover:bg-slate-50', student.riskLevel === 'HIGH' && 'bg-red-50')}>
      <td className="px-4 py-3">
        <div>
          <p className="font-medium text-slate-800">{student.name}</p>
          <p className="text-xs text-slate-500">{student.email}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-slate-600">{student.group?.name || 'No group'}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="font-semibold">{student.present}</span>
        <span className="text-slate-400">/{student.totalLessons}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <ProgressBar 
            value={student.attendanceRate} 
            color={student.attendanceRate >= 90 ? 'green' : student.attendanceRate >= 70 ? 'yellow' : 'red'} 
          />
          <span className="text-sm font-medium w-12">{student.attendanceRate}%</span>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        {student.absentUnjustified > 0 ? (
          <span className="text-red-600 font-medium">{student.absentUnjustified}</span>
        ) : (
          <span className="text-green-600">0</span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        <RiskBadge level={student.riskLevel} />
      </td>
    </tr>
  );
}

export default function AdminAnalyticsPage() {
  const tCommon = useTranslations('common');
  const t = useTranslations('analytics');
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Fetch data
  const { data: teachers = [], isLoading: isLoadingTeachers } = useTeacherPerformance();
  const { data: students = [], isLoading: isLoadingStudents } = useStudentRisk();
  const { data: revenue = [], isLoading: isLoadingRevenue } = useRevenueAnalytics(6);
  const { data: attendance, isLoading: isLoadingAttendance } = useAttendanceOverview();
  const { data: lessons, isLoading: isLoadingLessons } = useLessonsOverview();

  // Calculate totals
  const totalIncome = revenue.reduce((sum, r) => sum + r.income, 0);
  const totalExpenses = revenue.reduce((sum, r) => sum + r.expenses, 0);
  const totalProfit = totalIncome - totalExpenses;
  const highRiskStudents = students.filter((s) => s.riskLevel === 'HIGH').length;

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'teachers', label: 'Teacher Performance' },
    { id: 'students', label: 'Student Risk' },
    { id: 'revenue', label: 'Revenue' },
  ];

  return (
    <DashboardLayout
      title={t('title')}
      subtitle={t('adminSubtitle')}
    >
      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-3 text-sm font-medium transition-colors relative',
              activeTab === tab.id
                ? 'text-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">Total Income (6mo)</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">Total Expenses (6mo)</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">Net Profit (6mo)</p>
              <p className={cn('text-2xl font-bold', totalProfit >= 0 ? 'text-green-600' : 'text-red-600')}>
                {formatCurrency(totalProfit)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">High Risk Students</p>
              <p className={cn('text-2xl font-bold', highRiskStudents > 0 ? 'text-red-600' : 'text-green-600')}>
                {highRiskStudents}
              </p>
            </div>
          </div>

          {/* Lessons & Attendance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Lessons Overview (Last 30 days)</h3>
              {isLoadingLessons ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3].map((i) => <div key={i} className="h-4 bg-slate-200 rounded" />)}
                </div>
              ) : lessons && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Total Lessons</span>
                    <span className="font-semibold">{lessons.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Completed</span>
                    <span className="font-semibold text-green-600">{lessons.completed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Completion Rate</span>
                    <span className="font-semibold">{lessons.completionRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Vocabulary Sent Rate</span>
                    <span className={cn('font-semibold', lessons.vocabularySentRate >= 90 ? 'text-green-600' : 'text-yellow-600')}>
                      {lessons.vocabularySentRate}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Attendance Overview (Last 30 days)</h3>
              {isLoadingAttendance ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3].map((i) => <div key={i} className="h-4 bg-slate-200 rounded" />)}
                </div>
              ) : attendance && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Total Records</span>
                    <span className="font-semibold">{attendance.summary.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Present</span>
                    <span className="font-semibold text-green-600">{attendance.summary.present}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Unjustified Absences</span>
                    <span className={cn('font-semibold', attendance.summary.absentUnjustified > 0 ? 'text-red-600' : 'text-green-600')}>
                      {attendance.summary.absentUnjustified}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Attendance Rate</span>
                    <span className="font-semibold">{attendance.summary.attendanceRate}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Top Risk Students */}
          {highRiskStudents > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h3 className="font-semibold text-red-800 mb-3">⚠️ Students Requiring Attention</h3>
              <div className="space-y-2">
                {students.filter((s) => s.riskLevel === 'HIGH').slice(0, 5).map((student) => (
                  <div key={student.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                    <div>
                      <p className="font-medium text-slate-800">{student.name}</p>
                      <p className="text-sm text-slate-500">{student.group?.name} • {student.absentUnjustified} unjustified absences</p>
                    </div>
                    <RiskBadge level={student.riskLevel} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Teachers Tab */}
      {activeTab === 'teachers' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Teacher</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Lessons</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Completion Rate</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Vocabulary Rate</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Deductions</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingTeachers ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">{tCommon('loading')}</td>
                  </tr>
                ) : teachers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No teachers found</td>
                  </tr>
                ) : (
                  teachers.map((teacher) => <TeacherRow key={teacher.id} teacher={teacher} />)
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-800">Student Risk Analysis</h3>
              <p className="text-sm text-slate-500">Students sorted by risk level</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                High: {students.filter((s) => s.riskLevel === 'HIGH').length}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                Medium: {students.filter((s) => s.riskLevel === 'MEDIUM').length}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Low: {students.filter((s) => s.riskLevel === 'LOW').length}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Student</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Group</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Attendance</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Rate</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Unjustified</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingStudents ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">{tCommon('loading')}</td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No students found</td>
                  </tr>
                ) : (
                  students.map((student) => <StudentRiskRow key={student.id} student={student} />)
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm text-green-600 mb-1">Total Income</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-600 mb-1">Total Expenses</p>
              <p className="text-2xl font-bold text-red-700">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className={cn('rounded-xl p-4 border', totalProfit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200')}>
              <p className={cn('text-sm mb-1', totalProfit >= 0 ? 'text-blue-600' : 'text-orange-600')}>Net Profit</p>
              <p className={cn('text-2xl font-bold', totalProfit >= 0 ? 'text-blue-700' : 'text-orange-700')}>
                {formatCurrency(totalProfit)}
              </p>
            </div>
          </div>

          {/* Monthly Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800">Monthly Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
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
                  {isLoadingRevenue ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">{tCommon('loading')}</td>
                    </tr>
                  ) : revenue.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No data available</td>
                    </tr>
                  ) : (
                    revenue.map((r) => (
                      <tr key={r.month} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">{r.monthName}</td>
                        <td className="px-4 py-3 text-right text-green-600 font-medium">{formatCurrency(r.income)}</td>
                        <td className="px-4 py-3 text-right text-red-600 font-medium">{formatCurrency(r.expenses)}</td>
                        <td className={cn('px-4 py-3 text-right font-semibold', r.profit >= 0 ? 'text-blue-600' : 'text-orange-600')}>
                          {formatCurrency(r.profit)}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600">{r.paymentsCount}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
