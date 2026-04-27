'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useMyPayments } from '@/features/finance';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { cn, formatCurrency } from '@/shared/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';
import { AnalyticsTimeFilterBar } from '@/shared/components/analytics/AnalyticsTimeFilterBar';
import {
  buildTimeRange,
  defaultCustomRangeLast30Days,
  toYmd,
  type TimeFilterMode,
} from '@/shared/lib/analytics-time-range';

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
    queryFn: async () => {
      // Use the /attendance/my endpoint for the current student
      return api.get<StudentAttendanceStats>('/attendance/my');
    },
    enabled: !!user && user.role === 'STUDENT',
  });
}

function StatCard({
  label,
  value,
  icon,
  color = 'blue',
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red';
}) {
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-3">
        <div className={cn('p-3 rounded-lg text-white', colors[color])}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          <p className="text-sm text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function CircularProgress({ value, label, color }: { value: number; label: string; color: string }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = ((100 - value) / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 transform -rotate-90">
          <circle
            cx="56"
            cy="56"
            r={radius}
            stroke="#e2e8f0"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="56"
            cy="56"
            r={radius}
            stroke={color}
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={progress}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-slate-800">{value}%</span>
        </div>
      </div>
      <p className="mt-2 text-sm text-slate-600">{label}</p>
    </div>
  );
}

