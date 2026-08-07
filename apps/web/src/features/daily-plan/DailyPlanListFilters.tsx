'use client';

import { useTranslations } from 'next-intl';
import { DatePickerInput } from '@/shared/components/ui/date-picker-input';
import { MultiSelectChipsDropdown } from '@/shared/components/ui/multi-select-chips-dropdown';
import {
  ADMIN_CONTROL_CLASS,
  ADMIN_DATE_INPUT_CLASS,
  ADMIN_OUTLINE_BUTTON_CLASS,
} from '@/shared/lib/admin-control-theme';
import { cn } from '@/shared/lib/utils';

export interface DailyPlanTeacherOption {
  id: string;
  label: string;
}

export interface DailyPlanGroupOption {
  id: string;
  label: string;
}

interface DailyPlanListFiltersProps {
  selectedTeacherIds: Set<string>;
  onTeacherIdsChange: (value: Set<string>) => void;
  selectedGroupIds: Set<string>;
  onGroupIdsChange: (value: Set<string>) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  teacherOptions: DailyPlanTeacherOption[];
  groupOptions: DailyPlanGroupOption[];
  isLoadingTeachers?: boolean;
  isLoadingGroups?: boolean;
  onClear: () => void;
  hasActiveFilters: boolean;
}

export function DailyPlanListFilters({
  selectedTeacherIds,
  onTeacherIdsChange,
  selectedGroupIds,
  onGroupIdsChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  teacherOptions,
  groupOptions,
  isLoadingTeachers = false,
  isLoadingGroups = false,
  onClear,
  hasActiveFilters,
}: DailyPlanListFiltersProps) {
  const t = useTranslations('dailyPlanPage');
  const tCommon = useTranslations('common');

  return (
    <div className="rounded-[15px] border border-[rgba(14,14,16,0.07)] bg-white p-3 sm:p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5 xl:items-end">
        <div className="min-w-0">
          <MultiSelectChipsDropdown
            label={tCommon('teacher')}
            options={teacherOptions}
            selectedIds={selectedTeacherIds}
            onSelectionChange={onTeacherIdsChange}
            placeholder={t('allTeachers')}
            allSelectedLabel={t('allTeachers')}
            summaryPartialUsesCount
            searchPlaceholder={t('searchTeachers')}
            emptyOptionsHint={t('noTeachersFound')}
            noResultsHint={t('noTeachersFound')}
            isLoading={isLoadingTeachers}
            closedTriggerMode="summary"
            menuFitContentWidth
            triggerClassName={ADMIN_CONTROL_CLASS}
            selectedCountLabel={(count) => t('teachersSelected', { count })}
          />
        </div>
        <div className="min-w-0">
          <MultiSelectChipsDropdown
            label={tCommon('group')}
            options={groupOptions}
            selectedIds={selectedGroupIds}
            onSelectionChange={onGroupIdsChange}
            placeholder={t('allGroups')}
            allSelectedLabel={t('allGroups')}
            summaryPartialUsesCount
            searchPlaceholder={t('searchGroups')}
            emptyOptionsHint={t('noGroupsFound')}
            noResultsHint={t('noGroupsFound')}
            isLoading={isLoadingGroups}
            closedTriggerMode="summary"
            menuFitContentWidth
            triggerClassName={ADMIN_CONTROL_CLASS}
            selectedCountLabel={(count) => t('groupsSelected', { count })}
          />
        </div>
        <div className="min-w-0">
          <label htmlFor="daily-plan-filter-date-from" className="mb-1.5 block text-sm font-medium text-[#8b8b90]">
            {t('dateFrom')}
          </label>
          <DatePickerInput
            id="daily-plan-filter-date-from"
            value={dateFrom}
            allowClear
            placeholder={t('dateFrom')}
            onValueChange={onDateFromChange}
            max={dateTo || undefined}
            className={ADMIN_DATE_INPUT_CLASS}
          />
        </div>
        <div className="min-w-0">
          <label htmlFor="daily-plan-filter-date-to" className="mb-1.5 block text-sm font-medium text-[#8b8b90]">
            {t('dateTo')}
          </label>
          <DatePickerInput
            id="daily-plan-filter-date-to"
            value={dateTo}
            allowClear
            placeholder={t('dateTo')}
            onValueChange={onDateToChange}
            min={dateFrom || undefined}
            className={ADMIN_DATE_INPUT_CLASS}
          />
        </div>
        <div className="flex min-w-0 items-end">
          <button
            type="button"
            onClick={onClear}
            disabled={!hasActiveFilters}
            className={cn(
              ADMIN_OUTLINE_BUTTON_CLASS,
              'w-full text-[#3b3b40] transition-colors hover:bg-[#fafafa] disabled:cursor-not-allowed disabled:opacity-40',
            )}
          >
            {t('clearFilters')}
          </button>
        </div>
      </div>
    </div>
  );
}
