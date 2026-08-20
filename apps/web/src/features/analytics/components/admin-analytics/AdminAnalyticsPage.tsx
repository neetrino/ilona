'use client';

import { portalPageStackClass } from '@/shared/lib/portal-theme';
import { scrollListStartSoon } from '@/shared/lib/scroll-element-to-list-start';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import {
  useTeacherPerformance,
  useStudentRisk,
  useRevenueAnalyticsByRange,
  useAttendanceOverview,
  TeacherRatioTable,
  RevenueBreakdownTable,
  AnalyticsMobilePagination,
} from '@/features/analytics';
import { analyticsTableScrollClass } from '@/features/analytics/analytics-table-scroll';
import { AnalyticsTimeFilterBar } from '@/shared/components/analytics/AnalyticsTimeFilterBar';
import {
  buildTimeRange,
  resolveRevenueApiSeries,
} from '@/shared/lib/analytics-time-range';
import { cn, formatCurrency } from '@/shared/lib/utils';
import {
  useAdminAnalyticsUrl,
  type AdminAnalyticsTab,
} from '@/app/[locale]/(admin)/admin/analytics/use-admin-analytics-url';
import { useAdminPaymentsTimeFilter } from '@/app/[locale]/(admin)/admin/analytics/use-payments-time-filter';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { RiskSummaryMobile } from './RiskSummaryMobile';
import { StudentRiskMobileCard } from './StudentRiskMobileCard';
import { StudentRiskRow } from './StudentRiskRow';

const ANALYTICS_TABLE_PAGE_SIZE = 7;

