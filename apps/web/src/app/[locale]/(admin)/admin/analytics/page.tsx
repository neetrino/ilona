'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import {
  useTeacherPerformance,
  useStudentRisk,
  useRevenueAnalyticsByRange,
  useAttendanceOverview,
  TeacherRatioTable,
  type StudentRisk,
} from '@/features/analytics';
import { AnalyticsTimeFilterBar } from '@/shared/components/analytics/AnalyticsTimeFilterBar';
import {
  buildTimeRange,
  resolveRevenueApiSeries,
} from '@/shared/lib/analytics-time-range';
import { cn, formatCurrency } from '@/shared/lib/utils';
import { useAdminAnalyticsUrl, type AdminAnalyticsTab } from './use-admin-analytics-url';
import { useAdminPaymentsTimeFilter } from './use-payments-time-filter';

function RiskBadge({ level }: { level: 'LOW' | 'MEDIUM' | 'HIGH' }) {
  const styles = {
    LOW: { bg: 'bg-green-100', text: 'text-green-700', label: 'Low Risk' },
    MEDIUM: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Medium Risk' },
    HIGH: { bg: 'bg-red-100', text: 'text-red-700', label: 'High Risk' },
  };
  const style = styles[level];
  return (
    <span
      className={cn(
        'px-2 py-1 text-xs font-medium rounded-full',
        style.bg,
        style.text,
      )}
    >
      {style.label}
    </span>
  );
}