export default function StudentAnalyticsPage() {
  const t = useTranslations('analytics');
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
        customFromYmd: customFromYmd,
        customToYmd: customToYmd,
      }),
    [timeMode, dayYmd, weekAnchorYmd, customFromYmd, customToYmd],
  );

  // Fetch data
  const { data: attendance, isLoading: isLoadingAttendance } = useMyAttendance();
  const { data: payments, isLoading: isLoadingPayments } = useMyPayments();
  const { data: payPeriod, isLoading: isLoadingPayPeriod } = useMyPayments(
    0,
    200,
    undefined,
    payTimeRange.dateFrom,
    payTimeRange.dateTo,
  );

  // Calculate attendance stats
  const stats = attendance?.statistics;
  const totalLessons = stats?.total || 0;
  const presentCount = stats?.present || 0;
  const absentJustified = stats?.absentJustified || 0;
  const absentUnjustified = stats?.absentUnjustified || 0;
  const attendanceRate = stats?.attendanceRate || 100;

  // Calculate payment stats (all-time, progress rings)
  const paymentsList = payments?.items || [];
  const paidPayments = paymentsList.filter((p) => p.status === 'PAID').length;
  const totalPayments = paymentsList.length;
  const paymentRate = totalPayments > 0 ? Math.round((paidPayments / totalPayments) * 100) : 100;

  const payPeriodList = payPeriod?.items || [];
  const paidInRange = useMemo(
    () => payPeriodList.filter((p) => p.status === 'PAID'),
    [payPeriodList],
  );
  const paidTotalAmount = paidInRange.reduce((s, p) => s + Number(p.amount), 0);
  const outstandingInRange = useMemo(
    () => payPeriodList.filter((p) => p.status === 'PENDING' || p.status === 'OVERDUE'),
    [payPeriodList],
  );

  // Calculate participation score (combined metric)
  const participationScore = Math.round((attendanceRate * 0.7) + (paymentRate * 0.3));

  const isLoading = isLoadingAttendance || isLoadingPayments;
  const isLoadingPayAnalytics = isLoadingPayPeriod;

  return (
    <DashboardLayout
      title={t('myAnalytics')}
      subtitle={t('studentSubtitle')}
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          {/* Progress Circles */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <h3 className="font-semibold text-slate-800 mb-6 text-center">{t('yourProgressOverview')}</h3>
            <div className="flex flex-wrap justify-center gap-8">
              <CircularProgress
                value={attendanceRate}
                label={t('attendanceRate')}
                color={attendanceRate >= 90 ? '#22c55e' : attendanceRate >= 70 ? '#eab308' : '#ef4444'}
              />
              <CircularProgress
                value={paymentRate}
                label={t('paymentStatus')}
                color={paymentRate >= 90 ? '#22c55e' : paymentRate >= 70 ? '#eab308' : '#ef4444'}
              />
              <CircularProgress
                value={participationScore}
                label={t('overallScore')}
                color={participationScore >= 90 ? '#22c55e' : participationScore >= 70 ? '#eab308' : '#ef4444'}
              />
            </div>
          </div>

          <div className="mb-6">
            <h3 className="mb-2 font-semibold text-slate-800">{t('paymentsSectionTitle')}</h3>
            <p className="mb-2 text-sm font-medium text-slate-600">{t('paymentsTimeFilterLabel')}</p>
            <AnalyticsTimeFilterBar
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
              className="mb-4 transition-all duration-200"
            />
            {isLoadingPayAnalytics ? (
              <div className="flex h-32 items-center justify-center rounded-xl border border-slate-200 bg-white">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-sm text-slate-500">{t('paidInPeriod')}</p>
                    <p className="text-2xl font-bold text-emerald-700">
                      {formatCurrency(paidTotalAmount)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t('paymentsRowsSummary', { paid: paidInRange.length, total: payPeriodList.length })}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-sm text-slate-500">{t('outstandingInPeriod')}</p>
                    <p className="text-2xl font-bold text-amber-700">
                      {outstandingInRange.length}
                    </p>
                    <p className="text-xs text-slate-500">Unpaid in range</p>
                  </div>
                </div>
                {payPeriodList.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-4 py-3">Period</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {payPeriodList.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="px-4 py-2 text-slate-800">
                              {p.month
                                ? new Date(p.month).toLocaleDateString(undefined, {
                                    month: 'long',
                                    year: 'numeric',
                                  })
                                : '—'}
                            </td>
                            <td className="px-4 py-2">{p.status}</td>
                            <td className="px-4 py-2 text-right font-medium">
                              {formatCurrency(Number(p.amount))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label={t('totalLessons')}
              value={totalLessons}
              color="blue"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
            />
            <StatCard
              label={t('present')}
              value={presentCount}
              color="green"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              }
            />
            <StatCard
              label={t('justifiedAbsences')}
              value={absentJustified}
              color="yellow"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
            />
            <StatCard
              label={t('unjustifiedAbsences')}
              value={absentUnjustified}
              color="red"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              }
            />
          </div>

          {/* Attendance Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">{t('attendanceBreakdown')}</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">{t('present')}</span>
                    <span className="font-medium">{presentCount} {t('lessons')}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full"
                      style={{ width: `${totalLessons > 0 ? (presentCount / totalLessons) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">{t('justifiedAbsences')}</span>
                    <span className="font-medium">{absentJustified} {t('lessons')}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className="bg-yellow-500 h-3 rounded-full"
                      style={{ width: `${totalLessons > 0 ? (absentJustified / totalLessons) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">{t('unjustifiedAbsences')}</span>
                    <span className="font-medium">{absentUnjustified} {t('lessons')}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className="bg-red-500 h-3 rounded-full"
                      style={{ width: `${totalLessons > 0 ? (absentUnjustified / totalLessons) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">{t('tipsForSuccess')}</h3>
              <div className="space-y-3">
                {attendanceRate >= 90 ? (
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <span className="text-green-600 text-xl">🎉</span>
                    <div>
                      <p className="font-medium text-green-800">{t('excellentAttendance')}</p>
                      <p className="text-sm text-green-600">{t('keepUpGreatWork')}</p>
                    </div>
                  </div>
                ) : attendanceRate >= 70 ? (
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                    <span className="text-yellow-600 text-xl">💪</span>
                    <div>
                      <p className="font-medium text-yellow-800">{t('goodProgress')}</p>
                      <p className="text-sm text-yellow-600">{t('tryAttendMore')}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                    <span className="text-red-600 text-xl">⚠️</span>
                    <div>
                      <p className="font-medium text-red-800">{t('needsImprovement')}</p>
                      <p className="text-sm text-red-600">{t('regularAttendanceKey')}</p>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="font-medium text-blue-800 mb-1">{t('studyTips')}</p>
                  <ul className="text-sm text-blue-600 space-y-1">
                    <li>• {t('reviewVocabularyRecordings')}</li>
                    <li>• {t('practiceSpeakingDaily')}</li>
                    <li>• {t('askQuestionsInChat')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Warning if too many unjustified absences */}
          {absentUnjustified >= 3 && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-red-600 text-2xl">⚠️</span>
                <div>
                  <h4 className="font-semibold text-red-800">{t('attendanceWarning')}</h4>
                  <p className="text-sm text-red-600">
                    {t('unjustifiedAbsencesWarning', { count: absentUnjustified })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