export function AdminAnalyticsPage() {
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');
  const t = useTranslations('analytics');
  const tFinance = useTranslations('finance');
  const { user } = useAuthStore();
  const isManager = user?.role === 'MANAGER';
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
    { enabled: !isManager && activeTab === 'payments' },
  );
  const { data: attendance, isLoading: isLoadingAttendance } =
    useAttendanceOverview(undefined, undefined);

  const totalIncome = revenue.reduce((sum, r) => sum + r.income, 0);
  const totalExpenses = revenue.reduce((sum, r) => sum + r.expenses, 0);
  const totalProfit = totalIncome - totalExpenses;
  const highRisk = students.filter((s) => s.riskLevel === 'HIGH').length;
  const mediumRisk = students.filter((s) => s.riskLevel === 'MEDIUM').length;
  const lowRisk = students.filter((s) => s.riskLevel === 'LOW').length;

  const tabs: { id: AdminAnalyticsTab; label: string }[] = useMemo(() => {
    const allTabs = [
      { id: 'attendance' as const, label: tNav('attendance') },
      { id: 'payments' as const, label: t('tabPayments') },
      { id: 'recordings' as const, label: t('tabRecordings') },
      { id: 'feedback' as const, label: t('tabFeedback') },
      { id: 'risk' as const, label: t('tabRiskDistribution') },
    ];
    return isManager ? allTabs.filter((tab) => tab.id !== 'payments') : allTabs;
  }, [isManager, t, tNav]);
  const tabsTrackRef = useRef<HTMLDivElement | null>(null);
  const riskPageStartRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<AdminAnalyticsTab, HTMLButtonElement | null>>({
    attendance: null,
    payments: null,
    recordings: null,
    feedback: null,
    risk: null,
  });
  const [tabIndicator, setTabIndicator] = useState({ x: 0, width: 0, visible: false });
  const [riskPage, setRiskPage] = useState(1);
  const riskTotalPages = Math.max(1, Math.ceil(students.length / ANALYTICS_TABLE_PAGE_SIZE));
  const safeRiskPage = Math.min(riskPage, riskTotalPages);
  const riskPaginatedStudents = useMemo(
    () =>
      students.slice(
        (safeRiskPage - 1) * ANALYTICS_TABLE_PAGE_SIZE,
        safeRiskPage * ANALYTICS_TABLE_PAGE_SIZE,
      ),
    [students, safeRiskPage],
  );

  useEffect(() => {
    if (isManager && activeTab === 'payments') {
      setActiveTab('attendance');
    }
  }, [activeTab, isManager, setActiveTab]);

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
    setRiskPage(1);
  }, [students.length]);

  useEffect(() => {
    if (riskPage > riskTotalPages) {
      setRiskPage(riskTotalPages);
    }
  }, [riskPage, riskTotalPages]);

  const goToRiskPage = (nextPage: number) => {
    setRiskPage(nextPage);
    scrollListStartSoon(riskPageStartRef.current);
  };

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
            <div className="rounded-xl border border-[rgba(14,14,16,0.07)] bg-white p-4 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(14,14,16,0.08)]">
              <p className="text-sm text-[#8b8b90]">{t('records30d')}</p>
              <p className="text-2xl font-bold text-[#1010a3]">
                {attendance?.summary.total ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-[rgba(14,14,16,0.07)] bg-white p-4 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(14,14,16,0.08)]">
              <p className="text-sm text-[#8b8b90]">{t('present')}</p>
              <p className="text-2xl font-bold text-green-600">
                {attendance?.summary.present ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-[rgba(14,14,16,0.07)] bg-white p-4 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(14,14,16,0.08)]">
              <p className="text-sm text-[#8b8b90]">{t('unjustifiedShort')}</p>
              <p className="text-2xl font-bold text-red-600">
                {attendance?.summary.absentUnjustified ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-[rgba(14,14,16,0.07)] bg-white p-4 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(14,14,16,0.08)]">
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
            mobilePageSize={ANALYTICS_TABLE_PAGE_SIZE}
          />
        </div>
      )}

      {activeTab === 'payments' && !isManager && (
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
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(14,14,16,0.08)]">
              <p className="text-sm text-green-600">{tCommon('totalIncome')}</p>
              <p className="text-2xl font-bold text-green-700">
                {formatCurrency(totalIncome)}
              </p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(14,14,16,0.08)]">
              <p className="text-sm text-red-600">{tCommon('totalExpensesLabel')}</p>
              <p className="text-2xl font-bold text-red-700">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
            <div
              className={cn(
                'rounded-xl border p-4 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(14,14,16,0.08)]',
                totalProfit >= 0
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-orange-200 bg-orange-50',
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

          <RevenueBreakdownTable
            revenue={revenue}
            isLoading={isLoadingRevenue}
            periodColumnLabel={t('periodColumn')}
            breakdownTitle={tCommon('breakdown')}
            loadingLabel={tCommon('loading')}
            emptyLabel="No data available"
            mobilePageSize={ANALYTICS_TABLE_PAGE_SIZE}
          />
        </div>
      )}

      {activeTab === 'recordings' && (
        <TeacherRatioTable
          teachers={teachers}
          isLoading={isLoadingTeachers}
          metric="voiceRate"
          metricLabel="Recording Completion Rate"
          mobilePercentOnly
          mobilePageSize={ANALYTICS_TABLE_PAGE_SIZE}
        />
      )}

      {activeTab === 'feedback' && (
        <TeacherRatioTable
          teachers={teachers}
          isLoading={isLoadingTeachers}
          metric="feedbacksRate"
          metricLabel="Feedback Completion Rate"
          mobilePercentOnly
          mobilePageSize={ANALYTICS_TABLE_PAGE_SIZE}
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

          <div ref={riskPageStartRef} />
          <div className="space-y-3 p-3 sm:hidden">
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
              riskPaginatedStudents.map((student) => (
                <StudentRiskMobileCard key={student.id} student={student} />
              ))
            )}
          </div>

          <div className={cn('hidden sm:block', analyticsTableScrollClass)}>
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
                    {tNav('attendance')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#3b3b40]">
                    {tCommon('rate')}
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-[#3b3b40]">
                    {t('unjustifiedShort')}
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
                  riskPaginatedStudents.map((student) => (
                    <StudentRiskRow key={student.id} student={student} />
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!isLoadingStudents && students.length > ANALYTICS_TABLE_PAGE_SIZE && (
            <AnalyticsMobilePagination
              page={safeRiskPage}
              totalPages={riskTotalPages}
              onGoToPage={goToRiskPage}
            />
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
