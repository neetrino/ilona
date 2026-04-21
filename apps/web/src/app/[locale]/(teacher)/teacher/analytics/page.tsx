'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useMyLessons } from '@/features/lessons';
import {
  useMySalaries,
  useMySalarySummary,
  useMyDeductions,
} from '@/features/finance';
import { cn } from '@/shared/lib/utils';

type TabId = 'attendance' | 'feedback' | 'performance' | 'revenue';

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
  color = 'blue',
}: {
  label: string;
  value: string | number;
  subtext?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    red: 'bg-red-50 border-red-200',
    purple: 'bg-purple-50 border-purple-200',
  };
  return (
    <div className={cn('rounded-xl border p-4', colors[color])}>
      <p className="mb-1 text-sm text-slate-600">{label}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      {subtext && <p className="mt-1 text-xs text-slate-500">{subtext}</p>}
    </div>
  );
}

function ProgressBar({
  value,
  max = 100,
  label,
}: {
  value: number;
  max?: number;
  label: string;
}) {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-800">{Math.round(percentage)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200">
        <div
          className={cn(
            'h-2 rounded-full transition-all',
            percentage >= 90
              ? 'bg-green-500'
              : percentage >= 70
                ? 'bg-yellow-500'
                : 'bg-red-500',
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function TeacherAnalyticsPage() {
  const t = useTranslations('analytics');
  const [activeTab, setActiveTab] = useState<TabId>('attendance');

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

  const { data: monthLessons } = useMyLessons(monthStart, monthEnd);
  const { data: salarySummary } = useMySalarySummary();
  const { data: salaries } = useMySalaries();
  const { data: deductions } = useMyDeductions();

  const lessons = monthLessons?.items ?? [];
  const completedLessons = lessons.filter((l) => l.status === 'COMPLETED');
  const completedCount = completedLessons.length;
  const totalLessons = lessons.length;
  const completionRate =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const totalAttendances = lessons.reduce(
    (sum, l) => sum + (l._count?.attendances ?? 0),
    0,
  );
  const averageAttendance =
    completedCount > 0 ? Math.round(totalAttendances / completedCount) : 0;

  const feedbacksDone = completedLessons.filter(
    (l) => l.feedbacksCompleted,
  ).length;
  const feedbackRate =
    completedCount > 0 ? Math.round((feedbacksDone / completedCount) * 100) : 0;

  const vocabularySent = lessons.filter((l) => l.vocabularySent).length;
  const vocabularyRate =
    completedCount > 0 ? Math.round((vocabularySent / completedCount) * 100) : 0;
  const voiceSent = completedLessons.filter((l) => l.voiceSent).length;
  const voiceRate =
    completedCount > 0 ? Math.round((voiceSent / completedCount) * 100) : 0;
  const textSent = completedLessons.filter((l) => l.textSent).length;
  const textRate =
    completedCount > 0 ? Math.round((textSent / completedCount) * 100) : 0;
  const absenceMarked = completedLessons.filter((l) => l.absenceMarked).length;
  const absenceRate =
    completedCount > 0 ? Math.round((absenceMarked / completedCount) * 100) : 0;

  const deductionsList = deductions?.items ?? [];
  const totalDeductions = deductionsList.reduce(
    (sum, d) => sum + Number(d.amount),
    0,
  );
  const paidSalaries = useMemo(
    () => (salaries?.items ?? []).filter((s) => s.status === 'PAID'),
    [salaries],
  );

  const totalEarned = Number(salarySummary?.totalEarned) || 0;
  const pendingAmount = Number(salarySummary?.totalPending) || 0;

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'attendance', label: t('attendancePatternsTab') ?? 'Attendance' },
    { id: 'feedback', label: t('feedbackTrendsTab') ?? 'Feedback' },
    { id: 'performance', label: t('studentPerformanceTab') ?? 'Performance' },
    { id: 'revenue', label: t('revenueTab') ?? 'Revenue' },
  ];

  return (
    <DashboardLayout title={t('myAnalytics')} subtitle={t('teacherSubtitle')}>
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <StatCard
              label={t('lessonsThisMonth')}
              value={completedCount}
              subtext={t('ofScheduled', { total: totalLessons })}
              color="blue"
            />
            <StatCard
              label="Total attendances"
              value={totalAttendances}
              subtext="across completed lessons"
              color="green"
            />
            <StatCard
              label="Avg attendance / lesson"
              value={averageAttendance}
              subtext="students present"
              color="purple"
            />
            <StatCard
              label="Absence marking rate"
              value={`${absenceRate}%`}
              subtext={`${absenceMarked}/${completedCount}`}
              color="yellow"
            />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-4 font-semibold text-slate-800">
              Attendance performance
            </h3>
            <div className="space-y-4">
              <ProgressBar value={completionRate} label="Lesson completion" />
              <ProgressBar value={absenceRate} label="Absence marked" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <StatCard
              label="Feedback completed"
              value={feedbacksDone}
              subtext={`of ${completedCount} completed lessons`}
              color="green"
            />
            <StatCard
              label="Feedback rate"
              value={`${feedbackRate}%`}
              color="blue"
            />
            <StatCard
              label="Voice messages"
              value={`${voiceRate}%`}
              subtext={`${voiceSent}/${completedCount}`}
              color="purple"
            />
            <StatCard
              label="Text messages"
              value={`${textRate}%`}
              subtext={`${textSent}/${completedCount}`}
              color="yellow"
            />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-4 font-semibold text-slate-800">Feedback trends</h3>
            <div className="space-y-4">
              <ProgressBar value={feedbackRate} label="Feedback completion" />
              <ProgressBar value={voiceRate} label="Voice delivery" />
              <ProgressBar value={textRate} label="Text delivery" />
              <ProgressBar value={vocabularyRate} label="Vocabulary sent" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <StatCard
              label="Lessons delivered"
              value={completedCount}
              subtext={`${completionRate}% completion`}
              color="green"
            />
            <StatCard
              label="Vocabulary sent"
              value={`${vocabularyRate}%`}
              color="blue"
            />
            <StatCard
              label="Compliance score"
              value={`${Math.max(0, 100 - deductionsList.length * 10)}`}
              subtext="based on deductions"
              color="purple"
            />
            <StatCard
              label="Deductions"
              value={deductionsList.length}
              subtext={formatCurrency(totalDeductions)}
              color="red"
            />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-4 font-semibold text-slate-800">Delivery rates</h3>
            <div className="space-y-4">
              <ProgressBar value={completionRate} label="Lesson completion" />
              <ProgressBar value={vocabularyRate} label="Vocabulary" />
              <ProgressBar value={feedbackRate} label="Feedback" />
              <ProgressBar value={absenceRate} label="Absence marked" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <StatCard
              label={t('totalEarned')}
              value={formatCurrency(totalEarned)}
              subtext={t('allTime')}
              color="green"
            />
            <StatCard
              label={t('pendingPayment')}
              value={formatCurrency(pendingAmount)}
              subtext={t('awaitingPayout')}
              color="yellow"
            />
            <StatCard
              label={t('deductions')}
              value={formatCurrency(totalDeductions)}
              subtext={t('deductionsCount', { count: deductionsList.length })}
              color="red"
            />
            <StatCard
              label="Paid periods"
              value={paidSalaries.length}
              subtext="fully settled"
              color="blue"
            />
          </div>
          {deductionsList.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 p-4">
                <h3 className="font-semibold text-slate-800">Recent deductions</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {deductionsList.slice(0, 5).map((deduction) => (
                  <div
                    key={deduction.id}
                    className="flex items-center justify-between p-4"
                  >
                    <div>
                      <p className="font-medium capitalize text-slate-800">
                        {deduction.reason.toLowerCase().replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm text-slate-500">
                        {new Date(deduction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="font-semibold text-red-600">
                      -{formatCurrency(Number(deduction.amount))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
