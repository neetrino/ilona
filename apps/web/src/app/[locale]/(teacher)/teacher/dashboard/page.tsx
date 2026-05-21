'use client';

import { useLocale, useTranslations } from 'next-intl';
import { DashboardLayout, DashboardPromoBanner } from '@/shared/components/layout';
import { formatLocaleInteger } from '@/shared/lib/utils';
import { DataTable } from '@/shared/components/ui';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useLessons, useStartLesson, useCompleteLesson, type Lesson } from '@/features/lessons';
import { useMyGroups } from '@/features/groups';
import { PlannedAbsencesStaffBlock } from '@/features/attendance';
import { NotesBlock } from '@/features/teacher-notes';
import {
  StudentBadge,
  StudentCard,
  StudentGhostButton,
  StudentInnerCard,
  StudentPageStack,
  StudentPrimaryButton,
  StudentSectionHeader,
  StudentStatTile,
} from '@/features/student-ui';

function lessonStatusVariant(status: string): 'success' | 'warning' | 'neutral' | 'info' {
  switch (status) {
    case 'COMPLETED':
      return 'success';
    case 'IN_PROGRESS':
      return 'warning';
    case 'CANCELLED':
      return 'neutral';
    default:
      return 'info';
  }
}

export default function TeacherDashboardPage() {
  const tDash = useTranslations('dashboard');
  const locale = useLocale();
  const { user } = useAuthStore();

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

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

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

  const lessonColumns = [
    {
      key: 'time',
      header: 'Time',
      render: (lesson: Lesson) => (
        <div className="text-center">
          <p className="font-semibold text-[#1010a3]">{formatTime(lesson.scheduledAt)}</p>
          <p className="text-xs text-[#8b8b90]">{lesson.duration} min</p>
        </div>
      ),
    },
    {
      key: 'lesson',
      header: 'Lesson',
      render: (lesson: Lesson) => (
        <div>
          <p className="font-semibold text-[#1010a3]">{lesson.topic || 'Untitled'}</p>
          <p className="text-sm text-[#8b8b90]">Level: {lesson.group?.level || 'N/A'}</p>
        </div>
      ),
    },
    {
      key: 'group',
      header: 'Group',
      render: (lesson: Lesson) => (
        <StudentBadge variant="info">{lesson.group?.name || 'No group'}</StudentBadge>
      ),
    },
    {
      key: 'students',
      header: 'Students',
      className: 'text-center',
      render: (lesson: Lesson) => (
        <span className="font-medium text-[#3b3b40]">
          {lesson.group?._count?.students || lesson._count?.attendances || 0}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (lesson: Lesson) => (
        <StudentBadge variant={lessonStatusVariant(lesson.status)}>
          {lesson.status === 'IN_PROGRESS' ? 'In Progress' : lesson.status.charAt(0) + lesson.status.slice(1).toLowerCase()}
        </StudentBadge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (lesson: Lesson) => (
        <div className="flex flex-wrap items-center gap-2">
          {lesson.status === 'SCHEDULED' && (
            <StudentPrimaryButton
              type="button"
              className="min-h-9 px-4 text-xs"
              onClick={() => handleStartLesson(lesson.id)}
              disabled={startLesson.isPending}
            >
              Start
            </StudentPrimaryButton>
          )}
          {lesson.status === 'IN_PROGRESS' && (
            <StudentPrimaryButton
              type="button"
              className="min-h-9 bg-[#0a7a3e] px-4 text-xs hover:opacity-90"
              onClick={() => handleCompleteLesson(lesson.id)}
              disabled={completeLesson.isPending}
            >
              Complete
            </StudentPrimaryButton>
          )}
          {lesson.status === 'COMPLETED' && (
            <StudentGhostButton type="button" className="min-h-9 px-4 text-xs">
              View
            </StudentGhostButton>
          )}
        </div>
      ),
    },
  ];

  const promoBanner = (
    <DashboardPromoBanner
      title={tDash('banner.teacherTitle')}
      subtitle={tDash('banner.teacherSubtitle')}
      primaryStat={{
        label: tDash('banner.statStudents'),
        value: formatLocaleInteger(totalStudents, locale),
      }}
      secondaryStat={{
        label: tDash('banner.statLessonsToday'),
        value: tDash('banner.statValueLessonsToday', { count: todayLessons.length }),
      }}
    />
  );

  return (
    <DashboardLayout
      title=""
      subtitle=""
      promoBanner={promoBanner}
    >
      <StudentPageStack>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StudentStatTile
            label="Today's Lessons"
            value={todayLessons.length}
            tone="sky"
            icon={
              <svg className="h-5 w-5 text-[#1010a3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
          <StudentStatTile
            label="Total Students"
            value={totalStudents}
            tone="violet"
            icon={
              <svg className="h-5 w-5 text-[#1010a3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />
          <StudentStatTile
            label="Pending Lessons"
            value={scheduledLessons}
            tone="amber"
            icon={
              <svg className="h-5 w-5 text-[#1010a3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StudentStatTile
            label="Vocabulary Sent"
            value={`${vocabularySent}/${todayLessons.length}`}
            tone="lime"
            icon={
              <svg className="h-5 w-5 text-[#1010a3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            }
          />
        </div>

        <NotesBlock />
        <PlannedAbsencesStaffBlock />

        <StudentCard noPadding>
          <div className="border-b border-[rgba(14,14,16,0.07)] px-5 py-4 sm:px-6">
            <StudentSectionHeader title="Today's Lessons" className="mb-0" />
          </div>
          <DataTable
            embedInParentCard
            columns={lessonColumns}
            data={todayLessons}
            keyExtractor={(lesson) => lesson.id}
            isLoading={isLoadingLessons}
            emptyMessage="No lessons scheduled for today"
            tableClassName="text-sm"
          />
        </StudentCard>

        {groups.length > 0 ? (
          <StudentCard>
            <StudentSectionHeader title="My Groups" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {groups.slice(0, 6).map((group) => (
                <StudentInnerCard key={group.id}>
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h4 className="font-medium text-[#1010a3]">{group.name}</h4>
                    {group.level ? <StudentBadge variant="info">{group.level}</StudentBadge> : null}
                  </div>
                  <p className="text-sm text-[#8b8b90]">
                    {group._count?.students || 0} students • {group._count?.lessons || 0} lessons
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
                <svg className="h-6 w-6 text-[#3a2f00]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-[#1010a3]">Student Feedback</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#8b8b90]">
                  Remember to provide feedback for students after each lesson. This helps track progress and keeps parents informed.
                </p>
                <button
                  type="button"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#1010a3] hover:opacity-80"
                >
                  Write Feedback
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
          </StudentCard>

          <StudentCard>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[0.875rem] bg-[#ddecff]">
                <svg className="h-6 w-6 text-[#1010a3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-[#1010a3]">Send Vocabulary</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#8b8b90]">
                  Send today&apos;s vocabulary list to your groups after each lesson. This helps students review and retain new words.
                </p>
                <button
                  type="button"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#1010a3] hover:opacity-80"
                >
                  Open Group Chat
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
          </StudentCard>
        </div>
      </StudentPageStack>
    </DashboardLayout>
  );
}
