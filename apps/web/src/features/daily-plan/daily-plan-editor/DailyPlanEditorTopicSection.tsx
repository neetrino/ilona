'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { ADMIN_FORM_INPUT_CLASS } from '@/shared/lib/admin-control-theme';
import type { DailyPlanResourceKind } from '../types';
import { DailyPlanEditorResourceFields } from './DailyPlanEditorResourceFields';
import {
  DAILY_PLAN_KIND_ADD_BUTTON_CLASS,
  DAILY_PLAN_KIND_SURFACE_CLASS,
  DAILY_PLAN_KIND_TITLE_CLASS,
  DAILY_PLAN_RESOURCE_KINDS,
} from './daily-plan-editor.constants';
import type { DraftResource, DraftTopic } from './daily-plan-editor.types';

interface DailyPlanEditorTopicSectionProps {
  topic: DraftTopic;
  topicIndex: number;
  mode: 'create' | 'edit';
  planId?: string;
  readOnly: boolean;
  kindLabel: Record<DailyPlanResourceKind, string>;
  hideTitle?: boolean;
  onTopicChange: (index: number, patch: Partial<DraftTopic>) => void;
  onResourceChange: (
    topicIndex: number,
    resourceKey: string,
    patch: Partial<DraftResource>,
  ) => void;
  onAddResource: (topicIndex: number, kind: DailyPlanResourceKind) => void;
  onRemoveResource: (topicIndex: number, resourceKey: string) => void;
}

export function DailyPlanEditorTopicSection({
  topic,
  topicIndex,
  mode,
  planId,
  readOnly,
  kindLabel,
  hideTitle = false,
  onTopicChange,
  onResourceChange,
  onAddResource,
  onRemoveResource,
}: DailyPlanEditorTopicSectionProps) {
  const t = useTranslations('dailyPlanPage');

  return (
    <div className="space-y-4">
      {!hideTitle ? (
        <input
          type="text"
          value={topic.title}
          onChange={(e) => onTopicChange(topicIndex, { title: e.target.value })}
          disabled={readOnly}
          placeholder={t('topicTitlePlaceholder', { number: topicIndex + 1 })}
          className={cn(ADMIN_FORM_INPUT_CLASS, 'w-full')}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {DAILY_PLAN_RESOURCE_KINDS.map((kind) => {
          const resources = topic.resources.filter((resource) => resource.kind === kind);
          return (
            <div
              key={kind}
              className={cn(
                'space-y-3 rounded-[15px] border p-4',
                DAILY_PLAN_KIND_SURFACE_CLASS[kind],
              )}
            >
              <div
                className={cn(
                  'text-xs font-semibold uppercase tracking-wide',
                  DAILY_PLAN_KIND_TITLE_CLASS[kind],
                )}
              >
                {kindLabel[kind]}
              </div>
              {resources.map((resource) => (
                <DailyPlanEditorResourceFields
                  key={resource.key}
                  resource={resource}
                  topicIndex={topicIndex}
                  mode={mode}
                  planId={planId}
                  readOnly={readOnly}
                  canRemove={resources.length > 1}
                  onChange={(resourceKey, patch) =>
                    onResourceChange(topicIndex, resourceKey, patch)
                  }
                  onRemove={(resourceKey) => onRemoveResource(topicIndex, resourceKey)}
                />
              ))}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => onAddResource(topicIndex, kind)}
                  className={cn(
                    'inline-flex w-full items-center justify-center gap-1 rounded-[15px] border border-dashed bg-white/80 px-3 py-2 text-xs font-medium',
                    DAILY_PLAN_KIND_ADD_BUTTON_CLASS[kind],
                  )}
                >
                  <Plus className="size-3.5" />
                  {t('addResource', { kind: kindLabel[kind] })}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
