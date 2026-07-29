import { ViewModeSelector } from '@/shared/components/attendance';
import { Button } from '@/shared/components/ui/button';
import { DatePickerInput } from '@/shared/components/ui/date-picker-input';
import { MultiSelectGroupDropdown } from '@/shared/components/ui/multi-select-group-dropdown';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
import {
  ADMIN_CONTROL_CLASS,
  ADMIN_DATE_INPUT_CLASS,
  ADMIN_FORM_INPUT_CLASS,
  ADMIN_OUTLINE_BUTTON_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
} from '@/shared/lib/admin-control-theme';
import { ATTENDANCE_CONTROLS_CARD_CLASS } from '@/shared/components/attendance/attendance-button-theme';
import { cn } from '@/shared/lib/utils';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import {
  getTodayDate,
  formatDateString,
  formatWeekRange,
  formatMonthDisplay,
  type ViewMode,
} from '@/features/attendance/utils/dateUtils';
import type { Group } from '@/features/groups';

/** Absence type filter: matches the 5 types shown in the Legend (All = no filter). */
export type AbsenceFilterType =
  | 'all'
  | 'present'
  | 'absent_justified'
  | 'absent_unjustified'
  | 'not_marked'
  | 'no_session';


interface AttendanceControlsProps {
  viewMode: ViewMode;
  currentDate: Date;
  selectedGroupId: string | null; // For backward compatibility
  selectedGroupIds?: string[]; // New multi-select support (optional)
  groups: Group[];
  isLoadingGroups: boolean;
  isCurrentDateToday: boolean;
  onViewModeChange: (mode: ViewMode) => void;
  onGroupChange: (groupId: string | null) => void; // For backward compatibility
  onGroupsChange?: (groupIds: string[]) => void; // New multi-select support (optional)
  onDateChange: (date: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onGoToToday: () => void;
  /** Admin-only: show absence-type filter instead of Back to Today button */
  showAbsenceTypeFilter?: boolean;
  absenceFilter?: AbsenceFilterType;
  onAbsenceFilterChange?: (value: AbsenceFilterType) => void;
  viewModeSelectorVariant?: 'default' | 'teacher';
}

export function AttendanceControls({
  viewMode,
  currentDate,
  selectedGroupId, // For backward compatibility
  selectedGroupIds, // New multi-select support
  groups,
  isLoadingGroups,
  isCurrentDateToday,
  onViewModeChange,
  onGroupChange, // For backward compatibility
  onGroupsChange, // New multi-select support
  onDateChange,
  onPrevious,
  onNext,
  onGoToToday,
  showAbsenceTypeFilter = false,
  absenceFilter = 'all',
  onAbsenceFilterChange,
  viewModeSelectorVariant = 'default',
}: AttendanceControlsProps) {
  const t = useTranslations('attendance');
  const tc = useTranslations('common');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const sync = () => setIsMobile(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener('change', sync);
    return () => mediaQuery.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (isMobile && viewMode === 'month') {
      onViewModeChange('day');
    }
  }, [isMobile, viewMode, onViewModeChange]);

  const absenceFilterOptions: { value: AbsenceFilterType; label: string }[] = [
    { value: 'all', label: tc('all') },
    { value: 'present', label: t('present') },
    { value: 'absent_justified', label: t('absentJustifiedFilter') },
    { value: 'absent_unjustified', label: t('absentUnjustifiedFilter') },
    { value: 'not_marked', label: t('notMarked') },
    { value: 'no_session', label: t('noSession') },
  ];
  // Ensure selectedGroupIds is always an array to prevent undefined errors
  // If selectedGroupIds is not provided, fall back to selectedGroupId (single-select mode)
  const safeSelectedGroupIds = selectedGroupIds ?? (selectedGroupId ? [selectedGroupId] : []);
  const selectedGroupIdsSet = new Set(safeSelectedGroupIds);

  const groupOptions = groups.map((group) => ({
    id: group.id,
    label: `${group.name}${group.level ? ` (${group.level})` : ''}`,
  }));

  const handleGroupsChange = (newSelectedIds: Set<string>) => {
    if (onGroupsChange) {
      onGroupsChange(Array.from(newSelectedIds));
    } else if (onGroupChange) {
      // Fallback to single-select if onGroupsChange is not provided
      const firstId = newSelectedIds.size > 0 ? Array.from(newSelectedIds)[0] : null;
      onGroupChange(firstId);
    }
  };

  const navButtonClass = cn(
    ADMIN_OUTLINE_BUTTON_CLASS,
    'shrink-0 px-3 text-[#3b3b40] hover:bg-[#fafafa] disabled:opacity-50',
  );
  const periodLabelClass = cn(
    ADMIN_CONTROL_CLASS,
    'flex flex-1 items-center justify-center border border-[rgba(14,14,16,0.12)] bg-[#fafafa] px-3 text-sm font-medium text-[#3b3b40]',
  );

