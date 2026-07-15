'use client';

import { useTranslations } from 'next-intl';
import { DatePickerInput } from '@/shared/components/ui/date-picker-input';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import { cn } from '@/shared/lib/utils';
import {
  ADMIN_DATE_INPUT_CLASS,
  ADMIN_FORM_INPUT_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
} from '@/shared/lib/admin-control-theme';
import { DailyPlanEditorTopicSection } from './DailyPlanEditorTopicSection';
import type { useDailyPlanEditor } from './useDailyPlanEditor';

type DailyPlanEditorViewModel = ReturnType<typeof useDailyPlanEditor>;

interface DailyPlanEditorFormBodyProps {
  vm: DailyPlanEditorViewModel;
  /** `sheet` pins footer inside the portal sheet; `page` uses document/content scroll. */
  variant?: 'sheet' | 'page';
}

export function DailyPlanEditorFormBody({
  vm,
  variant = 'sheet',
}: DailyPlanEditorFormBodyProps) {
  const t = useTranslations('dailyPlanPage');
  const tCommon = useTranslations('common');
  const tCalendar = useTranslations('dailyDuties');
  const isPage = variant === 'page';

  const fields = (
    <div className={cn('flex flex-col gap-6', isPage ? 'p-5 md:p-8' : 'p-5')}>
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
            kindLabel={vm.kindLabel}
            onTopicChange={vm.updateTopic}
            onResourceChange={vm.updateResource}
            onAddResource={vm.addResource}
            onRemoveResource={vm.removeResource}
          />
        ))}
      </div>
    </div>
  );

  const saveFooter = !vm.readOnly ? (
    <div
      className={cn(
        'shrink-0 border-t border-slate-200/80 bg-white px-5 pt-3',
        isPage
          ? 'sticky bottom-0 pb-4 md:px-8'
          : 'pb-[calc(4.5rem+env(safe-area-inset-bottom))] min-[1367px]:pb-4',
      )}
    >
      <div className="flex justify-end">
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
      </div>
    </div>
  ) : null;

  if (isPage) {
    return (
      <div className="flex flex-col">
        {fields}
        {saveFooter}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
        {fields}
      </div>
      {saveFooter}
    </div>
  );
}
