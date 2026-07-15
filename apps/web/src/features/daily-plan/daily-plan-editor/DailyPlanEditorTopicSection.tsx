'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { ADMIN_FORM_INPUT_CLASS } from '@/shared/lib/admin-control-theme';
import type { DailyPlanResourceKind } from '../types';
import { DailyPlanAutoResizeTextarea } from './DailyPlanAutoResizeTextarea';
import { DAILY_PLAN_DESCRIPTION_ONLY_KINDS } from './daily-plan-editor.constants';
import type { DraftTopic } from './daily-plan-editor.types';

interface DailyPlanEditorTopicSectionProps {
  topic: DraftTopic;
  topicIndex: number;
  mode: 'create' | 'edit';
  planId?: string;
  readOnly: boolean;
  canRemove: boolean;
  kindLabel: Record<DailyPlanResourceKind, string>;
  onTopicChange: (index: number, patch: Partial<DraftTopic>) => void;
  onResourceChange: (
    topicIndex: number,
    kind: DailyPlanResourceKind,
    patch: Partial<DraftTopic['resources'][number]>,
  ) => void;
  onRemoveTopic: (index: number) => void;
}

export function DailyPlanEditorTopicSection({
  topic,
  topicIndex,
  mode,
  planId,
  readOnly,
  canRemove,
  kindLabel,
  onTopicChange,
  onResourceChange,
  onRemoveTopic,
}: DailyPlanEditorTopicSectionProps) {
  const t = useTranslations('dailyPlanPage');
  const tCommon = useTranslations('common');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <input
          type="text"
          value={topic.title}
          onChange={(e) => onTopicChange(topicIndex, { title: e.target.value })}
          disabled={readOnly}
          placeholder={t('topicTitlePlaceholder', { number: topicIndex + 1 })}
          className={cn(ADMIN_FORM_INPUT_CLASS, 'flex-1')}
        />
        {!readOnly && canRemove && (
          <button
            type="button"
            onClick={() => onRemoveTopic(topicIndex)}
            className="text-xs text-red-600 hover:underline"
          >
            Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {topic.resources.map((resource) => {
          const isDescriptionOnly = DAILY_PLAN_DESCRIPTION_ONLY_KINDS.has(resource.kind);
          return (
            <div key={resource.kind} className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#1010a3]">
                {kindLabel[resource.kind]}
              </div>
              {!isDescriptionOnly && (
                <>
                  <input
                    type="text"
                    value={resource.title}
                    onChange={(e) =>
                      onResourceChange(topicIndex, resource.kind, { title: e.target.value })
                    }
                    disabled={readOnly}
                    placeholder={tCommon('title')}
                    className={ADMIN_FORM_INPUT_CLASS}
                  />
                  <input
                    type="url"
                    value={resource.link}
                    onChange={(e) =>
                      onResourceChange(topicIndex, resource.kind, { link: e.target.value })
                    }
                    disabled={readOnly}
                    placeholder={t('linkOptionalPlaceholder')}
                    className={ADMIN_FORM_INPUT_CLASS}
                  />
                </>
              )}
              <DailyPlanAutoResizeTextarea
                value={resource.description}
                onChange={(description) =>
                  onResourceChange(topicIndex, resource.kind, { description })
                }
                disabled={readOnly}
                placeholder={
                  isDescriptionOnly ? t('descriptionPlaceholder') : t('descriptionOptional')
                }
                resizeStorageKey={`${mode}-${planId ?? 'draft'}-${topicIndex}-${resource.kind}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