function ProgressBar({
  value,
  color,
}: {
  value: number;
  color: 'green' | 'yellow' | 'red';
}) {
  const colors = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };
  return (
    <div className="w-full bg-slate-200 rounded-full h-2">
      <div
        className={cn('h-2 rounded-full transition-all', colors[color])}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

function StudentRiskRow({ student }: { student: StudentRisk }) {
  return (
    <tr
      className={cn(
        'hover:bg-slate-50',
        student.riskLevel === 'HIGH' && 'bg-red-50',
      )}
    >
      <td className="px-4 py-3">
        <div>
          <p className="font-medium text-slate-800">{student.name}</p>
          <p className="text-xs text-slate-500">{student.email}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-slate-600">
          {student.group?.name || 'No group'}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="font-semibold">{student.present}</span>
        <span className="text-slate-400">/{student.totalLessons}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <ProgressBar
            value={student.attendanceRate}
            color={
              student.attendanceRate >= 90
                ? 'green'
                : student.attendanceRate >= 70
                  ? 'yellow'
                  : 'red'
            }
          />
          <span className="text-sm font-medium w-12">
            {student.attendanceRate}%
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        {student.absentUnjustified > 0 ? (
          <span className="text-red-600 font-medium">
            {student.absentUnjustified}
          </span>
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
  const analyticsUrl = useAdminAnalyticsUrl();
  const { activeTab, setActiveTab } = analyticsUrl;
  const {
    committed: paymentsTimeCommitted,
    hasUnsavedChanges: hasUnsavedPaymentsTime,
    onApply: onApplyPaymentsTime,
    timeFilterBarProps: paymentsTimeFilterBarProps,
  } = useAdminPaymentsTimeFilter(analyticsUrl);

  const timeRange = useMemo(
    () =>
      buildTimeRange(paymentsTimeCommitted.timeMode, {
        dayYmd: paymentsTimeCommitted.dayYmd,
        weekAnchorYmd: paymentsTimeCommitted.weekAnchorYmd,
        customFromYmd: paymentsTimeCommitted.customFromYmd,
        customToYmd: paymentsTimeCommitted.customToYmd,
      }),
    [paymentsTimeCommitted],
  );
  const revenueSeries = resolveRevenueApiSeries(
    paymentsTimeCommitted.timeMode,
    timeRange.daySpan,
  );

  const { data: teachers = [], isLoading: isLoadingTeachers } =
    useTeacherPerformance(undefined, undefined);
  const { data: students = [], isLoading: isLoadingStudents } = useStudentRisk();
  const { data: revenue = [], isLoading: isLoadingRevenue } = useRevenueAnalyticsByRange(
    timeRange.dateFrom,
    timeRange.dateTo,
    revenueSeries,
    { enabled: activeTab === 'payments' },
  );
  const { data: attendance, isLoading: isLoadingAttendance } =
    useAttendanceOverview(undefined, undefined);

  const totalIncome = revenue.reduce((sum, r) => sum + r.income, 0);
  const totalExpenses = revenue.reduce((sum, r) => sum + r.expenses, 0);
  const totalProfit = totalIncome - totalExpenses;
  const highRisk = students.filter((s) => s.riskLevel === 'HIGH').length;
  const mediumRisk = students.filter((s) => s.riskLevel === 'MEDIUM').length;
  const lowRisk = students.filter((s) => s.riskLevel === 'LOW').length;

  const tabs: { id: AdminAnalyticsTab; label: string }[] = [
    { id: 'attendance', label: 'Attendance' },
    { id: 'payments', label: 'Payments' },
    { id: 'recordings', label: 'Recordings' },
    { id: 'feedback', label: 'Feedback' },
    { id: 'risk', label: 'Risk Distribution' },
  ];

  return (
    <DashboardLayout title={t('title')} subtitle={t('adminSubtitle')}>
      <div className="flex border-b border-slate-200 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap',
              activeTab === tab.id
                ? 'text-blue-600'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-sm text-slate-500">Records (30d)</p>
              <p className="text-2xl font-bold text-slate-900">
                {attendance?.summary.total ?? 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-sm text-slate-500">Present</p>
              <p className="text-2xl font-bold text-green-600">
                {attendance?.summary.present ?? 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-sm text-slate-500">Unjustified</p>
              <p className="text-2xl font-bold text-red-600">
                {attendance?.summary.absentUnjustified ?? 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-sm text-slate-500">Rate</p>
              <p className="text-2xl font-bold text-slate-900">
                {attendance?.summary.attendanceRate ?? 0}%
              </p>
            </div>
          </div>

          <TeacherRatioTable
            teachers={teachers}
            isLoading={isLoadingTeachers || isLoadingAttendance}
            metric="absenceMarkedRate"
            metricLabel="Attendance Marking Rate"
          />
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-600">
              {t('paymentsTimeFilterLabel')}
            </p>
            <AnalyticsTimeFilterBar
              {...paymentsTimeFilterBarProps}
              className="transition-all duration-200"
              applyAction={{
                onApply: onApplyPaymentsTime,
                hasUnsavedChanges: hasUnsavedPaymentsTime,
              }}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm text-green-600">Total Income</p>
              <p className="text-2xl font-bold text-green-700">
                {formatCurrency(totalIncome)}
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-700">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
            <div
              className={cn(
                'rounded-xl p-4 border',
                totalProfit >= 0
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-orange-50 border-orange-200',
              )}
            >
              <p
                className={cn(
                  'text-sm',
                  totalProfit >= 0 ? 'text-blue-600' : 'text-orange-600',
                )}
              >
                Net Profit
              </p>
              <p
                className={cn(
                  'text-2xl font-bold',
                  totalProfit >= 0 ? 'text-blue-700' : 'text-orange-700',
                )}
              >
                {formatCurrency(totalProfit)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800">Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">
                      {t('periodColumn')}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">
                      Income
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">
                      Expenses
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">
                      Profit
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">
                      # Payments
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingRevenue ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        {tCommon('loading')}
                      </td>
                    </tr>
                  ) : revenue.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        No data available
                      </td>
                    </tr>
                  ) : (
                    revenue.map((r) => (
                      <tr key={r.month} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {r.monthName}
                        </td>
                        <td className="px-4 py-3 text-right text-green-600 font-medium">
                          {formatCurrency(r.income)}
                        </td>
                        <td className="px-4 py-3 text-right text-red-600 font-medium">
                          {formatCurrency(r.expenses)}
                        </td>
                        <td
                          className={cn(
                            'px-4 py-3 text-right font-semibold',
                            r.profit >= 0
                              ? 'text-blue-600'
                              : 'text-orange-600',
                          )}
                        >
                          {formatCurrency(r.profit)}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600">
                          {r.paymentsCount}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'recordings' && (
        <TeacherRatioTable
          teachers={teachers}
          isLoading={isLoadingTeachers}
          metric="voiceRate"
          metricLabel="Recording Completion Rate"
        />
      )}

      {activeTab === 'feedback' && (
        <TeacherRatioTable
          teachers={teachers}
          isLoading={isLoadingTeachers}
          metric="feedbacksRate"
          metricLabel="Feedback Completion Rate"
        />
      )}

      {activeTab === 'risk' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-semibold text-slate-800">
                Student Risk Analysis
              </h3>
              <p className="text-sm text-slate-500">
                Students sorted by risk level
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                High: {highRisk}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                Medium: {mediumRisk}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Low: {lowRisk}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">
                    Group
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">
                    Attendance
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">
                    Rate
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">
                    Unjustified
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">
                    Risk Level
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingStudents ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      {tCommon('loading')}
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      No students found
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <StudentRiskRow key={student.id} student={student} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
