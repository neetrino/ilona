'use client';

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
import { Button } from '@/shared/components/ui/button';
import { SegmentedControl } from '@/shared/components/ui';
import { MultiSelectChipsDropdown } from '@/shared/components/ui/multi-select-chips-dropdown';
import { GROUP_LEVEL_SEGMENT_OPTIONS } from '@/features/groups/lib/group-level-options';
import { cn } from '@/shared/lib/utils';
import {
  PARTICIPATION_OPTIONS,
  type StructuredFeedbackFields,
} from '../lesson-feedback-form-utils';
import { FeedbackCategoryLabel } from './FeedbackCategoryLabel';
import { FeedbacksTabParticipationTickBox } from './FeedbacksTabParticipationTickBox';
import { FeedbacksTabStudentAvatar } from './FeedbacksTabStudentAvatar';
import { FEEDBACK_FIELD_SHELL_CLASS, type FeedbackSaveStatus, type FeedbackStudentItem } from './feedbacks-tab.types';

interface FeedbacksTabStudentCardProps {
  student: FeedbackStudentItem;
  structured: StructuredFeedbackFields;
  hasSavedFeedback: boolean;
  isSaving: boolean;
  status: FeedbackSaveStatus | undefined;
  participationOpen: boolean;
  grammarOptions: { id: string; label: string }[];
  onUpdateStructured: (
    updater: (current: StructuredFeedbackFields) => StructuredFeedbackFields,
  ) => void;
  onToggleParticipation: () => void;
  onSave: () => void;
  hideStudentHeader?: boolean;
}

