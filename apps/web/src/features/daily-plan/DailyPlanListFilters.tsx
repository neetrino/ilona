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

interface DailyPlanListFiltersProps {
  teacherId: string;
  onTeacherIdChange: (value: string | null) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  teacherOptions: DailyPlanTeacherOption[];
  isLoadingTeachers?: boolean;
  onClear: () => void;
  hasActiveFilters: boolean;
}

export function DailyPlanListFilters({
  teacherId,
  onTeacherIdChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  teacherOptions,
  isLoadingTeachers = false,
  onClear,
  hasActiveFilters,
}: DailyPlanListFiltersProps) {
  const t = useTranslations('dailyPlanPage');
  const tCommon = useTranslations('common');

  return (
    <div className="rounded-[15px] border border-[rgba(14,14,16,0.07)] bg-white p-3 sm:p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
        <div className="min-w-0 sm:col-span-2 lg:col-span-1">
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
