'use client';

import { useTranslations } from 'next-intl';
import { DatePickerInput } from '@/shared/components/ui/date-picker-input';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
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
  teacherId: string;
  onTeacherIdChange: (value: string | null) => void;
  groupId: string;
  onGroupIdChange: (value: string | null) => void;
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
  teacherId,
  onTeacherIdChange,
  groupId,
  onGroupIdChange,
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
          <label className="mb-1.5 block text-sm font-medium text-[#8b8b90]">
            {tCommon('teacher')}
          </label>
          <SingleSelectDropdown
            id="daily-plan-filter-teacher"
            options={[
              { id: '', label: t('allTeachers') },
              ...teacherOptions,
            ]}
            value={teacherId}
            onValueChange={(next) => onTeacherIdChange(next || null)}
            allowDeselect
            searchable
            searchPlaceholder={t('searchTeachers')}
            noSearchResultsMessage={t('noTeachersFound')}
            isLoading={isLoadingTeachers}
            placeholder={t('allTeachers')}
            triggerClassName={ADMIN_CONTROL_CLASS}
          />
        </div>
        <div className="min-w-0">
          <label className="mb-1.5 block text-sm font-medium text-[#8b8b90]">
            {tCommon('group')}
          </label>
          <SingleSelectDropdown
            id="daily-plan-filter-group"
            options={[
              { id: '', label: t('allGroups') },
              ...groupOptions,
            ]}
            value={groupId}
            onValueChange={(next) => onGroupIdChange(next || null)}
            allowDeselect
            searchable
            searchPlaceholder={t('searchGroups')}
            noSearchResultsMessage={t('noGroupsFound')}
            isLoading={isLoadingGroups}
            placeholder={t('allGroups')}
            triggerClassName={ADMIN_CONTROL_CLASS}
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
