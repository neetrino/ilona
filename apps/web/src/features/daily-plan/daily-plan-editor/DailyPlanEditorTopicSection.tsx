'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { ADMIN_FORM_INPUT_CLASS } from '@/shared/lib/admin-control-theme';
import type { DailyPlanResourceKind } from '../types';
import { DailyPlanEditorResourceFields } from './DailyPlanEditorResourceFields';
import { DAILY_PLAN_RESOURCE_KINDS } from './daily-plan-editor.constants';
import type { DraftResource, DraftTopic } from './daily-plan-editor.types';

interface DailyPlanEditorTopicSectionProps {
  topic: DraftTopic;
  topicIndex: number;
  mode: 'create' | 'edit';
  planId?: string;
  readOnly: boolean;
  kindLabel: Record<DailyPlanResourceKind, string>;
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
  onTopicChange,
  onResourceChange,
  onAddResource,
  onRemoveResource,
}: DailyPlanEditorTopicSectionProps) {
  const t = useTranslations('dailyPlanPage');

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={topic.title}
        onChange={(e) => onTopicChange(topicIndex, { title: e.target.value })}
        disabled={readOnly}
        placeholder={t('topicTitlePlaceholder', { number: topicIndex + 1 })}
        className={cn(ADMIN_FORM_INPUT_CLASS, 'w-full')}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {DAILY_PLAN_RESOURCE_KINDS.map((kind) => {
          const resources = topic.resources.filter((resource) => resource.kind === kind);
          return (
            <div key={kind} className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#1010a3]">
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
                  className="inline-flex w-full items-center justify-center gap-1 rounded-[15px] border border-dashed border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:border-slate-400 hover:bg-slate-50"
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