  return (
    <div className={cn(ATTENDANCE_CONTROLS_CARD_CLASS, 'space-y-4')}>
      <div className="mb-4 flex items-center justify-between">
        <label className="block text-sm font-medium text-[#3b3b40]">{tc('viewMode')}</label>
        <ViewModeSelector
          value={viewMode}
          onChange={onViewModeChange}
          disabled={safeSelectedGroupIds.length === 0}
          availableModes={isMobile ? ['day', 'week'] : undefined}
          variant={viewModeSelectorVariant}
        />
      </div>

      {/* Selection Controls */}
      <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
        {/* Group Selection - Multi-select */}
        <MultiSelectGroupDropdown
          label={t('selectGroup')}
          options={groupOptions}
          selectedIds={selectedGroupIdsSet}
          onSelectionChange={handleGroupsChange}
          placeholder={t('selectGroup')}
          isLoading={isLoadingGroups}
          disabled={isLoadingGroups}
          searchable={true}
        />

        {/* Date/Week/Month Selection and Navigation */}
        <div>
          {viewMode === 'day' && (
            <>
              <label className="mb-2 block text-sm font-medium text-[#3b3b40]">{tc('selectDate')}</label>
              <DatePickerInput
                value={formatDateString(currentDate)}
                onValueChange={onDateChange}
                max={getTodayDate()}
                className={ADMIN_DATE_INPUT_CLASS}
                disabled={safeSelectedGroupIds.length === 0}
              />
            </>
          )}
          {viewMode === 'week' && (
            <>
              <label className="mb-2 block text-sm font-medium text-[#3b3b40]">{tc('week')}</label>
              <div className="flex items-center gap-2">
                <Button
                  onClick={onPrevious}
                  variant="outline"
                  disabled={safeSelectedGroupIds.length === 0}
                  className={navButtonClass}
                >
                  ←
                </Button>
                <div className={periodLabelClass}>
                  {formatWeekRange(currentDate)}
                </div>
                <Button
                  onClick={onNext}
                  variant="outline"
                  disabled={safeSelectedGroupIds.length === 0}
                  className={navButtonClass}
                >
                  →
                </Button>
              </div>
            </>
          )}
          {viewMode === 'month' && (
            <>
              <label className="mb-2 block text-sm font-medium text-[#3b3b40]">{tc('month')}</label>
              <div className="flex items-center gap-2">
                <Button
                  onClick={onPrevious}
                  variant="outline"
                  disabled={safeSelectedGroupIds.length === 0}
                  className={navButtonClass}
                >
                  ←
                </Button>
                <div className={periodLabelClass}>
                  {formatMonthDisplay(currentDate)}
                </div>
                <Button
                  onClick={onNext}
                  variant="outline"
                  disabled={safeSelectedGroupIds.length === 0}
                  className={navButtonClass}
                >
                  →
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Absence-type filter (Admin only) or Back to Today button (Teacher) */}
        <div className={cn(!showAbsenceTypeFilter && 'flex items-end')}>
          {showAbsenceTypeFilter && onAbsenceFilterChange ? (
            <div className="flex w-full items-center gap-3 sm:block">
              <label
                htmlFor="attendance-absence-type-filter"
                className="shrink-0 text-sm font-medium text-[#3b3b40] sm:mb-2 sm:block"
              >
                {t('filterByType')}
              </label>
              <SingleSelectDropdown
                id="attendance-absence-type-filter"
                options={absenceFilterOptions.map((opt) => ({ id: opt.value, label: opt.label }))}
                value={absenceFilter}
                onValueChange={(nextValue) =>
                  onAbsenceFilterChange((nextValue as AbsenceFilterType | null) ?? 'all')
                }
                disabled={safeSelectedGroupIds.length === 0}
                triggerClassName={ADMIN_FORM_INPUT_CLASS}
                className="min-w-0 flex-1 sm:w-full [&>div>button>div>span:first-child]:min-w-0 [&>div>button>div>span:first-child]:flex-1"
              />
            </div>
          ) : (
            <Button
              onClick={onGoToToday}
              disabled={isCurrentDateToday && viewMode === 'day'}
              variant={isCurrentDateToday && viewMode === 'day' ? 'outline' : 'default'}
              className={cn(
                ADMIN_PRIMARY_BUTTON_CLASS,
                'w-full bg-[#1010a3] text-white hover:bg-[#1010a3]/90',
                isCurrentDateToday && viewMode === 'day' && 'border border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#fafafa]',
              )}
            >
              {isCurrentDateToday && viewMode === 'day' ? tc('today') : t('backToToday')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}



