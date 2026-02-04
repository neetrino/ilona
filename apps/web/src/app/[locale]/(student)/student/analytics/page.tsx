'use client';

import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useMyPayments } from '@/features/finance';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { cn } from '@/shared/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';

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
  // Fetch data
  const { data: attendance, isLoading: isLoadingAttendance } = useMyAttendance();
  const { data: payments, isLoading: isLoadingPayments } = useMyPayments();

  // Calculate attendance stats
  const stats = attendance?.statistics;
  const totalLessons = stats?.total || 0;
  const presentCount = stats?.present || 0;
  const absentJustified = stats?.absentJustified || 0;
  const absentUnjustified = stats?.absentUnjustified || 0;
  const attendanceRate = stats?.attendanceRate || 100;

  // Calculate payment stats
  const paymentsList = payments?.items || [];
  const paidPayments = paymentsList.filter((p) => p.status === 'PAID').length;
  const totalPayments = paymentsList.length;
  const paymentRate = totalPayments > 0 ? Math.round((paidPayments / totalPayments) * 100) : 100;

  // Calculate participation score (combined metric)
  const participationScore = Math.round((attendanceRate * 0.7) + (paymentRate * 0.3));

  const isLoading = isLoadingAttendance || isLoadingPayments;

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
            <h3 className="font-semibold text-slate-800 mb-6 text-center">Your Progress Overview</h3>
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
              <h3 className="font-semibold text-slate-800 mb-4">Attendance Breakdown</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">Present</span>
                    <span className="font-medium">{presentCount} lessons</span>
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
                    <span className="text-slate-600">Justified Absences</span>
                    <span className="font-medium">{absentJustified} lessons</span>
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
                    <span className="text-slate-600">Unjustified Absences</span>
                    <span className="font-medium">{absentUnjustified} lessons</span>
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
              <h3 className="font-semibold text-slate-800 mb-4">Tips for Success</h3>
              <div className="space-y-3">
                {attendanceRate >= 90 ? (
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <span className="text-green-600 text-xl">🎉</span>
                    <div>
                      <p className="font-medium text-green-800">Excellent Attendance!</p>
                      <p className="text-sm text-green-600">Keep up the great work!</p>
                    </div>
                  </div>
                ) : attendanceRate >= 70 ? (
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                    <span className="text-yellow-600 text-xl">💪</span>
                    <div>
                      <p className="font-medium text-yellow-800">Good Progress</p>
                      <p className="text-sm text-yellow-600">Try to attend a few more lessons to improve.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                    <span className="text-red-600 text-xl">⚠️</span>
                    <div>
                      <p className="font-medium text-red-800">Needs Improvement</p>
                      <p className="text-sm text-red-600">Regular attendance is key to learning success.</p>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="font-medium text-blue-800 mb-1">Study Tips</p>
                  <ul className="text-sm text-blue-600 space-y-1">
                    <li>• Review vocabulary recordings after each lesson</li>
                    <li>• Practice speaking English daily</li>
                    <li>• Don't hesitate to ask questions in chat</li>
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
                  <h4 className="font-semibold text-red-800">Attendance Warning</h4>
                  <p className="text-sm text-red-600">
                    You have {absentUnjustified} unjustified absences. Please contact your teacher or admin if you need help.
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
