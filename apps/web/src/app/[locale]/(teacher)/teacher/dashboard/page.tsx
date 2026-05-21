'use client';

import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useLessons, useStartLesson, useCompleteLesson } from '@/features/lessons';
import { useMyGroups } from '@/features/groups';
import { PlannedAbsencesStaffBlock } from '@/features/attendance';
import { NotesBlock } from '@/features/teacher-notes';
import {
  TeacherDashboardHero,
  TeacherDashboardStatCards,
  TeacherTodayLessonsCard,
} from '@/features/teacher-dashboard';
import {
  StudentBadge,
  StudentCard,
  StudentInnerCard,
  StudentSectionHeader,
} from '@/features/student-ui';

export default function TeacherDashboardPage() {
  const tDash = useTranslations('dashboard');
  useAuthStore();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: lessonsData, isLoading: isLoadingLessons } = useLessons({
    dateFrom: today.toISOString(),
    dateTo: tomorrow.toISOString(),
    take: 20,
  });

  const { data: groups = [] } = useMyGroups();
  const startLesson = useStartLesson();
  const completeLesson = useCompleteLesson();

  const todayLessons = lessonsData?.items || [];
  const totalStudents = groups.reduce((sum, g) => sum + (g._count?.students || 0), 0);
  const scheduledLessons = todayLessons.filter((l) => l.status === 'SCHEDULED').length;
  const completedLessons = todayLessons.filter((l) => l.status === 'COMPLETED').length;
  const vocabularySent = todayLessons.filter((l) => l.vocabularySent).length;

  const handleStartLesson = async (id: string) => {
    try {
      await startLesson.mutateAsync(id);
    } catch (err) {
      console.error('Failed to start lesson:', err);
    }
  };

  const handleCompleteLesson = async (id: string) => {
    try {
      await completeLesson.mutateAsync({ id });
    } catch (err) {
      console.error('Failed to complete lesson:', err);
    }
  };

  return (
    <DashboardLayout title="" subtitle="">
      <div className="flex w-full min-w-0 flex-col gap-5 lg:gap-6">
        <TeacherDashboardHero
          totalStudents={totalStudents}
          groupsCount={groups.length}
          todayLessonsCount={todayLessons.length}
          completedLessons={completedLessons}
        />

        <TeacherDashboardStatCards
          isLoading={isLoadingLessons}
          todayLessonsCount={todayLessons.length}
          completedLessons={completedLessons}
          totalStudents={totalStudents}
          groupsCount={groups.length}
          scheduledLessons={scheduledLessons}
          vocabularySent={vocabularySent}
        />

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] xl:gap-6">
          <div className="flex min-w-0 flex-col gap-5 lg:gap-6">
            <TeacherTodayLessonsCard
              lessons={todayLessons}
              isLoading={isLoadingLessons}
              onStartLesson={handleStartLesson}
              onCompleteLesson={handleCompleteLesson}
              isStartPending={startLesson.isPending}
              isCompletePending={completeLesson.isPending}
            />

            {groups.length > 0 ? (
              <StudentCard>
                <StudentSectionHeader title={tDash('teacherStats.myGroups')} />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {groups.slice(0, 6).map((group) => (
                    <StudentInnerCard key={group.id}>
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h4 className="font-medium text-[#1010a3]">{group.name}</h4>
                        {group.level ? (
                          <StudentBadge variant="info">{group.level}</StudentBadge>
                        ) : null}
                      </div>
                      <p className="text-sm text-[#8b8b90]">
                        {group._count?.students || 0} students · {group._count?.lessons || 0}{' '}
                        lessons
                      </p>
                      {group.center?.name ? (
                        <p className="mt-1 text-xs text-[#8b8b90]">{group.center.name}</p>
                      ) : null}
                    </StudentInnerCard>
                  ))}
                </div>
              </StudentCard>
            ) : null}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <StudentCard>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[0.875rem] bg-[#ffeb8c]">
                    <svg
                      className="h-6 w-6 text-[#3a2f00]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-[#1010a3]">
                      {tDash('teacherTips.feedbackTitle')}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#8b8b90]">
                      {tDash('teacherTips.feedbackBody')}
                    </p>
                  </div>
                </div>
              </StudentCard>

              <StudentCard>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[0.875rem] bg-[#ddecff]">
                    <svg
                      className="h-6 w-6 text-[#1010a3]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-[#1010a3]">
                      {tDash('teacherTips.vocabularyTitle')}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#8b8b90]">
                      {tDash('teacherTips.vocabularyBody')}
                    </p>
                  </div>
                </div>
              </StudentCard>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-5 lg:gap-6">
            <NotesBlock variant="dashboard" />
            <PlannedAbsencesStaffBlock />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
