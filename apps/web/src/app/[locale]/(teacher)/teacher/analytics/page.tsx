'use client';

import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useTodayLessons, useMyLessons } from '@/features/lessons';
import { useMySalaries, useMySalarySummary, useMyDeductions } from '@/features/finance';
import { cn } from '@/shared/lib/utils';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('hy-AM', {
    style: 'currency',
    currency: 'AMD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function StatCard({
  label,
  value,
  subtext,
  trend,
  color = 'blue',
}: {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'yellow' | 'red';
}) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    red: 'bg-red-50 border-red-200',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  return (
    <div className={cn('p-4 rounded-xl border', colors[color])}>
      <p className="text-sm text-slate-600 mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        {trend && (
          <span className={cn(
            'text-sm font-medium',
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-500'
          )}>
            {trendIcons[trend]}
          </span>
        )}
      </div>
      {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
    </div>
  );
}

function ProgressBar({ value, max = 100, label }: { value: number; max?: number; label: string }) {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-800">{Math.round(percentage)}%</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2">
        <div
          className={cn(
            'h-2 rounded-full transition-all',
            percentage >= 90 ? 'bg-green-500' : percentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function TeacherAnalyticsPage() {
  // Get date range for this month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

  // Fetch data
  const { data: todayLessons } = useTodayLessons();
  const { data: monthLessons } = useMyLessons(monthStart, monthEnd);
  const { data: salaries } = useMySalaries();
  const { data: salarySummary } = useMySalarySummary();
  const { data: deductions } = useMyDeductions();

  // Keep queries active for cache, even if not directly rendered
  void todayLessons;
  void salaries;

  // Calculate stats
  const lessons = monthLessons?.items || [];
  const completedLessons = lessons.filter((l) => l.status === 'COMPLETED').length;
  const totalLessons = lessons.length;
  const completionRate = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const vocabularySent = lessons.filter((l) => l.vocabularySent).length;
  const vocabularyRate = completedLessons > 0 ? Math.round((vocabularySent / completedLessons) * 100) : 0;

  // Attendance from lessons
  const totalAttendances = lessons.reduce((sum, l) => sum + (l._count?.attendances || 0), 0);
  
  // Deductions stats
  const deductionsList = deductions?.items || [];
  const totalDeductionsAmount = deductionsList.reduce((sum, d) => sum + Number(d.amount), 0);

  // Salary stats
  const totalEarned = Number(salarySummary?.totalEarned) || 0;
  const pendingAmount = Number(salarySummary?.totalPending) || 0;

  return (
    <DashboardLayout
      title="My Analytics"
      subtitle="Track your teaching performance and earnings."
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Lessons This Month"
          value={completedLessons}
          subtext={`of ${totalLessons} scheduled`}
          color="blue"
        />
        <StatCard
          label="Total Earned"
          value={formatCurrency(totalEarned)}
          subtext="All time"
          color="green"
        />
        <StatCard
          label="Pending Payment"
          value={formatCurrency(pendingAmount)}
          subtext="Awaiting payout"
          color="yellow"
        />
        <StatCard
          label="Deductions"
          value={formatCurrency(totalDeductionsAmount)}
          subtext={`${deductionsList.length} deductions`}
          color="red"
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-6">Performance Rates</h3>
          <div className="space-y-6">
            <ProgressBar value={completionRate} label="Lesson Completion" />
            <ProgressBar value={vocabularyRate} label="Vocabulary Sent" />
            <ProgressBar value={100 - (deductionsList.length * 10)} max={100} label="Compliance Score" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Monthly Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Total Lessons</span>
              <span className="font-semibold">{totalLessons}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Completed</span>
              <span className="font-semibold text-green-600">{completedLessons}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Vocabulary Messages</span>
              <span className="font-semibold">{vocabularySent}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Student Attendances</span>
              <span className="font-semibold">{totalAttendances}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-600">Deductions</span>
              <span className={cn('font-semibold', deductionsList.length > 0 ? 'text-red-600' : 'text-green-600')}>
                {deductionsList.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Deductions */}
      {deductionsList.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800">Recent Deductions</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {deductionsList.slice(0, 5).map((deduction) => (
              <div key={deduction.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800 capitalize">
                    {deduction.reason.toLowerCase().replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm text-slate-500">
                    {new Date(deduction.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-red-600 font-semibold">
                  -{formatCurrency(Number(deduction.amount))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="font-medium text-blue-800 mb-2">Tips to Improve</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          {vocabularyRate < 100 && (
            <li>• Send vocabulary after every lesson to maintain 100% compliance</li>
          )}
          {completionRate < 90 && (
            <li>• Complete all scheduled lessons to improve your completion rate</li>
          )}
          {deductionsList.length > 0 && (
            <li>• Avoid deductions by following all lesson requirements</li>
          )}
          {vocabularyRate >= 100 && completionRate >= 90 && deductionsList.length === 0 && (
            <li>• Excellent work! Keep up the great performance!</li>
          )}
        </ul>
      </div>
    </DashboardLayout>
  );
}
