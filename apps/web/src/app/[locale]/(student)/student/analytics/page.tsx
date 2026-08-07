'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useMyPayments } from '@/features/finance';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { formatCurrency, formatMonthYear } from '@/shared/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';
import { AnalyticsTimeFilterBar } from '@/shared/components/analytics/AnalyticsTimeFilterBar';
import {
  buildTimeRange,
  defaultCustomRangeLast30Days,
  toYmd,
  type TimeFilterMode,
} from '@/shared/lib/analytics-time-range';
import {
  StudentAlert,
  StudentBadge,
  StudentCard,
  StudentLoadingState,
  StudentPageStack,
  StudentProgressBar,
  StudentProgressRing,
  StudentSectionHeader,
  StudentStatTile,
  StudentTableBody,
  StudentTableHead,
  StudentTableRow,
  StudentTableShell,
  StudentTd,
  StudentTh,
  paymentStatusVariant,
} from '@/features/student-ui';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';

interface StudentAttendanceStats {
  attendances: {
    id: string;
    isPresent: boolean;
    absenceType?: 'JUSTIFIED' | 'UNJUSTIFIED' | null;
  }[];
  statistics: {
    total: number;
    present: number;
    absent: number;
    absentJustified: number;
    absentUnjustified: number;
    attendanceRate: number;
  };
}

function useMyAttendance() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['my-attendance', user?.id],
    queryFn: async () => api.get<StudentAttendanceStats>('/attendance/my'),
    enabled: !!user && user.role === 'STUDENT',
  });
}

function ringColor(value: number): string {
  if (value >= 90) return '#0a7a3e';
  if (value >= 70) return '#8b4a00';
  return '#b42318';
}

function paymentStatusLabel(status: string, t: (key: string) => string): string {
  if (status === 'PENDING') return t('pending');
  if (status === 'PAID') return t('paid');
  if (status === 'OVERDUE') return t('overdue');
  if (status === 'CANCELLED') return t('cancelled');
  return status;
}

