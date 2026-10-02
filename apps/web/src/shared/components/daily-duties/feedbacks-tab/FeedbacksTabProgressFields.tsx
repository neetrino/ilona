'use client';

import { TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import {
  PROGRESS_AREA_OPTIONS,
  PROGRESS_OTHER_VALUE,
  PROGRESS_TOPICS_BY_AREA,
  progressAreaHasTopicDropdown,
  type ProgressAreaOption,
  type StructuredFeedbackFields,
} from '../lesson-feedback-form-utils';
import { FeedbackCategoryLabel } from './FeedbackCategoryLabel';
import { FEEDBACK_FIELD_SHELL_CLASS } from './feedbacks-tab.types';

interface FeedbacksTabProgressFieldsProps {
  structured: StructuredFeedbackFields;
  onUpdateStructured: (
    updater: (current: StructuredFeedbackFields) => StructuredFeedbackFields,
  ) => void;
}

export function FeedbacksTabProgressFields({
  structured,
  onUpdateStructured,
}: FeedbacksTabProgressFieldsProps) {
  const t = useTranslations('dailyDuties.feedback');
  const topicOptions = structured.progressArea
    ? PROGRESS_TOPICS_BY_AREA[structured.progressArea]
    : [];
  const showTopicDropdown = progressAreaHasTopicDropdown(structured.progressArea);
  const showAreaCustom = structured.progressArea === PROGRESS_OTHER_VALUE;
  const showTopicCustom = structured.progressTopic === PROGRESS_OTHER_VALUE;

  return (
    <div className="space-y-2.5 rounded-[1.125rem] border border-[rgba(14,14,16,0.07)] bg-[#fafafa]/80 p-3.5 sm:p-4">
      <FeedbackCategoryLabel icon={TrendingUp} tone="violet">
        {t('progress')}
      </FeedbackCategoryLabel>

      <div className="space-y-2.5">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <label className="block min-w-0 space-y-1.5">
            <span className="text-xs font-medium tracking-wide text-[#8b8b90]">
              {t('progressAreaLabel')}
            </span>
            <select
              value={structured.progressArea}
              onChange={(event) => {
                const nextArea = event.target.value as ProgressAreaOption | '';
                onUpdateStructured((current) => ({
                  ...current,
                  progressArea: nextArea,
                  progressTopic: '',
                  progressAreaCustom:
                    nextArea === PROGRESS_OTHER_VALUE ? current.progressAreaCustom : '',
                  progressTopicCustom: '',
                }));
              }}
              className={cn(FEEDBACK_FIELD_SHELL_CLASS, 'h-11 appearance-none bg-white')}
              aria-label={t('progressAreaLabel')}
            >
              <option value="">{t('select')}</option>
              {PROGRESS_AREA_OPTIONS.map((area) => (
                <option key={area} value={area}>
                  {area === PROGRESS_OTHER_VALUE ? t('progressOther') : area}
                </option>
              ))}
            </select>
          </label>

          {showTopicDropdown ? (
            <label className="block min-w-0 space-y-1.5">
              <span className="text-xs font-medium tracking-wide text-[#8b8b90]">
                {t('progressTopicLabel')}
              </span>
              <select
                value={structured.progressTopic}
                onChange={(event) => {
                  const nextTopic = event.target.value;
                  onUpdateStructured((current) => ({
                    ...current,
                    progressTopic: nextTopic,
                    progressTopicCustom:
                      nextTopic === PROGRESS_OTHER_VALUE ? current.progressTopicCustom : '',
                  }));
                }}
                className={cn(FEEDBACK_FIELD_SHELL_CLASS, 'h-11 appearance-none bg-white')}
                aria-label={t('progressTopicLabel')}
              >
                <option value="">{t('select')}</option>
                {topicOptions.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic === PROGRESS_OTHER_VALUE ? t('progressOther') : topic}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>

        {showAreaCustom ? (
          <input
            type="text"
            value={structured.progressAreaCustom}
            onChange={(event) => {
              onUpdateStructured((current) => ({
                ...current,
                progressAreaCustom: event.target.value,
              }));
            }}
            placeholder={t('progressAreaCustomPlaceholder')}
            className={FEEDBACK_FIELD_SHELL_CLASS}
          />
        ) : null}

        {showTopicCustom ? (
          <input
            type="text"
            value={structured.progressTopicCustom}
            onChange={(event) => {
              onUpdateStructured((current) => ({
                ...current,
                progressTopicCustom: event.target.value,
              }));
            }}
            placeholder={t('progressTopicCustomPlaceholder')}
            className={FEEDBACK_FIELD_SHELL_CLASS}
          />
        ) : null}

        <textarea
          rows={4}
          value={structured.progress}
          onChange={(event) => {
            onUpdateStructured((current) => ({ ...current, progress: event.target.value }));
          }}
          placeholder={t('progressCommentOptional')}
          className={cn(FEEDBACK_FIELD_SHELL_CLASS, 'min-h-[100px] resize-y')}
        />
      </div>
    </div>
  );
}
