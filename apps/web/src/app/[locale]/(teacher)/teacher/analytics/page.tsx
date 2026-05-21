'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useMyLessons } from '@/features/lessons';
import { useMySalaries, useMyDeductions } from '@/features/finance';
import { AnalyticsTimeFilterBar } from '@/shared/components/analytics/AnalyticsTimeFilterBar';
import {
  buildTimeRange,
  defaultCustomRangeLast30Days,
  toYmd,
  type TimeFilterMode,
} from '@/shared/lib/analytics-time-range';
import { cn, formatCurrency } from '@/shared/lib/utils';
import {
  StudentCard,
  StudentPageStack,
  StudentProgressBar,
  StudentSectionHeader,
  StudentStatTile,
  studentPillActiveClass,
  studentPillInactiveClass,
  studentPillTrackClass,
} from '@/features/student-ui';

type TabId = 'attendance' | 'feedback' | 'performance' | 'revenue';

function StatCard({
  label,
  value,
  subtext,
  color: _color,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
}) {
  return (
    <StudentStatTile
      label={label}
      value={
        <span>
          {value}
          {subtext ? (
            <span className="mt-1 block text-xs font-normal text-[#8b8b90]">{subtext}</span>
          ) : null}
        </span>
      }
      tone="violet"
      icon={
        <svg className="h-5 w-5 text-[#1010a3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      }
    />
  );
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-[#8b8b90]">{label}</span>
        <span className="font-medium text-[#1010a3]">{Math.round(Math.min(value, 100))}%</span>
      </div>
      <StudentProgressBar percent={value} />
    </div>
  );
}

export default function TeacherAnalyticsPage() {
  const t = useTranslations('analytics');
  const [activeTab, setActiveTab] = useState<TabId>('attendance');

  const defPay = useMemo(() => defaultCustomRangeLast30Days(), []);
  const [payTimeMode, setPayTimeMode] = useState<TimeFilterMode>('date');
  const [payDayYmd, setPayDayYmd] = useState(() => toYmd(new Date()));
  const [payWeekAnchorYmd, setPayWeekAnchorYmd] = useState(() => toYmd(new Date()));
  const [payFromYmd, setPayFromYmd] = useState(defPay.fromYmd);
  const [payToYmd, setPayToYmd] = useState(defPay.toYmd);

  const payRange = useMemo(
    () =>
      buildTimeRange(payTimeMode, {
        dayYmd: payDayYmd,
        weekAnchorYmd: payWeekAnchorYmd,
        customFromYmd: payFromYmd,
        customToYmd: payToYmd,
      }),
    [payTimeMode, payDayYmd, payWeekAnchorYmd, payFromYmd, payToYmd],
  );

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

  const { data: monthLessons } = useMyLessons(monthStart, monthEnd);
  const { data: salaries } = useMySalaries(
    0,
    500,
    undefined,
    payRange.dateFrom,
    payRange.dateTo,
    { enabled: activeTab === 'revenue' },
  );
  const { data: deductions } = useMyDeductions(0, 200);
  const { data: deductionsInPeriod } = useMyDeductions(0, 200, payRange.dateFrom, payRange.dateTo, {
    enabled: activeTab === 'revenue',
  });

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
  const periodDeductionsList = deductionsInPeriod?.items ?? [];
  const totalDeductionsInPeriod = periodDeductionsList.reduce(
    (sum, d) => sum + Number(d.amount),
    0,
  );
  const paidSalaries = useMemo(
    () => (salaries?.items ?? []).filter((s) => s.status === 'PAID'),
    [salaries],
  );

  const totalEarned = useMemo(
    () => paidSalaries.reduce((s, x) => s + Number(x.netAmount), 0),
    [paidSalaries],
  );
  const pendingAmount = useMemo(
    () =>
      (salaries?.items ?? [])
        .filter((s) => s.status !== 'PAID')
        .reduce((s, x) => s + Number(x.netAmount), 0),
    [salaries],
  );

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'attendance', label: t('attendancePatternsTab') ?? 'Attendance' },
    { id: 'feedback', label: t('feedbackTrendsTab') ?? 'Feedback' },
    { id: 'performance', label: t('studentPerformanceTab') ?? 'Performance' },
    { id: 'revenue', label: t('revenueTab') ?? 'Revenue' },
  ];

  return (
    <DashboardLayout title={t('myAnalytics')} subtitle={t('teacherSubtitle')}>
      <StudentPageStack>
      <div className={studentPillTrackClass}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? studentPillActiveClass : studentPillInactiveClass}
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
          <StudentCard>
            <StudentSectionHeader title="Attendance performance" />
            <div className="space-y-4">
              <ProgressBar value={completionRate} label="Lesson completion" />
              <ProgressBar value={absenceRate} label="Absence marked" />
            </div>
          </StudentCard>
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
          <StudentCard>
            <StudentSectionHeader title="Feedback trends" />
            <div className="space-y-4">
              <ProgressBar value={feedbackRate} label="Feedback completion" />
              <ProgressBar value={voiceRate} label="Voice delivery" />
              <ProgressBar value={textRate} label="Text delivery" />
              <ProgressBar value={vocabularyRate} label="Vocabulary sent" />
            </div>
          </StudentCard>
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
          <StudentCard>
            <StudentSectionHeader title="Delivery rates" />
            <div className="space-y-4">
              <ProgressBar value={completionRate} label="Lesson completion" />
              <ProgressBar value={vocabularyRate} label="Vocabulary" />
              <ProgressBar value={feedbackRate} label="Feedback" />
              <ProgressBar value={absenceRate} label="Absence marked" />
            </div>
          </StudentCard>
        </div>
      )}

      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-sm font-medium text-[#8b8b90]">
              {t('paymentsTimeFilterLabel')}
            </p>
            <AnalyticsTimeFilterBar
              variant="student"
              mode={payTimeMode}
              onModeChange={setPayTimeMode}
              dayYmd={payDayYmd}
              onDayYmdChange={setPayDayYmd}
              weekAnchorYmd={payWeekAnchorYmd}
              onWeekAnchorYmdChange={setPayWeekAnchorYmd}
              customFromYmd={payFromYmd}
              customToYmd={payToYmd}
              onCustomFromYmd={setPayFromYmd}
              onCustomToYmd={setPayToYmd}
              className="transition-all duration-200"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <StatCard
              label={t('totalEarned')}
              value={formatCurrency(totalEarned)}
              subtext={t('earningsInPeriod')}
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
              value={formatCurrency(totalDeductionsInPeriod)}
              subtext={t('deductionsCount', { count: periodDeductionsList.length })}
              color="red"
            />
            <StatCard
              label="Paid periods"
              value={paidSalaries.length}
              subtext="fully settled in period"
              color="blue"
            />
          </div>
          {periodDeductionsList.length > 0 && (
            <StudentCard noPadding>
              <div className="border-b border-[rgba(14,14,16,0.07)] px-5 py-4 sm:px-6">
                <StudentSectionHeader title="Recent deductions" className="mb-0" />
              </div>
              <div className="divide-y divide-[rgba(14,14,16,0.07)]">
                {periodDeductionsList.slice(0, 5).map((deduction) => (
                  <div
                    key={deduction.id}
                    className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium capitalize text-[#1010a3]">
                        {deduction.reason.toLowerCase().replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm text-[#8b8b90]">
                        {new Date(deduction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="font-semibold text-[#b42318]">
                      -{formatCurrency(Number(deduction.amount))}
                    </span>
                  </div>
                ))}
              </div>
            </StudentCard>
          )}
        </div>
      )}
      </StudentPageStack>
    </DashboardLayout>
  );
}
