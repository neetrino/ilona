'use client';

import { useTranslations } from 'next-intl';
import { DatePickerInput } from '@/shared/components/ui/date-picker-input';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import { cn } from '@/shared/lib/utils';
import {
  ADMIN_DATE_INPUT_CLASS,
  ADMIN_FORM_INPUT_CLASS,
  ADMIN_OUTLINE_BUTTON_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
} from '@/shared/lib/admin-control-theme';
import { DailyPlanEditorTopicSection } from './DailyPlanEditorTopicSection';
import type { useDailyPlanEditor } from './useDailyPlanEditor';

type DailyPlanEditorViewModel = ReturnType<typeof useDailyPlanEditor>;

interface DailyPlanEditorFormBodyProps {
  vm: DailyPlanEditorViewModel;
}

export function DailyPlanEditorFormBody({ vm }: DailyPlanEditorFormBodyProps) {
  const t = useTranslations('dailyPlanPage');
  const tCommon = useTranslations('common');
  const tCalendar = useTranslations('dailyDuties');

  return (
    <div
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
    >
      <div className="flex flex-col gap-6 p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="dp-date" className="mb-1.5 block text-sm font-medium text-[#1010a3]">
              {tCommon('date')}
            </label>
            <DatePickerInput
              id="dp-date"
              value={vm.date}
              onValueChange={vm.setDate}
              disabled={vm.readOnly}
              className={ADMIN_DATE_INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="dp-group" className="mb-1.5 block text-sm font-medium text-[#1010a3]">
              {tCommon('group')}
            </label>
            {vm.isGroupLocked ? (
              <div
                id="dp-group"
                className={cn(
                  ADMIN_FORM_INPUT_CLASS,
                  'flex items-center bg-slate-50 text-slate-700',
                )}
              >
                {vm.selectedGroupName}
              </div>
            ) : (
              <SingleSelectDropdown
                id="dp-group"
                triggerClassName={ADMIN_FORM_INPUT_CLASS}
                options={vm.myGroups.map((group) => ({ id: group.id, label: group.name }))}
                value={vm.groupId || null}
                onValueChange={(next) => vm.setGroupId(next ?? '')}
                placeholder={tCalendar('selectGroup')}
                disabled={vm.isLoadingGroups || vm.readOnly}
                isLoading={vm.isLoadingGroups}
              />
            )}
          </div>
        </div>

        {vm.error && (
          <div className="rounded-[15px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {vm.error}
          </div>
        )}

        <div className="space-y-6">
          {vm.topics.map((topic, idx) => (
            <DailyPlanEditorTopicSection
              key={idx}
              topic={topic}
              topicIndex={idx}
              mode={vm.mode}
              planId={vm.plan?.id}
              readOnly={vm.readOnly}
              canRemove={vm.topics.length > 1}
              kindLabel={vm.kindLabel}
              onTopicChange={vm.updateTopic}
              onResourceChange={vm.updateResource}
              onRemoveTopic={vm.removeTopic}
            />
          ))}
        </div>

        {!vm.readOnly && (
          <button
            type="button"
            onClick={vm.addTopic}
            className={cn(
              ADMIN_OUTLINE_BUTTON_CLASS,
              'w-full shrink-0 border-2 border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 active:scale-100',
            )}
          >
            {t('addAnotherTopic')}
          </button>
        )}

        <div className="flex shrink-0 justify-end gap-2 pt-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] min-[1367px]:pb-4">
          <button
            type="button"
            onClick={vm.onClose}
            className={cn(
              ADMIN_OUTLINE_BUTTON_CLASS,
              'text-slate-700 hover:bg-slate-50 disabled:opacity-60',
            )}
          >
            {tCommon('cancel')}
          </button>
          {!vm.readOnly && (
            <button
              type="button"
              onClick={vm.handleSave}
              disabled={vm.isSaving}
              className={cn(
                ADMIN_PRIMARY_BUTTON_CLASS,
                'bg-primary text-white hover:bg-primary/90 disabled:opacity-60',
              )}
            >
              {vm.isSaving ? tCommon('saving') : tCommon('save')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