export function FeedbacksTabStudentCard({
  student,
  structured,
  hasSavedFeedback,
  isSaving,
  status,
  participationOpen,
  grammarOptions,
  onUpdateStructured,
  onToggleParticipation,
  onSave,
  hideStudentHeader = false,
}: FeedbacksTabStudentCardProps) {
  const t = useTranslations('dailyDuties.feedback');
  const tCommon = useTranslations('common');

  const displayName = `${student.user.firstName} ${student.user.lastName}`.trim();
  const initials = `${student.user.firstName[0] ?? ''}${student.user.lastName[0] ?? ''}`;
  const grammarSelected = new Set(structured.grammar);
  const showSkillsCommentArea = structured.speaking || structured.writing;

  return (
    <div
      className={cn(
        'space-y-5 rounded-[15px] border border-slate-200/90 bg-white p-5 shadow-sm sm:space-y-6 sm:p-8',
        hideStudentHeader && 'rounded-none border-0 bg-transparent p-0 shadow-none sm:p-0',
        'lg:rounded-none lg:border-0 lg:shadow-none lg:p-6',
      )}
    >
      {!hideStudentHeader && (
      <div className="flex items-center gap-4">
        <FeedbacksTabStudentAvatar
          displayName={displayName}
          initials={initials}
          avatarUrl={student.user.avatarUrl}
          size="header"
          showSavedBadge={hasSavedFeedback}
        />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold leading-tight text-slate-900 sm:text-xl">
            {student.user.firstName} {student.user.lastName}
          </p>
          {hasSavedFeedback && (
            <p className="mt-1 text-sm font-medium text-emerald-600">✓ {t('feedbackProvided')}</p>
          )}
        </div>
      </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:gap-8">
        <div className="min-w-0 space-y-2.5 rounded-[1.125rem] border border-[rgba(14,14,16,0.07)] bg-[#fafafa]/80 p-3.5 sm:p-4">
          <FeedbackCategoryLabel icon={Layers} tone="violet">
            {t('levelLabel')}
          </FeedbackCategoryLabel>
          <SegmentedControl
            options={GROUP_LEVEL_SEGMENT_OPTIONS}
            value={structured.level}
            onChange={(nextValue) => {
              onUpdateStructured((current) => ({ ...current, level: nextValue }));
            }}
            aria-label={t('levelLabel')}
          />
        </div>

        <div className="min-w-0 space-y-3 rounded-[1.125rem] border border-[rgba(14,14,16,0.07)] bg-[#fafafa]/80 p-3.5 sm:p-4">
          <FeedbackCategoryLabel icon={WandSparkles} tone="amber">
            {t('skillsLabel')}
          </FeedbackCategoryLabel>
          <div className="flex flex-wrap gap-5 text-sm text-[#3b3b40]">
            <button
              type="button"
              className="inline-flex items-center gap-2.5 rounded-[15px] px-0.5 py-0.5 transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1010a3]/40 focus-visible:ring-offset-1"
              aria-pressed={structured.speaking}
              onClick={() => {
                onUpdateStructured((current) => {
                  const nextSpeaking = !current.speaking;
                  const bothOff = !nextSpeaking && !current.writing;
                  return {
                    ...current,
                    speaking: nextSpeaking,
                    skillsComment: bothOff ? '' : current.skillsComment,
                  };
                });
              }}
            >
              <FeedbacksTabParticipationTickBox checked={structured.speaking} />
              <span>{t('speaking')}</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2.5 rounded-[15px] px-0.5 py-0.5 transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1010a3]/40 focus-visible:ring-offset-1"
              aria-pressed={structured.writing}
              onClick={() => {
                onUpdateStructured((current) => {
                  const nextWriting = !current.writing;
                  const bothOff = !current.speaking && !nextWriting;
                  return {
                    ...current,
                    writing: nextWriting,
                    skillsComment: bothOff ? '' : current.skillsComment,
                  };
                });
              }}
            >
              <FeedbacksTabParticipationTickBox checked={structured.writing} />
              <span>{t('writing')}</span>
            </button>
          </div>
          {showSkillsCommentArea ? (
            <textarea
              rows={4}
              value={structured.skillsComment}
              onChange={(event) => {
                onUpdateStructured((current) => ({ ...current, skillsComment: event.target.value }));
              }}
              placeholder={t('skillsCommentOptional')}
              className={cn(FEEDBACK_FIELD_SHELL_CLASS, 'min-h-[100px] resize-y')}
            />
          ) : null}
        </div>
      </div>

      <div className="min-w-0 space-y-2.5 rounded-[1.125rem] border border-[rgba(14,14,16,0.07)] bg-[#fafafa]/80 p-3.5 sm:p-4">
        <FeedbackCategoryLabel icon={BookOpenText} tone="sky">
          {t('grammarLabel')}
        </FeedbackCategoryLabel>
        <MultiSelectChipsDropdown
          options={grammarOptions}
          selectedIds={grammarSelected}
          onSelectionChange={(next) => {
            onUpdateStructured((current) => ({
              ...current,
              grammar: Array.from(next),
            }));
          }}
          placeholder={t('select')}
          hideSelectedLabelsInTrigger
          searchPlaceholder={t('filterPlaceholder')}
          className={cn(
            '[&_div[role=button]]:min-h-11 [&_div[role=button]]:rounded-[15px] [&_div[role=button]]:border-2 [&_div[role=button]]:focus-within:border-[#1010a3]/45',
            grammarSelected.size > 0
              ? '[&_div[role=button]]:border-[#1010a3]/45'
              : '[&_div[role=button]]:border-slate-200',
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:gap-8">
        <div className="min-w-0 space-y-2.5 rounded-[1.125rem] border border-[rgba(14,14,16,0.07)] bg-[#fafafa]/80 p-3.5 sm:p-4">
          <FeedbackCategoryLabel icon={MessageSquareText} tone="sky">
            {t('commentLabel')}
          </FeedbackCategoryLabel>
          <textarea
            rows={4}
            value={structured.comment}
            onChange={(event) => {
              onUpdateStructured((current) => ({ ...current, comment: event.target.value }));
            }}
            placeholder={t('optionalComment')}
            className={cn(FEEDBACK_FIELD_SHELL_CLASS, 'min-h-[100px] resize-y')}
          />
        </div>

        <div className="min-w-0 space-y-3 rounded-[1.125rem] border border-[rgba(14,14,16,0.07)] bg-[#fafafa]/80 p-3.5 sm:p-4">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 rounded-[15px] border border-transparent px-0.5 py-0.5 text-left transition-colors hover:bg-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1010a3]/40 focus-visible:ring-offset-2"
            aria-expanded={participationOpen}
            aria-controls={`participation-options-${student.id}`}
            id={`participation-trigger-${student.id}`}
            onClick={onToggleParticipation}
          >
            <FeedbackCategoryLabel icon={Users} tone="lime" as="span" className="pointer-events-none">
              {t('participation')}
            </FeedbackCategoryLabel>
            <span className="flex shrink-0 items-center gap-2">
              <FeedbacksTabParticipationTickBox checked={participationOpen} />
              <svg
                className={cn(
                  'h-5 w-5 text-[#8b8b90] transition-transform',
                  participationOpen && 'rotate-180',
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
          {participationOpen ? (
            <div
              id={`participation-options-${student.id}`}
              role="group"
              aria-labelledby={`participation-trigger-${student.id}`}
              className="flex flex-wrap gap-2 pt-1"
            >
              {PARTICIPATION_OPTIONS.map((option) => {
                const selected = structured.participation === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      onUpdateStructured((current) => ({
                        ...current,
                        participation: selected ? null : option,
                      }));
                    }}
                    className={cn(
                      'rounded-[15px] border px-3.5 py-2 text-sm font-medium transition-colors',
                      selected
                        ? 'border-[#1010a3] bg-[#e8e8fc] text-[#1010a3]'
                        : 'border-[rgba(14,14,16,0.07)] bg-white text-[#3b3b40] hover:border-[rgba(14,14,16,0.12)] hover:bg-white',
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:gap-8">
        <div className="space-y-2.5 rounded-[1.125rem] border border-[rgba(14,14,16,0.07)] bg-[#fafafa]/80 p-3.5 sm:p-4">
          <FeedbackCategoryLabel icon={TrendingUp} tone="violet">
            {t('progress')}
          </FeedbackCategoryLabel>
          <textarea
            rows={4}
            value={structured.progress}
            onChange={(event) => {
              onUpdateStructured((current) => ({ ...current, progress: event.target.value }));
            }}
            className={cn(FEEDBACK_FIELD_SHELL_CLASS, 'min-h-[100px] resize-y')}
          />
        </div>
        <div className="space-y-2.5 rounded-[1.125rem] border border-[rgba(14,14,16,0.07)] bg-[#fafafa]/80 p-3.5 sm:p-4">
          <FeedbackCategoryLabel icon={Sparkles} tone="amber">
            {t('encouragement')}
          </FeedbackCategoryLabel>
          <textarea
            rows={4}
            value={structured.encouragement}
            onChange={(event) => {
              onUpdateStructured((current) => ({ ...current, encouragement: event.target.value }));
            }}
            className={cn(FEEDBACK_FIELD_SHELL_CLASS, 'min-h-[100px] resize-y')}
          />
        </div>
      </div>

      {status?.success && (
        <div className="flex items-center gap-3 rounded-[15px] border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-3 text-emerald-800">
          <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-semibold">{t('feedbackProvided')}</span>
        </div>
      )}

      {status?.error && (
        <div className="flex items-center gap-3 rounded-[15px] border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 px-4 py-3 text-red-800">
          <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="text-sm font-semibold">{status.error}</span>
        </div>
      )}

      <div className="flex justify-end pt-1">
        <Button
          type="button"
          onClick={onSave}
          disabled={isSaving || !structured.level || structured.grammar.length === 0}
          className="h-11 min-w-[140px] rounded-[15px] px-6 text-base font-semibold"
        >
          {isSaving ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {tCommon('loading')}
            </span>
          ) : hasSavedFeedback ? (
            t('editFeedback')
          ) : (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {tCommon('save')}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
