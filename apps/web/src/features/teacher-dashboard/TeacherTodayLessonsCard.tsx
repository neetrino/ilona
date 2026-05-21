'use client';

import { PublicAssetImage } from '@/shared/components/ui';
import { useLocale, useTranslations } from 'next-intl';
import type { Lesson } from '@/features/lessons';
import { STUDENT_DASHBOARD_ASSETS } from '@/features/student-dashboard/assets';
import { StudentBadge, StudentGhostButton, StudentPrimaryButton } from '@/features/student-ui';

type TeacherTodayLessonsCardProps = {
  lessons: Lesson[];
  isLoading?: boolean;
  onStartLesson: (id: string) => void;
  onCompleteLesson: (id: string) => void;
  isStartPending?: boolean;
  isCompletePending?: boolean;
};

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

function statusLabel(status: string): string {
  if (status === 'IN_PROGRESS') return 'In Progress';
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function LessonRow({
  lesson,
  locale,
  t,
  onStartLesson,
  onCompleteLesson,
  isStartPending,
  isCompletePending,
}: {
  lesson: Lesson;
  locale: string;
  t: (key: string) => string;
  onStartLesson: (id: string) => void;
  onCompleteLesson: (id: string) => void;
  isStartPending?: boolean;
  isCompletePending?: boolean;
}) {
  const date = new Date(lesson.scheduledAt);
  const dayNum = date.getDate();
  const weekday = date.toLocaleDateString(locale, { weekday: 'short' });
  const time = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  const groupName = lesson.group?.name ?? '—';
  const studentCount = lesson.group?._count?.students ?? lesson._count?.attendances ?? 0;

  return (
    <div className="flex flex-col gap-3 rounded-[1.125rem] border border-[rgba(14,14,16,0.07)] bg-[#fafafa] p-4 lg:flex-row lg:items-center lg:gap-4">
      <div className="relative h-[4.625rem] w-[3.375rem] shrink-0">
        <PublicAssetImage
          src={STUDENT_DASHBOARD_ASSETS.calendarIcon}
          alt=""
          fill
          className="object-contain object-left"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2 text-center">
          <span className="text-[0.625rem] font-medium uppercase text-[#8b8b90]">{weekday}</span>
          <span className="text-lg font-bold leading-none text-[#1010a3]">{dayNum}</span>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold tracking-tight text-[#1010a3]">
          {lesson.topic?.trim() || t('untitledLesson')}
        </p>
        <p className="mt-1 text-xs text-[#8b8b90]">
          {groupName} · {time} · {lesson.duration} min · {studentCount} {t('students')}
        </p>
        <div className="mt-2">
          <StudentBadge variant={lessonStatusVariant(lesson.status)}>
            {statusLabel(lesson.status)}
          </StudentBadge>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {lesson.status === 'SCHEDULED' ? (
          <StudentPrimaryButton
            type="button"
            className="min-h-10 pl-4 pr-1 text-xs"
            onClick={() => onStartLesson(lesson.id)}
            disabled={isStartPending}
          >
            {t('startLesson')}
            <span className="flex h-[1.8125rem] w-[1.8125rem] items-center justify-center rounded-[1.25rem] bg-white/20">
              <PublicAssetImage src={STUDENT_DASHBOARD_ASSETS.arrowDetails} alt="" width={14} height={14} />
            </span>
          </StudentPrimaryButton>
        ) : null}
        {lesson.status === 'IN_PROGRESS' ? (
          <StudentPrimaryButton
            type="button"
            className="min-h-10 bg-[#0a7a3e] pl-4 pr-1 text-xs hover:opacity-90"
            onClick={() => onCompleteLesson(lesson.id)}
            disabled={isCompletePending}
          >
            {t('completeLesson')}
            <span className="flex h-[1.8125rem] w-[1.8125rem] items-center justify-center rounded-[1.25rem] bg-white/20">
              <PublicAssetImage src={STUDENT_DASHBOARD_ASSETS.arrowDetails} alt="" width={14} height={14} />
            </span>
          </StudentPrimaryButton>
        ) : null}
        {lesson.status === 'COMPLETED' ? (
          <StudentGhostButton type="button" className="min-h-10 text-xs">
            {t('viewLesson')}
          </StudentGhostButton>
        ) : null}
      </div>
    </div>
  );
}

export function TeacherTodayLessonsCard({
  lessons,
  isLoading,
  onStartLesson,
  onCompleteLesson,
  isStartPending,
  isCompletePending,
}: TeacherTodayLessonsCardProps) {
  const t = useTranslations('dashboard.teacherLessons');
  const locale = useLocale();

  const sorted = [...lessons].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );

  return (
    <section className="rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-[#1010a3]">{t('title')}</h3>
          <p className="mt-1 text-xs text-[#8b8b90]">{t('subtitle', { count: sorted.length })}</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[5.375rem] animate-pulse rounded-[1.125rem] bg-[#f6f6f7]" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#8b8b90]">{t('empty')}</p>
        ) : (
          sorted.map((lesson) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              locale={locale}
              t={t}
              onStartLesson={onStartLesson}
              onCompleteLesson={onCompleteLesson}
              isStartPending={isStartPending}
              isCompletePending={isCompletePending}
            />
          ))
        )}
      </div>
    </section>
  );
}
