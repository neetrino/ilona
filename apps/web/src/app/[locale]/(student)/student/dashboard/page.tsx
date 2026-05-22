'use client';

import { useMemo } from 'react';
import { DashboardLayout } from '@/shared/components/layout';
import { useMyDashboard } from '@/features/students';
import { StudentNotesBlock } from '@/features/student-notes';
import {
  StudentDashboardHero,
  StudentDashboardStatCards,
  StudentUpcomingLessonsCard,
  StudentProgressCard,
  StudentPaymentPendingCard,
} from '@/features/student-dashboard';

function daysUntil(dateStr: string): number {
  const due = new Date(dateStr);
  const now = new Date();
  return Math.max(0, Math.ceil((due.getTime() - now.getTime()) / 86_400_000));
}

export default function StudentDashboardPage() {
  const { data: dashboard, isLoading } = useMyDashboard();

  const stats = dashboard?.statistics;
  const pendingPayments = dashboard?.pendingPayments ?? [];
  const upcomingLessons = dashboard?.upcomingLessons ?? [];
  const levelLabel = dashboard?.student?.group?.level;

  const nextPayment = pendingPayments[0];
  const resumeTopic = upcomingLessons[0]?.topic?.trim();

  const paymentMeta = useMemo(() => {
    if (!nextPayment) return { amount: null as number | null, days: null as number | null };
    return {
      amount: Number(nextPayment.amount),
      days: daysUntil(nextPayment.dueDate),
    };
  }, [nextPayment]);

  return (
    <DashboardLayout title="" variant="student">
      <div className="flex w-full min-w-0 flex-col gap-5 lg:gap-6">
        <StudentDashboardHero
          streakDays={stats?.attendance?.currentStreak ?? 0}
          levelLabel={levelLabel}
          resumeTopic={resumeTopic}
        />

        <StudentDashboardStatCards
          isLoading={isLoading}
          attendanceRate={stats?.attendance?.rate ?? 0}
          presentCount={stats?.attendance?.present ?? 0}
          totalSessions={stats?.attendance?.total ?? 0}
          totalLessons={stats?.attendance?.total ?? 0}
          attendedLessons={stats?.attendance?.present ?? 0}
          nextPaymentAmount={paymentMeta.amount}
          daysUntilDue={paymentMeta.days}
        />

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] xl:gap-6">
          <div className="flex flex-col gap-5 lg:gap-6">
            <StudentUpcomingLessonsCard lessons={upcomingLessons} isLoading={isLoading} />
            <StudentProgressCard
              isLoading={isLoading}
              overall={stats?.progress?.overall ?? 0}
              attendanceRate={stats?.progress?.attendanceRate ?? stats?.attendance?.rate ?? 0}
              studyProgress={stats?.progress?.recordingRate ?? 0}
              levelLabel={levelLabel}
            />
          </div>

          <div className="flex flex-col gap-5 lg:gap-6">
            <StudentNotesBlock variant="dashboard" levelLabel={levelLabel} />
            <StudentPaymentPendingCard payments={pendingPayments} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
