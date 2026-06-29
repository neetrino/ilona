'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/shared/components/ui/button';
import { Avatar } from '@/shared/components/ui/avatar';
import { MultiSelectChipsDropdown } from '@/shared/components/ui/multi-select-chips-dropdown';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import { cn } from '@/shared/lib/utils';
import {
  LEVEL_OPTIONS,
  PARTICIPATION_OPTIONS,
  type StructuredFeedbackFields,
} from '../lesson-feedback-form-utils';
import { FeedbacksTabParticipationTickBox } from './FeedbacksTabParticipationTickBox';
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
}: FeedbacksTabStudentCardProps) {
  const t = useTranslations('calendar.feedback');
  const tCommon = useTranslations('common');

  const displayName = `${student.user.firstName} ${student.user.lastName}`.trim();
  const initials = `${student.user.firstName[0] ?? ''}${student.user.lastName[0] ?? ''}`;
  const grammarSelected = new Set(structured.grammar);
  const showSkillsCommentArea = structured.speaking || structured.writing;

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:space-y-6 sm:p-8">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          {student.user.avatarUrl ? (
            <Avatar
              src={student.user.avatarUrl}
              name={displayName}
              size="lg"
              className="h-14 w-14 text-lg shadow-md ring-2 ring-white"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-lg font-bold text-white shadow-md ring-2 ring-white">
              {initials}
            </div>
          )}
          {hasSavedFeedback && (
            <div className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500">
              <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold leading-tight text-slate-900 sm:text-xl">
            {student.user.firstName} {student.user.lastName}
          </p>
          {hasSavedFeedback && (
            <p className="mt-1 text-sm font-medium text-emerald-600">✓ {t('feedbackProvided')}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:gap-8">
        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-900">{t('levelLabel')}</label>
          <SingleSelectDropdown
            options={LEVEL_OPTIONS.map((level) => ({ id: level, label: level }))}
            value={structured.level || null}
            onValueChange={(next) => {
              onUpdateStructured((current) => ({ ...current, level: next ?? '' }));
            }}
            placeholder={t('select')}
          />
        </div>

        <div className="space-y-2 md:min-w-0">
          <label className="block text-sm font-bold text-slate-900">{t('grammarLabel')}</label>
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
              '[&_div[role=button]]:min-h-11 [&_div[role=button]]:rounded-xl [&_div[role=button]]:border-2 [&_div[role=button]]:focus-within:border-[#1010a3]/45',
              grammarSelected.size > 0
                ? '[&_div[role=button]]:border-[#1010a3]/45'
                : '[&_div[role=button]]:border-slate-200',
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:gap-8">
        <div className="space-y-3">
          <label className="block text-sm font-bold text-slate-900">{t('skillsLabel')}</label>
          <div className="flex flex-wrap gap-5 text-sm text-slate-800">
            <button
              type="button"
              className="inline-flex items-center gap-2.5 rounded-lg px-0.5 py-0.5 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1010a3]/40 focus-visible:ring-offset-1"
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
              className="inline-flex items-center gap-2.5 rounded-lg px-0.5 py-0.5 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1010a3]/40 focus-visible:ring-offset-1"
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
          ) : (
            <p className="text-xs text-slate-500">{t('skillsCommentExpandHint')}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-900">{t('commentLabel')}</label>
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
      </div>

      <div className="space-y-3">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-transparent px-1 py-1.5 text-left transition-colors hover:border-slate-200 hover:bg-slate-50/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1010a3]/40 focus-visible:ring-offset-2"
          aria-expanded={participationOpen}
          aria-controls={`participation-options-${student.id}`}
          id={`participation-trigger-${student.id}`}
          onClick={onToggleParticipation}
        >
          <span className="flex items-center gap-2">
            <FeedbacksTabParticipationTickBox checked={participationOpen} />
            <span className="text-sm font-bold text-slate-900">{t('participation')}</span>
          </span>
          <svg
            className={cn(
              'h-5 w-5 shrink-0 text-slate-500 transition-transform',
              participationOpen && 'rotate-180',
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
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
                    'rounded-full border px-3.5 py-2 text-sm font-medium transition-colors',
                    selected
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:gap-8">
        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-900">{t('progress')}</label>
          <textarea
            rows={4}
            value={structured.progress}
            onChange={(event) => {
              onUpdateStructured((current) => ({ ...current, progress: event.target.value }));
            }}
            className={cn(FEEDBACK_FIELD_SHELL_CLASS, 'min-h-[100px] resize-y')}
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-900">{t('encouragement')}</label>
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
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-3 text-emerald-800">
          <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-semibold">{t('feedbackProvided')}</span>
        </div>
      )}

      {status?.error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 px-4 py-3 text-red-800">
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
          className="h-11 min-w-[140px] rounded-xl px-6 text-base font-semibold"
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
