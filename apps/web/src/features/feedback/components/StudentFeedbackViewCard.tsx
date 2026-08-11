'use client';

import type { ReactNode } from 'react';
import {
  BookOpenText,
  Layers,
  MessageSquareText,
  Sparkles,
  TrendingUp,
  Users,
  WandSparkles,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Feedback } from '@/features/feedback';
import { StudentBadge, StudentCard } from '@/features/student-ui';
import { structuredFromSavedFeedback } from '@/shared/components/daily-duties/lesson-feedback-form-utils';
import { FeedbackCategoryLabel } from '@/shared/components/daily-duties/feedbacks-tab/FeedbackCategoryLabel';
import { cn } from '@/shared/lib/utils';

interface StudentFeedbackViewCardProps {
  feedback: Feedback;
  dateLabel: string;
  teacherName: string;
}

export function StudentFeedbackViewCard({
  feedback,
  dateLabel,
  teacherName,
}: StudentFeedbackViewCardProps) {
  const t = useTranslations('dailyDuties.feedback');
  const structured = structuredFromSavedFeedback(feedback);
  const looksStructured =
    Boolean(feedback.level) ||
    (feedback.grammarTopics?.length ?? 0) > 0 ||
    (feedback.skills?.length ?? 0) > 0 ||
    Boolean(feedback.skillsNote?.trim()) ||
    Boolean(feedback.progress?.trim()) ||
    Boolean(feedback.encouragement?.trim()) ||
    Boolean(feedback.content?.includes('Level: '));

  const skills = [
    structured.speaking ? t('speaking') : null,
    structured.writing ? t('writing') : null,
  ].filter((value): value is string => Boolean(value));

  const hasCategoryContent =
    looksStructured &&
    (Boolean(structured.level) ||
      structured.grammar.length > 0 ||
      skills.length > 0 ||
      Boolean(structured.skillsComment.trim()) ||
      Boolean(structured.comment.trim()) ||
      Boolean(structured.participation) ||
      Boolean(structured.progress.trim()) ||
      Boolean(structured.encouragement.trim()));

  return (
    <StudentCard className="transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(14,14,16,0.08)]">
      <div className="mb-4 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
        <StudentBadge
          variant="brand"
          className="w-fit px-3 py-1 text-[0.8125rem] sm:px-2.5 sm:py-0.5 sm:text-[0.6875rem]"
        >
          {dateLabel}
        </StudentBadge>
        <div className="flex flex-wrap items-center gap-2">
          <span className="min-w-0 break-words text-base font-medium text-[#1010a3] sm:text-sm">
            {teacherName}
          </span>
          {feedback.lesson?.group?.name ? (
            <span className="min-w-0 break-words text-xs text-[#8b8b90]">
              {feedback.lesson.group.name}
            </span>
          ) : null}
        </div>
      </div>

      {!hasCategoryContent ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#3b3b40]">
          {feedback.content || '—'}
        </p>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {structured.level ? (
              <CategoryBlock>
                <FeedbackCategoryLabel icon={Layers} tone="violet" as="span">
                  {t('levelLabel').replace(/\s*\*$/, '')}
                </FeedbackCategoryLabel>
                <StudentBadge variant="info" className="mt-2.5">
                  {structured.level}
                </StudentBadge>
              </CategoryBlock>
            ) : null}

            {structured.grammar.length > 0 ? (
              <CategoryBlock>
                <FeedbackCategoryLabel icon={BookOpenText} tone="sky" as="span">
                  {t('grammarLabel').replace(/\s*\*.*$/, '')}
                </FeedbackCategoryLabel>
                <div className="mt-2.5 flex min-w-0 flex-wrap gap-1.5">
                  {structured.grammar.map((topic) => (
                    <StudentBadge key={topic} variant="neutral" className="max-w-full break-words">
                      {topic}
                    </StudentBadge>
                  ))}
                </div>
              </CategoryBlock>
            ) : null}

            {skills.length > 0 || structured.skillsComment.trim() ? (
              <CategoryBlock>
                <FeedbackCategoryLabel icon={WandSparkles} tone="amber" as="span">
                  {t('skillsLabel')}
                </FeedbackCategoryLabel>
                {skills.length > 0 ? (
                  <div className="mt-2.5 flex min-w-0 flex-wrap gap-1.5">
                    {skills.map((skill) => (
                      <StudentBadge key={skill} variant="brand" className="max-w-full break-words">
                        {skill}
                      </StudentBadge>
                    ))}
                  </div>
                ) : null}
                {structured.skillsComment.trim() ? (
                  <p className="mt-2.5 break-words text-sm leading-relaxed text-[#3b3b40]">
                    {structured.skillsComment}
                  </p>
                ) : null}
              </CategoryBlock>
            ) : null}

            {structured.participation ? (
              <CategoryBlock>
                <FeedbackCategoryLabel icon={Users} tone="lime" as="span">
                  {t('participation')}
                </FeedbackCategoryLabel>
                <p className="mt-2.5 break-words text-sm font-medium text-[#1010a3]">
                  {structured.participation}
                </p>
              </CategoryBlock>
            ) : null}
          </div>

          {structured.comment.trim() ||
          structured.progress.trim() ||
          structured.encouragement.trim() ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
              {structured.comment.trim() ? (
                <CategoryBlock>
                  <FeedbackCategoryLabel icon={MessageSquareText} tone="sky" as="span">
                    {t('commentLabel')}
                  </FeedbackCategoryLabel>
                  <p className="mt-2.5 break-words whitespace-pre-wrap text-sm leading-relaxed text-[#3b3b40]">
                    {structured.comment}
                  </p>
                </CategoryBlock>
              ) : null}

              {structured.progress.trim() ? (
                <CategoryBlock>
                  <FeedbackCategoryLabel icon={TrendingUp} tone="violet" as="span">
                    {t('progress')}
                  </FeedbackCategoryLabel>
                  <p className="mt-2.5 break-words whitespace-pre-wrap text-sm leading-relaxed text-[#3b3b40]">
                    {structured.progress}
                  </p>
                </CategoryBlock>
              ) : null}

              {structured.encouragement.trim() ? (
                <CategoryBlock>
                  <FeedbackCategoryLabel icon={Sparkles} tone="amber" as="span">
                    {t('encouragement')}
                  </FeedbackCategoryLabel>
                  <p className="mt-2.5 break-words whitespace-pre-wrap text-sm leading-relaxed text-[#3b3b40]">
                    {structured.encouragement}
                  </p>
                </CategoryBlock>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </StudentCard>
  );
}

function CategoryBlock({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'min-w-0 overflow-hidden rounded-[1.125rem] border border-[rgba(14,14,16,0.07)] bg-[#fafafa]/80 p-2.5 sm:p-4',
        className,
      )}
    >
      {children}
    </div>
  );
}