export default function StudentAnalyticsPage() {
  const t = useTranslations('analytics');
  const locale = useLocale();
  const tCommon = useTranslations('common');
  const tFinance = useTranslations('finance');
  const defPay = useMemo(() => defaultCustomRangeLast30Days(), []);
  const [timeMode, setTimeMode] = useState<TimeFilterMode>('date');
  const [dayYmd, setDayYmd] = useState(() => toYmd(new Date()));
  const [weekAnchorYmd, setWeekAnchorYmd] = useState(() => toYmd(new Date()));
  const [customFromYmd, setCustomFromYmd] = useState(defPay.fromYmd);
  const [customToYmd, setCustomToYmd] = useState(defPay.toYmd);

  const payTimeRange = useMemo(
    () =>
      buildTimeRange(timeMode, {
        dayYmd,
        weekAnchorYmd,
        customFromYmd,
        customToYmd,
      }),
    [timeMode, dayYmd, weekAnchorYmd, customFromYmd, customToYmd],
  );

  const { data: attendance, isLoading: isLoadingAttendance } = useMyAttendance();
  const { data: payments, isLoading: isLoadingPayments } = useMyPayments();
  const { data: payPeriod, isLoading: isLoadingPayPeriod } = useMyPayments(
    0,
    200,
    undefined,
    payTimeRange.dateFrom,
    payTimeRange.dateTo,
  );

  const stats = attendance?.statistics;
  const totalLessons = stats?.total || 0;
  const presentCount = stats?.present || 0;
  const absentJustified = stats?.absentJustified || 0;
  const absentUnjustified = stats?.absentUnjustified || 0;
  const attendanceRate = stats?.attendanceRate || 100;

  const paymentsList = payments?.items || [];
  const paidPayments = paymentsList.filter((p) => p.status === 'PAID').length;
  const totalPayments = paymentsList.length;
  const paymentRate = totalPayments > 0 ? Math.round((paidPayments / totalPayments) * 100) : 100;

  const payPeriodList = useMemo(() => payPeriod?.items ?? [], [payPeriod]);
  const paidInRange = useMemo(
    () => payPeriodList.filter((p) => p.status === 'PAID'),
    [payPeriodList],
  );
  const paidTotalAmount = paidInRange.reduce((s, p) => s + Number(p.amount), 0);
  const outstandingInRange = useMemo(
    () => payPeriodList.filter((p) => p.status === 'PENDING' || p.status === 'OVERDUE'),
    [payPeriodList],
  );

  const participationScore = Math.round(attendanceRate * 0.7 + paymentRate * 0.3);
  const isLoading = isLoadingAttendance || isLoadingPayments;
  const isLoadingPayAnalytics = isLoadingPayPeriod;

  return (
    <DashboardLayout title={t('myAnalytics')} subtitle={t('studentSubtitle')}>
      {isLoading ? (
        <StudentLoadingState message={t('studentSubtitle')} />
      ) : (
        <StudentPageStack>
          <StudentCard>
            <StudentSectionHeader title={t('yourProgressOverview')} />
            <div className="flex flex-wrap justify-center gap-8 sm:gap-10">
              <StudentProgressRing
                value={attendanceRate}
                label={t('attendanceRate')}
                strokeColor={ringColor(attendanceRate)}
              />
              <StudentProgressRing
                value={paymentRate}
                label={t('paymentStatus')}
                strokeColor={ringColor(paymentRate)}
              />
              <StudentProgressRing
                value={participationScore}
                label={t('overallScore')}
                strokeColor={ringColor(participationScore)}
              />
            </div>
          </StudentCard>

          <StudentCard>
            <StudentSectionHeader
              title={t('paymentsSectionTitle')}
              subtitle={t('paymentsTimeFilterLabel')}
            />
            <AnalyticsTimeFilterBar
              variant="student"
              mode={timeMode}
              onModeChange={setTimeMode}
              dayYmd={dayYmd}
              onDayYmdChange={setDayYmd}
              weekAnchorYmd={weekAnchorYmd}
              onWeekAnchorYmdChange={setWeekAnchorYmd}
              customFromYmd={customFromYmd}
              customToYmd={customToYmd}
              onCustomFromYmd={setCustomFromYmd}
              onCustomToYmd={setCustomToYmd}
              className="mb-4"
            />
            {isLoadingPayAnalytics ? (
              <div className="flex h-32 items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.125rem] border border-[rgba(14,14,16,0.07)] bg-[#fafafa] p-4">
                    <p className="text-xs tracking-wide text-[#8b8b90]">{t('paidInPeriod')}</p>
                    <p className="mt-1 text-2xl font-bold text-[#0a7a3e]">
                      {formatCurrency(paidTotalAmount)}
                    </p>
                    <p className="mt-1 text-xs text-[#8b8b90]">
                      {t('paymentsRowsSummary', {
                        paid: paidInRange.length,
                        total: payPeriodList.length,
                      })}
                    </p>
                  </div>
                  <div className="rounded-[1.125rem] border border-[rgba(14,14,16,0.07)] bg-[#fafafa] p-4">
                    <p className="text-xs tracking-wide text-[#8b8b90]">{t('outstandingInPeriod')}</p>
                    <p className="mt-1 text-2xl font-bold text-[#8b4a00]">
                      {outstandingInRange.length}
                    </p>
                    <p className="mt-1 text-xs text-[#8b8b90]">{t('unpaidInRange')}</p>
                  </div>
                </div>
                {payPeriodList.length > 0 && (
                  <StudentTableShell className="[&_table]:table-fixed [&_table]:min-w-full">
                    <colgroup>
                      <col className="w-1/3" />
                      <col className="w-1/3" />
                      <col className="w-1/3" />
                    </colgroup>
                    <StudentTableHead>
                      <tr>
                        <StudentTh className="!text-left">{tCommon('period')}</StudentTh>
                        <StudentTh className="!text-center">{tCommon('status')}</StudentTh>
                        <StudentTh className="!text-right">{tCommon('amount')}</StudentTh>
                      </tr>
                    </StudentTableHead>
                    <StudentTableBody>
                      {payPeriodList.map((p) => (
                        <StudentTableRow key={p.id}>
                          <StudentTd className="!text-left align-middle">
                            <span className="font-medium text-[#1010a3]">
                              {p.month ? formatMonthYear(p.month, locale) : '—'}
                            </span>
                          </StudentTd>
                          <StudentTd className="!text-center align-middle">
                            <StudentBadge variant={paymentStatusVariant(p.status)}>
                              {paymentStatusLabel(p.status, tFinance)}
                            </StudentBadge>
                          </StudentTd>
                          <StudentTd className="!text-right align-middle font-semibold text-[#1010a3]">
                            {formatCurrency(Number(p.amount))}
                          </StudentTd>
                        </StudentTableRow>
                      ))}
                    </StudentTableBody>
                  </StudentTableShell>
                )}
              </div>
            )}
          </StudentCard>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StudentStatTile
              label={t('totalLessons')}
              value={totalLessons}
              tone="sky"
              icon={
                <svg className="h-5 w-5 text-[#1010a3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
            />
            <StudentStatTile
              label={t('present')}
              value={presentCount}
              tone="lime"
              icon={
                <svg className="h-5 w-5 text-[#1010a3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              }
            />
            <StudentStatTile
              label={t('justifiedAbsences')}
              value={absentJustified}
              tone="amber"
              icon={
                <svg className="h-5 w-5 text-[#8b4a00]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
            />
            <StudentStatTile
              label={t('unjustifiedAbsences')}
              value={absentUnjustified}
              tone="rose"
              valueClassName="text-[#b42318]"
              icon={
                <svg className="h-5 w-5 text-[#b42318]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
            <StudentCard>
              <StudentSectionHeader title={t('attendanceBreakdown')} />
              <div className="space-y-4">
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-[#8b8b90]">{t('present')}</span>
                    <span className="font-medium text-[#1010a3]">
                      {presentCount} {t('lessons')}
                    </span>
                  </div>
                  <StudentProgressBar
                    percent={totalLessons > 0 ? (presentCount / totalLessons) * 100 : 0}
                    barClassName="bg-[#0a7a3e]"
                  />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-[#8b8b90]">{t('justifiedAbsences')}</span>
                    <span className="font-medium text-[#1010a3]">
                      {absentJustified} {t('lessons')}
                    </span>
                  </div>
                  <StudentProgressBar
                    percent={totalLessons > 0 ? (absentJustified / totalLessons) * 100 : 0}
                    barClassName="bg-[#8b4a00]"
                  />
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-[#8b8b90]">{t('unjustifiedAbsences')}</span>
                    <span className="font-medium text-[#1010a3]">
                      {absentUnjustified} {t('lessons')}
                    </span>
                  </div>
                  <StudentProgressBar
                    percent={totalLessons > 0 ? (absentUnjustified / totalLessons) * 100 : 0}
                    barClassName="bg-[#b42318]"
                  />
                </div>
              </div>
            </StudentCard>

            <StudentCard>
              <StudentSectionHeader title={t('tipsForSuccess')} />
              <div className="space-y-3">
                {attendanceRate >= 90 ? (
                  <StudentAlert variant="success" title={t('excellentAttendance')}>
                    {t('keepUpGreatWork')}
                  </StudentAlert>
                ) : attendanceRate >= 70 ? (
                  <StudentAlert variant="warning" title={t('goodProgress')}>
                    {t('tryAttendMore')}
                  </StudentAlert>
                ) : (
                  <StudentAlert variant="danger" title={t('needsImprovement')}>
                    {t('regularAttendanceKey')}
                  </StudentAlert>
                )}
                <StudentAlert variant="info" title={t('studyTips')}>
                  <ul className="space-y-1">
                    <li>• {t('reviewVocabularyRecordings')}</li>
                    <li>• {t('practiceSpeakingDaily')}</li>
                    <li>• {t('askQuestionsInChat')}</li>
                  </ul>
                </StudentAlert>
              </div>
            </StudentCard>
          </div>

          {absentUnjustified >= 3 && (
            <StudentAlert variant="danger" title={t('attendanceWarning')}>
              {t('unjustifiedAbsencesWarning', { count: absentUnjustified })}
            </StudentAlert>
          )}
        </StudentPageStack>
      )}
    </DashboardLayout>
  );
}
