'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { MessageSquareText, MessagesSquare } from 'lucide-react';
import type { Lesson } from '@/features/lessons';
import { buildDailyDutiesLessonDetailHref } from '@/features/daily-duties/components/daily-duties-url.util';
import { TEACHER_DAILY_DUTIES_BASE_PATH } from '@/shared/lib/role-routes';
import { StudentCard } from '@/features/student-ui';
import { cn } from '@/shared/lib/utils';

type TeacherDutyActionCardsProps = {
  lessons: Lesson[];
  className?: string;
};

function pickFeedbackTarget(lessons: Lesson[]): Lesson | undefined {
  const actionable = lessons.filter(
    (l) => l.status === 'COMPLETED' || l.status === 'IN_PROGRESS',
  );
  return actionable.find((l) => !l.feedbacksCompleted) ?? actionable[0];
}

function pickVocabularyTarget(lessons: Lesson[]): Lesson | undefined {
  const completed = lessons.filter((l) => l.status === 'COMPLETED');
  return completed.find((l) => !l.vocabularySent) ?? completed[0];
}

function DutyActionCard({
  href,
  title,
  body,
  cta,
  statusLabel,
  icon,
  iconWrapClassName,
  iconClassName,
}: {
  href: string;
  title: string;
  body: string;
  cta: string;
  statusLabel: string;
  icon: ReactNode;
  iconWrapClassName: string;
  iconClassName: string;
}) {
  return (
    <StudentCard className="h-full transition-shadow hover:shadow-[0_16px_36px_-28px_rgba(16,16,163,0.55)]">
      <Link href={href} className="group flex h-full flex-col gap-4 outline-none">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-[0.875rem]',
              iconWrapClassName,
            )}
          >
            <span className={iconClassName}>{icon}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-[#1010a3]">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#8b8b90]">{body}</p>
            <p className="mt-3 text-xs font-medium text-[#1010a3]/80">{statusLabel}</p>
          </div>
        </div>
        <span className="mt-auto inline-flex h-10 w-full items-center justify-center rounded-full border border-[#1010a3]/20 bg-white px-4 text-sm font-semibold text-[#1010a3] transition-colors group-hover:bg-[#ececff] sm:w-auto sm:self-start">
          {cta}
        </span>
      </Link>
    </StudentCard>
  );
}

export function TeacherDutyActionCards({ lessons, className }: TeacherDutyActionCardsProps) {
  const t = useTranslations('dashboard.teacherTips');
  const locale = useLocale();

  const feedbackPending = lessons.filter(
    (l) =>
      (l.status === 'COMPLETED' || l.status === 'IN_PROGRESS') && !l.feedbacksCompleted,
  ).length;
  const vocabularyPending = lessons.filter(
    (l) => l.status === 'COMPLETED' && !l.vocabularySent,
  ).length;

  const feedbackLesson = pickFeedbackTarget(lessons);
  const vocabularyLesson = pickVocabularyTarget(lessons);

  const dutiesHome = `/${locale}${TEACHER_DAILY_DUTIES_BASE_PATH}`;
  const feedbackHref = feedbackLesson
    ? buildDailyDutiesLessonDetailHref({
        locale,
        portalBasePath: TEACHER_DAILY_DUTIES_BASE_PATH,
        lessonId: feedbackLesson.id,
        tab: 'feedback',
      })
    : dutiesHome;
  const vocabularyHref = vocabularyLesson
    ? buildDailyDutiesLessonDetailHref({
        locale,
        portalBasePath: TEACHER_DAILY_DUTIES_BASE_PATH,
        lessonId: vocabularyLesson.id,
        tab: 'text',
      })
    : dutiesHome;

  return (
    <div className={cn('grid h-full min-h-0 grid-cols-1 gap-5 lg:grid-cols-2', className)}>
      <DutyActionCard
        href={feedbackHref}
        title={t('feedbackTitle')}
        body={t('feedbackBody')}
        cta={feedbackLesson ? t('feedbackCta') : t('openDailyDuties')}
        statusLabel={
          feedbackPending > 0
            ? t('feedbackPending', { count: feedbackPending })
            : t('feedbackCaughtUp')
        }
        iconWrapClassName="bg-[#ffeb8c]"
        iconClassName="text-[#3a2f00]"
        icon={<MessageSquareText className="h-6 w-6" strokeWidth={2} aria-hidden />}
      />
      <DutyActionCard
        href={vocabularyHref}
        title={t('vocabularyTitle')}
        body={t('vocabularyBody')}
        cta={vocabularyLesson ? t('vocabularyCta') : t('openDailyDuties')}
        statusLabel={
          vocabularyPending > 0
            ? t('vocabularyPending', { count: vocabularyPending })
            : t('vocabularyCaughtUp')
        }
        iconWrapClassName="bg-[#ddecff]"
        iconClassName="text-[#1010a3]"
        icon={<MessagesSquare className="h-6 w-6" strokeWidth={2} aria-hidden />}
      />
    </div>
  );
}
