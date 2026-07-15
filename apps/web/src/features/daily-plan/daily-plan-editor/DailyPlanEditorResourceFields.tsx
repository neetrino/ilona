'use client';

import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { ADMIN_FORM_INPUT_CLASS } from '@/shared/lib/admin-control-theme';
import { DailyPlanAutoResizeTextarea } from './DailyPlanAutoResizeTextarea';
import { DAILY_PLAN_DESCRIPTION_ONLY_KINDS } from './daily-plan-editor.constants';
import type { DraftResource } from './daily-plan-editor.types';

interface DailyPlanEditorResourceFieldsProps {
  resource: DraftResource;
  topicIndex: number;
  mode: 'create' | 'edit';
  planId?: string;
  readOnly: boolean;
  canRemove: boolean;
  onChange: (resourceKey: string, patch: Partial<DraftResource>) => void;
  onRemove: (resourceKey: string) => void;
}

export function DailyPlanEditorResourceFields({
  resource,
  topicIndex,
  mode,
  planId,
  readOnly,
  canRemove,
  onChange,
  onRemove,
}: DailyPlanEditorResourceFieldsProps) {
  const t = useTranslations('dailyPlanPage');
  const tCommon = useTranslations('common');
  const isDescriptionOnly = DAILY_PLAN_DESCRIPTION_ONLY_KINDS.has(resource.kind);

  return (
    <div
      className={cn(
        'space-y-3',
        canRemove && 'rounded-[15px] border border-slate-200 bg-white p-3',
      )}
    >
      {canRemove && !readOnly && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onRemove(resource.key)}
            className="inline-flex items-center justify-center rounded-[15px] border border-red-200 bg-red-50 p-1.5 text-red-600 hover:border-red-300 hover:bg-red-100"
            aria-label={t('removeResource')}
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      )}
      {!isDescriptionOnly && (
        <>
          <input
            type="text"
            value={resource.title}
            onChange={(e) => onChange(resource.key, { title: e.target.value })}
            disabled={readOnly}
            placeholder={tCommon('title')}
            className={ADMIN_FORM_INPUT_CLASS}
          />
          <input
            type="url"
            value={resource.link}
            onChange={(e) => onChange(resource.key, { link: e.target.value })}
            disabled={readOnly}
            placeholder={t('linkOptionalPlaceholder')}
            className={ADMIN_FORM_INPUT_CLASS}
          />
        </>
      )}
      <DailyPlanAutoResizeTextarea
        value={resource.description}
        onChange={(description) => onChange(resource.key, { description })}
        disabled={readOnly}
        placeholder={isDescriptionOnly ? t('descriptionPlaceholder') : t('descriptionOptional')}
        resizeStorageKey={`${mode}-${planId ?? 'draft'}-${topicIndex}-${resource.key}`}
      />
    </div>
  );
}
