'use client';

import { PublicAssetImage } from '@/shared/components/ui';
import { useLocale, useTranslations } from 'next-intl';
import type { Lesson } from '@/features/lessons';
import { STUDENT_DASHBOARD_ASSETS } from '@/features/student-dashboard/assets';
import { StudentBadge, StudentGhostButton, StudentPrimaryButton } from '@/features/student-ui';
import { cn } from '@/shared/lib/utils';

type TeacherTodayLessonsCardProps = {
  lessons: Lesson[];
  isLoading?: boolean;
  onStartLesson: (id: string) => void;
  onCompleteLesson: (id: string) => void;
  isStartPending?: boolean;
  isCompletePending?: boolean;
  className?: string;
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
    <article className="rounded-2xl border border-[rgba(14,14,16,0.09)] bg-white px-4 py-4 shadow-[0_1px_2px_rgba(14,14,16,0.03)]">
      <div className="flex items-start gap-3">
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
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="min-w-0 flex-1 break-words text-[1.05rem] font-semibold leading-tight tracking-tight text-[#1010a3]">
              {lesson.topic?.trim() || t('untitledLesson')}
            </p>
            <StudentBadge variant={lessonStatusVariant(lesson.status)}>
              {statusLabel(lesson.status)}
            </StudentBadge>
          </div>
          <p className="mt-1 text-sm text-[#64748b]">{groupName}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-[rgba(14,14,16,0.08)] px-3 py-2">
              <p className="text-sm font-semibold text-[#1f2937]">{time}</p>
              <p className="mt-0.5 text-xs text-[#8b8b90]">{lesson.duration} min</p>
            </div>
            <div className="rounded-xl border border-[rgba(14,14,16,0.08)] px-3 py-2">
              <p className="text-sm font-semibold text-[#1f2937]">
                {studentCount} {t('students')}
              </p>
              <p className="mt-0.5 text-xs text-[#8b8b90]">{weekday}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 border-t border-[rgba(14,14,16,0.08)] pt-3">
        <div className="flex flex-wrap items-center gap-2">
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
    </article>
  );
}

export function TeacherTodayLessonsCard({
  lessons,
  isLoading,
  onStartLesson,
  onCompleteLesson,
  isStartPending,
  isCompletePending,
  className,
}: TeacherTodayLessonsCardProps) {
  const t = useTranslations('dashboard.teacherLessons');
  const locale = useLocale();

  const sorted = [...lessons].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );

  return (
    <section
      className={cn(
        'rounded-3xl border border-[rgba(14,14,16,0.07)] bg-white p-5 sm:p-6',
        className,
      )}
    >
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
