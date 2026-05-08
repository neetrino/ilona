'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { StatCard, Button } from '@/shared/components/ui';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useMyDashboard, type StudentUpcomingLesson } from '@/features/students';
import { formatCurrency } from '@/shared/lib/utils';
import { StudentNotesBlock } from '@/features/student-notes';

function isSameLocalCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function pickNextUpcomingLesson(lessons: StudentUpcomingLesson[]): StudentUpcomingLesson | null {
  const now = Date.now();
  const candidates = lessons
    .map((lesson) => ({ lesson, t: new Date(lesson.scheduledAt).getTime() }))
    .filter(({ t }) => t > now)
    .sort((x, y) => x.t - y.t);
  return candidates[0]?.lesson ?? null;
}

type ProgressTone = 'emerald' | 'sky' | 'amber';

function ProgressFactor({
  label,
  rate,
  detail,
  tone,
}: {
  label: string;
  rate: number;
  detail: string;
  tone: ProgressTone;
}) {
  const toneBar: Record<ProgressTone, string> = {
    emerald: 'bg-emerald-500',
    sky: 'bg-sky-500',
    amber: 'bg-amber-500',
  };
  const clamped = Math.max(0, Math.min(100, Math.round(rate)));
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span className="font-medium text-slate-700">{label}</span>
        <span>
          {clamped}% · <span className="text-slate-500">{detail}</span>
        </span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${toneBar[tone]}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export default function StudentDashboardPage() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const { user } = useAuthStore();

  const { data: dashboard, isLoading } = useMyDashboard();

  const upcomingLessons = dashboard?.upcomingLessons || [];
  const nextLesson = useMemo(
    () => pickNextUpcomingLesson(upcomingLessons),
    [upcomingLessons],
  );
  const nextLessonTeacherDisplay = useMemo(() => {
    if (!nextLesson) return null;
    const firstName = nextLesson.teacher?.user?.firstName || '';
    const lastName = nextLesson.teacher?.user?.lastName || '';
    const full = `${firstName} ${lastName}`.trim();
    const initials = `${firstName.charAt(0) || ''}${lastName.charAt(0) || ''}` || '?';
    return { full, initials };
  }, [nextLesson]);
  const stats = dashboard?.statistics;
  const pendingPayments = dashboard?.pendingPayments || [];

  const attendanceRate = stats?.attendance?.rate || 0;
  const totalLessons = stats?.attendance?.total || 0;
  const pendingPaymentAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  const nextPayment = pendingPayments[0];

  const formatLessonDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (isSameLocalCalendarDay(date, today)) return tCommon('today');
    if (isSameLocalCalendarDay(date, tomorrow)) return tCommon('tomorrow');
    return date.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatLessonTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatLessonCalendarDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  return (
    <DashboardLayout 
      title={t('myLearning')} 
      subtitle={t('welcomeStudent', { name: user?.firstName || tCommon('student') })}
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title={t('attendanceRate')}
            value={`${attendanceRate}%`}
            change={{
              value: attendanceRate >= 90 ? t('excellent') : attendanceRate >= 75 ? t('good') : t('needsImprovement'),
              type: attendanceRate >= 90 ? 'positive' : attendanceRate >= 75 ? 'neutral' : 'warning'
            }}
          />
          <StatCard
            title={t('totalLessons')}
            value={totalLessons}
            change={{ value: t('attendedCount', { count: stats?.attendance?.present || 0 }), type: 'positive' }}
          />
          <StatCard
            title={t('nextPayment')}
            value={nextPayment ? formatCurrency(Number(nextPayment.amount)) : t('none')}
            change={{
              value: nextPayment
                ? t('dueDate', { date: new Date(nextPayment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) })
                : t('allPaid'),
              type: nextPayment?.status === 'OVERDUE' ? 'warning' : 'neutral'
            }}
          />
        </div>

        <StudentNotesBlock />

        {/* Next upcoming lesson */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm shadow-slate-200/40">
          <div className="border-b border-slate-100 bg-gradient-to-br from-sky-50/90 via-white to-white px-4 py-5 sm:px-6 sm:py-6">
            <div className="flex items-start gap-3">
              <span
                className="mt-1.5 hidden h-9 w-1 shrink-0 rounded-full bg-gradient-to-b from-sky-400 to-sky-600 sm:block"
                aria-hidden
              />
              <div className="min-w-0">
                <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                  {t('upcomingLessonsTitle')}
                </h2>
                <p className="mt-1.5 max-w-md text-sm leading-relaxed text-slate-600 sm:text-[15px]">
                  {t('upcomingLessonsSubtitle')}
                </p>
              </div>
            </div>
          </div>
          <div className="p-5 sm:p-7">
            {isLoading ? (
              <div className="animate-pulse space-y-4" aria-hidden>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="h-16 w-16 shrink-0 rounded-xl bg-slate-100 sm:h-20 sm:w-20" />
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="h-4 w-24 rounded bg-slate-100" />
                    <div className="h-7 max-w-md rounded bg-slate-100" />
                    <div className="h-4 w-32 rounded bg-slate-100" />
                    <div className="h-6 max-w-sm rounded bg-slate-100" />
                  </div>
                </div>
              </div>
            ) : !nextLesson ? (
              <p className="mx-auto max-w-sm py-10 text-center text-[15px] font-medium leading-relaxed text-slate-600 sm:py-12 sm:text-base">
                {t('noUpcomingLessons')}
              </p>
            ) : (
              <div className="flex flex-col gap-7 sm:flex-row sm:items-start sm:gap-10">
                <div className="flex shrink-0 justify-center sm:justify-start">
                  <div className="rounded-2xl bg-gradient-to-br from-sky-100 to-sky-50/80 p-4 ring-1 ring-sky-100/80 sm:p-5">
                    <svg
                      className="h-10 w-10 text-sky-600 sm:h-12 sm:w-12"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
                <dl className="min-w-0 flex-1 space-y-6">
                  <div>
                    <dt className="text-sm font-medium text-slate-500">
                      {tCommon('date')}
                    </dt>
                    <dd className="mt-2 space-y-1.5">
                      <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-3">
                        <span className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.65rem]">
                          {formatLessonDateLabel(nextLesson.scheduledAt)}
                        </span>
                        <span className="text-lg font-medium tabular-nums text-sky-700">
                          {formatLessonTime(nextLesson.scheduledAt)}
                        </span>
                      </div>
                      <p className="text-sm font-medium leading-snug text-slate-600 sm:text-[15px]">
                        {formatLessonCalendarDate(nextLesson.scheduledAt)}
                      </p>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-slate-500">
                      {tCommon('searchTypeLesson')}
                    </dt>
                    <dd className="mt-2 break-words text-lg font-semibold leading-snug text-slate-800 sm:text-xl">
                      {nextLesson.topic?.trim() || tCommon('searchTypeLesson')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-slate-500">
                      {t('nextLessonTeacherLabel')}
                    </dt>
                    <dd className="mt-2">
                      {nextLessonTeacherDisplay ? (
                        <div className="flex items-center gap-3.5">
                          <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200/90 text-sm font-semibold text-slate-700 ring-1 ring-slate-200/80"
                            aria-hidden
                          >
                            {nextLessonTeacherDisplay.initials}
                          </div>
                          <span className="text-lg font-medium text-slate-900">
                            {nextLessonTeacherDisplay.full || '—'}
                          </span>
                        </div>
                      ) : null}
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        </section>

        {/* Pending Payments Alert */}
        {pendingPayments.length > 0 && (
          <div className={`rounded-2xl p-4 flex items-center gap-4 ${
            pendingPayments.some(p => p.status === 'OVERDUE') 
              ? 'bg-red-50 border border-red-200' 
              : 'bg-amber-50 border border-amber-200'
          }`}>
            <div className={`p-2 rounded-lg ${
              pendingPayments.some(p => p.status === 'OVERDUE') ? 'bg-red-100' : 'bg-amber-100'
            }`}>
              <svg className={`w-5 h-5 ${
                pendingPayments.some(p => p.status === 'OVERDUE') ? 'text-red-600' : 'text-amber-600'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className={`font-medium ${
                pendingPayments.some(p => p.status === 'OVERDUE') ? 'text-red-800' : 'text-amber-800'
              }`}>
                {pendingPayments.some(p => p.status === 'OVERDUE') 
                  ? 'Payment Overdue' 
                  : 'Payment Pending'}
              </p>
              <p className={`text-sm ${
                pendingPayments.some(p => p.status === 'OVERDUE') ? 'text-red-600' : 'text-amber-600'
              }`}>
                Total: {formatCurrency(pendingPaymentAmount)} • {pendingPayments.length} payment(s)
              </p>
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Pay Now
            </Button>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-50 rounded-xl">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 mb-2">
                  {t('yourProgress')}{' '}
                  <span className="ml-1 text-xs font-normal text-slate-500">
                    {t('overallProgress', { value: stats?.progress?.overall ?? 0 })}
                  </span>
                </h3>
                <ProgressFactor
                  label={t('factorAttendance')}
                  rate={stats?.progress?.attendanceRate ?? 0}
                  detail={t('lessonsRatio', {
                    present: stats?.attendance?.present ?? 0,
                    total: stats?.attendance?.total ?? 0,
                  })}
                  tone="emerald"
                />
                <ProgressFactor
                  label={t('factorRecordings')}
                  rate={stats?.progress?.recordingRate ?? 0}
                  detail={t('recordingsRatio', {
                    submitted: stats?.recordings?.submitted ?? 0,
                    total: stats?.recordings?.total ?? 0,
                  })}
                  tone="sky"
                />
                <ProgressFactor
                  label={t('factorPayments')}
                  rate={stats?.progress?.paymentRate ?? 0}
                  detail={t('paymentsRatio', {
                    paid: stats?.payments?.paid ?? 0,
                    due: (stats?.payments?.pending ?? 0) + (stats?.payments?.overdue ?? 0),
                  })}
                  tone="amber"
                />
                {stats?.attendance?.unjustifiedAbsences && stats.attendance.unjustifiedAbsences > 0 ? (
                  <p className="mt-3 text-xs text-red-600">
                    {t('unexcusedAbsencesShort', { count: stats.attendance.unjustifiedAbsences })}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 mb-2">Recent Vocabulary</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Review the words from your recent lessons to improve retention and build your vocabulary.
                </p>
                <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/90">
                  Practice Vocabulary
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
