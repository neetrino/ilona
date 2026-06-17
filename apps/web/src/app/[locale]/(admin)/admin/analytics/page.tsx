'use client';

import { portalPageStackClass } from '@/shared/lib/portal-theme';
import { useEffect, useMemo, useRef, useState } from 'react';
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

const MOBILE_RISK_PAGE_SIZE = 6;

function initialFromName(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function riskBarColor(rate: number): string {
  if (rate >= 90) return 'bg-green-500';
  if (rate >= 70) return 'bg-yellow-500';
  return 'bg-red-500';
}

function RiskBadge({ level }: { level: 'LOW' | 'MEDIUM' | 'HIGH' }) {
  const t = useTranslations('analytics');
  const styles = {
    LOW: { bg: 'bg-green-100', text: 'text-green-700', label: t('lowRisk') },
    MEDIUM: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: t('mediumRisk') },
    HIGH: { bg: 'bg-red-100', text: 'text-red-700', label: t('highRisk') },
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

function RiskSummaryMobile({
  highRisk,
  mediumRisk,
  lowRisk,
}: {
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center justify-center gap-2 rounded-[0.95rem] border border-[rgba(14,14,16,0.09)] bg-white px-3 py-3 text-base text-[#3b3b40]">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
          <span>High: {highRisk}</span>
        </div>
        <div className="flex items-center justify-center gap-2 rounded-[0.95rem] border border-[rgba(14,14,16,0.09)] bg-white px-3 py-3 text-base text-[#3b3b40]">
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
          <span>Medium: {mediumRisk}</span>
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-[12rem] items-center justify-center gap-2 rounded-[0.95rem] border border-[rgba(14,14,16,0.09)] bg-white px-3 py-3 text-base text-[#3b3b40]">
        <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
        <span>Low: {lowRisk}</span>
      </div>
    </div>
  );
}

function StudentRiskMobileCard({ student }: { student: StudentRisk }) {
  const t = useTranslations('analytics');
  const attendanceRate = Math.max(0, Math.min(100, student.attendanceRate));

  return (
    <article className="overflow-hidden rounded-[1.1rem] border border-[rgba(14,14,16,0.09)] bg-white shadow-[0_1px_2px_rgba(14,14,16,0.03)]">
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eceeff] text-xl font-semibold text-[#3232b3]">
          {initialFromName(student.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[1.05rem] font-semibold leading-tight text-[#1f2654]">
            {student.name}
          </p>
          <p className="truncate text-[1rem] text-[#8b8b90]">{student.email}</p>
          <p className="mt-1 truncate text-[1rem] text-[#6a6a72]">
            {student.group?.name || t('noGroup')}
          </p>
        </div>
        <div className="flex shrink-0 items-center">
          <RiskBadge level={student.riskLevel} />
        </div>
      </div>

      <div className="grid grid-cols-4 divide-x divide-[rgba(14,14,16,0.08)] border-t border-[rgba(14,14,16,0.08)]">
        <div className="px-2 py-3 text-center">
          <p className="text-xs text-[#8b8b90]">Attendance</p>
          <p className="mt-1 text-[1.05rem] font-semibold text-[#1f2654]">
            {student.present}/{student.totalLessons}
          </p>
        </div>
        <div className="px-2 py-3 text-center">
          <p className="text-xs text-[#8b8b90]">Rate</p>
          <div className="mx-auto mt-2 h-2 w-full max-w-[4.5rem] rounded-full bg-[#e8e8eb]">
            <div
              className={cn('h-2 rounded-full', riskBarColor(attendanceRate))}
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
          <p className="mt-1 text-[1.05rem] font-semibold text-[#1f2654]">{attendanceRate}%</p>
        </div>
        <div className="px-2 py-3 text-center">
          <p className="text-xs text-[#8b8b90]">Unjustified</p>
          <p className={cn('mt-1 text-[1.05rem] font-semibold', student.absentUnjustified > 0 ? 'text-red-600' : 'text-green-600')}>
            {student.absentUnjustified}
          </p>
        </div>
        <div className="px-2 py-3 text-center">
          <p className="text-xs text-[#8b8b90]"># Payments</p>
          <p className="mt-1 text-[1.05rem] font-semibold text-[#1f2654]">{student.pendingPayments}</p>
        </div>
      </div>
    </article>
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
    <div className="w-full bg-[#f1f1f2] rounded-full h-2">
      <div
        className={cn('h-2 rounded-full transition-all', colors[color])}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

function StudentRiskRow({ student }: { student: StudentRisk }) {
  const t = useTranslations('analytics');

  return (
    <tr
      className={cn(
        'hover:bg-[#fafafa]',
        student.riskLevel === 'HIGH' && 'bg-red-50',
      )}
    >
      <td className="px-4 py-3">
        <div>
          <p className="font-medium text-[#3b3b40]">{student.name}</p>
          <p className="text-xs text-[#8b8b90]">{student.email}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-[#3b3b40]">
          {student.group?.name || t('noGroup')}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="font-semibold">{student.present}</span>
        <span className="text-[#8b8b90]">/{student.totalLessons}</span>
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
  const tFinance = useTranslations('finance');
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
  const tabsTrackRef = useRef<HTMLDivElement | null>(null);
  const riskMobileStartRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<AdminAnalyticsTab, HTMLButtonElement | null>>({
    attendance: null,
    payments: null,
    recordings: null,
    feedback: null,
    risk: null,
  });
  const [tabIndicator, setTabIndicator] = useState({ x: 0, width: 0, visible: false });
  const [riskMobilePage, setRiskMobilePage] = useState(1);
  const riskMobileTotalPages = Math.max(1, Math.ceil(students.length / MOBILE_RISK_PAGE_SIZE));
  const safeRiskMobilePage = Math.min(riskMobilePage, riskMobileTotalPages);
  const riskMobileStart = students.length === 0 ? 0 : (safeRiskMobilePage - 1) * MOBILE_RISK_PAGE_SIZE + 1;
  const riskMobileEnd = Math.min(students.length, safeRiskMobilePage * MOBILE_RISK_PAGE_SIZE);
  const riskMobileStudents = useMemo(
    () => students.slice((safeRiskMobilePage - 1) * MOBILE_RISK_PAGE_SIZE, safeRiskMobilePage * MOBILE_RISK_PAGE_SIZE),
    [students, safeRiskMobilePage],
  );

  useEffect(() => {
    const syncIndicator = () => {
      const activeTabEl = tabRefs.current[activeTab];
      const tabsTrackEl = tabsTrackRef.current;
      if (!activeTabEl || !tabsTrackEl) {
        setTabIndicator((prev) => ({ ...prev, visible: false }));
        return;
      }
      setTabIndicator({
        x: activeTabEl.offsetLeft,
        width: activeTabEl.offsetWidth,
        visible: true,
      });
    };

    syncIndicator();
    window.addEventListener('resize', syncIndicator);
    return () => window.removeEventListener('resize', syncIndicator);
  }, [activeTab]);

  useEffect(() => {
    if (riskMobilePage > riskMobileTotalPages) {
      setRiskMobilePage(riskMobileTotalPages);
    }
  }, [riskMobilePage, riskMobileTotalPages]);

  useEffect(() => {
    if (activeTab !== 'risk') return;
    riskMobileStartRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [activeTab, safeRiskMobilePage]);

  return (
    <DashboardLayout title={t('title')} subtitle={t('adminSubtitle')}>
      <div className="mb-6 w-full min-w-0 overflow-x-auto border-b border-[rgba(14,14,16,0.07)] [-webkit-overflow-scrolling:touch] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div ref={tabsTrackRef} className="relative flex w-max min-w-full">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={(node) => {
              tabRefs.current[tab.id] = node;
            }}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap',
              activeTab === tab.id
                ? 'text-blue-600'
                : 'text-[#3b3b40] hover:text-[#1010a3]',
            )}
          >
            {tab.label}
          </button>
        ))}
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-0 h-0.5 bg-blue-600 transition-[transform,width,opacity] duration-300 ease-out"
            style={{
              width: `${tabIndicator.width}px`,
              transform: `translateX(${tabIndicator.x}px)`,
              opacity: tabIndicator.visible ? 1 : 0,
            }}
          />
        </div>
      </div>

      {activeTab === 'attendance' && (
        <div className={portalPageStackClass}>
          <div className="grid w-full min-w-0 grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
            <div className="bg-white p-4 rounded-xl border border-[rgba(14,14,16,0.07)]">
              <p className="text-sm text-[#8b8b90]">{t('records30d')}</p>
              <p className="text-2xl font-bold text-[#1010a3]">
                {attendance?.summary.total ?? 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[rgba(14,14,16,0.07)]">
              <p className="text-sm text-[#8b8b90]">{t('present')}</p>
              <p className="text-2xl font-bold text-green-600">
                {attendance?.summary.present ?? 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[rgba(14,14,16,0.07)]">
              <p className="text-sm text-[#8b8b90]">{t('unjustifiedShort')}</p>
              <p className="text-2xl font-bold text-red-600">
                {attendance?.summary.absentUnjustified ?? 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[rgba(14,14,16,0.07)]">
              <p className="text-sm text-[#8b8b90]">{tCommon('rate')}</p>
              <p className="text-2xl font-bold text-[#1010a3]">
                {attendance?.summary.attendanceRate ?? 0}%
              </p>
            </div>
          </div>

          <TeacherRatioTable
            teachers={teachers}
            isLoading={isLoadingTeachers || isLoadingAttendance}
            metric="absenceMarkedRate"
            metricLabel={t('attendanceMarkingRate')}
            mobilePercentOnly
          />
        </div>
      )}

      {activeTab === 'payments' && (
        <div className={portalPageStackClass}>
          <div>
            <p className="mb-2 text-sm font-medium text-[#3b3b40]">
              {t('paymentsTimeFilterLabel')}
            </p>
            <AnalyticsTimeFilterBar
              {...paymentsTimeFilterBarProps}
              variant="admin"
              className="transition-all duration-200"
              applyAction={{
                onApply: onApplyPaymentsTime,
                hasUnsavedChanges: hasUnsavedPaymentsTime,
              }}
            />
          </div>
          <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm text-green-600">{tCommon('totalIncome')}</p>
              <p className="text-2xl font-bold text-green-700">
                {formatCurrency(totalIncome)}
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-600">{tCommon('totalExpensesLabel')}</p>
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
                {tFinance('netProfit')}
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

          <div className="bg-white rounded-xl border border-[rgba(14,14,16,0.07)] overflow-hidden">
            <div className="p-4 border-b border-[rgba(14,14,16,0.07)]">
              <h3 className="font-semibold text-[#3b3b40]">{tCommon('breakdown')}</h3>
            </div>
            <div className="w-full min-w-0 overflow-x-auto [-webkit-overflow-scrolling:touch]">
              <table className="w-full">
                <thead className="bg-[#fafafa] border-b border-[rgba(14,14,16,0.07)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[#3b3b40]">
                      {t('periodColumn')}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-[#3b3b40]">
                      Income
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-[#3b3b40]">
                      Expenses
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-[#3b3b40]">
                      Profit
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-[#3b3b40]">
                      # Payments
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(14,14,16,0.07)]">
                  {isLoadingRevenue ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-[#8b8b90]"
                      >
                        {tCommon('loading')}
                      </td>
                    </tr>
                  ) : revenue.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-[#8b8b90]"
                      >
                        No data available
                      </td>
                    </tr>
                  ) : (
                    revenue.map((r) => (
                      <tr key={r.month} className="hover:bg-[#fafafa]">
                        <td className="px-4 py-3 font-medium text-[#3b3b40]">
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
                        <td className="px-4 py-3 text-center text-[#3b3b40]">
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
          mobilePercentOnly
        />
      )}

      {activeTab === 'feedback' && (
        <TeacherRatioTable
          teachers={teachers}
          isLoading={isLoadingTeachers}
          metric="feedbacksRate"
          metricLabel="Feedback Completion Rate"
          mobilePercentOnly
        />
      )}

      {activeTab === 'risk' && (
        <div className="bg-white rounded-xl border border-[rgba(14,14,16,0.07)] overflow-hidden">
          <div className="hidden p-4 border-b border-[rgba(14,14,16,0.07)] sm:flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-semibold text-[#3b3b40]">
                Student Risk Analysis
              </h3>
              <p className="text-sm text-[#8b8b90]">
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

          <div className="space-y-3 p-3 sm:hidden">
            <div ref={riskMobileStartRef} />
            <RiskSummaryMobile
              highRisk={highRisk}
              mediumRisk={mediumRisk}
              lowRisk={lowRisk}
            />
            {isLoadingStudents ? (
              <div className="rounded-[1.1rem] border border-[rgba(14,14,16,0.09)] bg-white px-4 py-8 text-center text-[#8b8b90]">
                {tCommon('loading')}
              </div>
            ) : students.length === 0 ? (
              <div className="rounded-[1.1rem] border border-[rgba(14,14,16,0.09)] bg-white px-4 py-8 text-center text-[#8b8b90]">
                No students found
              </div>
            ) : (
              riskMobileStudents.map((student) => (
                <StudentRiskMobileCard key={student.id} student={student} />
              ))
            )}
            {!isLoadingStudents && students.length > MOBILE_RISK_PAGE_SIZE && (
              <div className="flex items-center justify-between text-sm text-[#8b8b90]">
                <span>
                  {riskMobileStart}-{riskMobileEnd} / {students.length}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                      safeRiskMobilePage <= 1
                        ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
                        : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]'
                    }`}
                    disabled={safeRiskMobilePage <= 1}
                    onClick={() => setRiskMobilePage((prev) => Math.max(1, prev - 1))}
                    aria-label="Previous risk page"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-[#1010a3] px-3 text-xs font-semibold text-white">
                    {safeRiskMobilePage}
                  </span>
                  <button
                    type="button"
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                      safeRiskMobilePage >= riskMobileTotalPages
                        ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
                        : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]'
                    }`}
                    disabled={safeRiskMobilePage >= riskMobileTotalPages}
                    onClick={() =>
                      setRiskMobilePage((prev) => Math.min(riskMobileTotalPages, prev + 1))
                    }
                    aria-label="Next risk page"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="hidden w-full min-w-0 overflow-x-auto [-webkit-overflow-scrolling:touch] sm:block">
            <table className="w-full">
              <thead className="bg-[#fafafa] border-b border-[rgba(14,14,16,0.07)]">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#3b3b40]">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#3b3b40]">
                    Group
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-[#3b3b40]">
                    Attendance
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#3b3b40]">
                    Rate
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-[#3b3b40]">
                    Unjustified
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-[#3b3b40]">
                    Risk Level
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(14,14,16,0.07)]">
                {isLoadingStudents ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-[#8b8b90]"
                    >
                      {tCommon('loading')}
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-[#8b8b90]"
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
