'use client';

import type { ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Feedback } from '@/features/feedback';
import { StudentBadge, StudentCard } from '@/features/student-ui';
import {
  resolveProgressAreaLabel,
  resolveProgressTopicLabel,
  structuredFromSavedFeedback,
} from '@/shared/components/daily-duties/lesson-feedback-form-utils';
import { cn } from '@/shared/lib/utils';
import {
  buildTargetChipLabels,
  participationKeyFromLabel,
  splitProgressTopic,
} from './student-feedback-view.utils';

interface StudentFeedbackViewCardProps {
  feedback: Feedback;
  teacherName: string;
}

export function StudentFeedbackViewCard({
  feedback,
  teacherName,
}: StudentFeedbackViewCardProps) {
  const t = useTranslations('students.feedbackView');
  const locale = useLocale();
  const structured = structuredFromSavedFeedback(feedback);

  const looksStructured =
    Boolean(feedback.level) ||
    (feedback.grammarTopics?.length ?? 0) > 0 ||
    (feedback.skills?.length ?? 0) > 0 ||
    Boolean(feedback.skillsNote?.trim()) ||
    Boolean(feedback.progress?.trim()) ||
    Boolean(feedback.encouragement?.trim()) ||
    Boolean(feedback.content?.includes('Level: ')) ||
    Boolean(feedback.content?.includes('ProgressArea: '));

  const hasExplicitLevel =
    Boolean(feedback.level?.trim()) ||
    Boolean(feedback.content?.match(/^Level:\s*\S+/m));
  const targetChips = buildTargetChipLabels({
    level: hasExplicitLevel ? structured.level : '',
    grammar: structured.grammar,
    speaking: structured.speaking,
    writing: structured.writing,
    speakingLabel: t('skillSpeaking'),
    writingLabel: t('skillWriting'),
  });
  const academicComment = structured.comment.trim();
  const showTargetCard = targetChips.length > 0 || Boolean(academicComment);

  const participationKey = participationKeyFromLabel(structured.participation);
  const showParticipationCard = Boolean(participationKey);

  const progressAreaLabel = resolveProgressAreaLabel(
    structured.progressArea,
    structured.progressAreaCustom,
  );
  const progressTopicLabel = resolveProgressTopicLabel(
    structured.progressTopic,
    structured.progressTopicCustom,
  );
  const legacyProgress = splitProgressTopic(structured.progress);
  const progressBadges = [
    progressAreaLabel,
    progressTopicLabel || (!progressAreaLabel ? legacyProgress.topic : null),
  ].filter((value): value is string => Boolean(value?.trim()));
  const progressBody = progressAreaLabel || progressTopicLabel
    ? structured.progress.trim() || legacyProgress.body
    : legacyProgress.body;
  const showProgressCard = progressBadges.length > 0 || Boolean(progressBody.trim());

  const personalNote = structured.encouragement.trim();
  const showPersonalNote = Boolean(personalNote);

  const hasNarrativeCards =
    showTargetCard || showParticipationCard || showProgressCard || showPersonalNote;

  const dateLabel = formatLessonDate(feedback.lesson?.scheduledAt, locale);
  const headerLevel =
    (hasExplicitLevel ? structured.level : '') ||
    feedback.lesson?.group?.level ||
    '';
  const groupName = feedback.lesson?.group?.name?.trim() || '';
  const headerParts = [dateLabel, teacherName, headerLevel, groupName].filter(Boolean);

  return (
    <StudentCard className="transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(14,14,16,0.08)]">
      {headerParts.length > 0 ? (
        <p className="mb-4 text-sm leading-relaxed text-[#8b8b90]">
          {headerParts.join(' · ')}
        </p>
      ) : null}

      {!looksStructured || !hasNarrativeCards ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#3b3b40]">
          {feedback.content?.trim() || '—'}
        </p>
      ) : (
        <div className="space-y-3">
          {showTargetCard ? (
            <NarrativeCard
              tone="target"
              emoji="🎯"
              title={t('yourNextTarget')}
              className="p-4 sm:p-5"
            >
              {targetChips.length > 0 ? (
                <p className="text-base font-semibold tracking-tight text-[#1010a3] sm:text-lg">
                  {targetChips.join('   ·   ')}
                </p>
              ) : null}
              {academicComment ? (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#3b3b40] sm:text-[0.9375rem]">
                  {academicComment}
                </p>
              ) : null}
            </NarrativeCard>
          ) : null}

          {showParticipationCard || showProgressCard ? (
            <div
              className={cn(
                'grid grid-cols-1 gap-3',
                showParticipationCard && showProgressCard && 'sm:grid-cols-2',
              )}
            >
              {showParticipationCard && participationKey ? (
                <NarrativeCard tone="participation" emoji="👏" title={t('todayInClass')}>
                  <StudentBadge variant="brand" className="w-fit">
                    {structured.participation}
                  </StudentBadge>
                  <p className="mt-3 text-sm leading-relaxed text-[#3b3b40]">
                    {t(`participationCopy.${participationKey}`)}
                  </p>
                </NarrativeCard>
              ) : null}

              {showProgressCard ? (
                <NarrativeCard tone="progress" emoji="📈" title={t('yourProgress')}>
                  {progressBadges.length > 0 ? (
                    <div className="flex min-w-0 flex-wrap gap-1.5">
                      {progressBadges.map((badge) => (
                        <StudentBadge key={badge} variant="info" className="w-fit max-w-full">
                          {badge}
                        </StudentBadge>
                      ))}
                    </div>
                  ) : null}
                  {progressBody.trim() ? (
                    <p
                      className={cn(
                        'whitespace-pre-wrap text-sm leading-relaxed text-[#3b3b40]',
                        progressBadges.length > 0 && 'mt-3',
                      )}
                    >
                      {progressBody}
                    </p>
                  ) : null}
                </NarrativeCard>
              ) : null}
            </div>
          ) : null}

          {showPersonalNote ? (
            <NarrativeCard tone="note" emoji="💙" title={t('aLittleNoteForYou')}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#3b3b40] sm:text-[0.9375rem]">
                {personalNote}
              </p>
            </NarrativeCard>
          ) : null}
        </div>
      )}
    </StudentCard>
  );
}

type NarrativeTone = 'target' | 'participation' | 'progress' | 'note';

const toneSurface: Record<NarrativeTone, string> = {
  target: 'border-[#d9d9f4]/90 bg-gradient-to-br from-[#f5f5ff] to-white',
  participation: 'border-[rgba(14,14,16,0.07)] bg-[#fafafa]/90',
  progress: 'border-[rgba(14,14,16,0.07)] bg-[#fafafa]/90',
  note: 'border-[#ddecff] bg-gradient-to-br from-[#f3f8ff] to-white',
};

function NarrativeCard({
  tone,
  emoji,
  title,
  children,
  className,
}: {
  tone: NarrativeTone;
  emoji: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-[1.125rem] border p-3.5 sm:p-4',
        toneSurface[tone],
        className,
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="text-base leading-none" aria-hidden>
          {emoji}
        </span>
        <h3 className="text-sm font-semibold tracking-tight text-[#1010a3]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function formatLessonDate(scheduledAt: string | undefined, locale: string): string {
  if (!scheduledAt) return '';
  const date = new Date(scheduledAt);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}
