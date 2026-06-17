import { ViewModeSelector } from '@/shared/components/attendance';
import { Button } from '@/shared/components/ui/button';
import { DatePickerInput } from '@/shared/components/ui/date-picker-input';
import { MultiSelectGroupDropdown } from '@/shared/components/ui/multi-select-group-dropdown';
import { SingleSelectDropdown } from '@/shared/components/ui/single-select-dropdown';
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
      onViewModeChange('week');
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

  return (
    <div className="bg-white rounded-xl border border-[rgba(14,14,16,0.07)] p-6">
      <div className="flex items-center justify-between mb-4">
        <label className="block text-sm font-medium text-[#3b3b40]">{tc('viewMode')}</label>
        <ViewModeSelector
          value={viewMode}
          onChange={onViewModeChange}
          disabled={safeSelectedGroupIds.length === 0}
          availableModes={isMobile ? ['day', 'week'] : undefined}
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
              <label className="block text-sm font-medium text-[#3b3b40] mb-2">{tc('selectDate')}</label>
              <DatePickerInput
                value={formatDateString(currentDate)}
                onValueChange={onDateChange}
                max={getTodayDate()}
                className="w-full h-10 px-4 py-2 text-sm text-left bg-white border border-[rgba(14,14,16,0.12)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1010a3] focus:border-[#1010a3] disabled:opacity-50 disabled:cursor-not-allowed hover:border-[rgba(14,14,16,0.18)] transition-colors"
                disabled={safeSelectedGroupIds.length === 0}
              />
            </>
          )}
          {viewMode === 'week' && (
            <>
              <label className="block text-sm font-medium text-[#3b3b40] mb-2">{tc('week')}</label>
              <div className="flex items-center gap-2">
                <Button
                  onClick={onPrevious}
                  variant="outline"
                  size="sm"
                  disabled={safeSelectedGroupIds.length === 0}
                  className="px-3"
                >
                  ←
                </Button>
                <div className="flex-1 text-center px-3 py-2 border border-[rgba(14,14,16,0.12)] rounded-lg bg-[#fafafa] text-sm font-medium">
                  {formatWeekRange(currentDate)}
                </div>
                <Button
                  onClick={onNext}
                  variant="outline"
                  size="sm"
                  disabled={safeSelectedGroupIds.length === 0}
                  className="px-3"
                >
                  →
                </Button>
              </div>
            </>
          )}
          {viewMode === 'month' && (
            <>
              <label className="block text-sm font-medium text-[#3b3b40] mb-2">{tc('month')}</label>
              <div className="flex items-center gap-2">
                <Button
                  onClick={onPrevious}
                  variant="outline"
                  size="sm"
                  disabled={safeSelectedGroupIds.length === 0}
                  className="px-3"
                >
                  ←
                </Button>
                <div className="flex-1 text-center px-3 py-2 border border-[rgba(14,14,16,0.12)] rounded-lg bg-[#fafafa] text-sm font-medium">
                  {formatMonthDisplay(currentDate)}
                </div>
                <Button
                  onClick={onNext}
                  variant="outline"
                  size="sm"
                  disabled={safeSelectedGroupIds.length === 0}
                  className="px-3"
                >
                  →
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Absence-type filter (Admin only) or Back to Today button (Teacher) */}
        <div className="flex items-end">
          {showAbsenceTypeFilter && onAbsenceFilterChange ? (
            <div className="w-full">
              <label className="block text-sm font-medium text-[#3b3b40] mb-2">
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
                className="
                  [&>div>button>div>span]:flex-1
                  [&>div>button>div>span]:text-center
                  sm:[&>div>button>div>span]:text-left
                "
              />
            </div>
          ) : (
            <Button
              onClick={onGoToToday}
              disabled={isCurrentDateToday && viewMode === 'day'}
              variant={isCurrentDateToday && viewMode === 'day' ? 'outline' : 'default'}
              className="w-full"
            >
              {isCurrentDateToday && viewMode === 'day' ? tc('today') : t('backToToday')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}




