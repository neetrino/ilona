import { ViewModeSelector } from '@/shared/components/attendance';
import { Button } from '@/shared/components/ui/button';
import { MultiSelectGroupDropdown } from '@/shared/components/ui/multi-select-group-dropdown';
import { useTranslations } from 'next-intl';
import {
  getTodayDate,
  formatDateString,
  formatWeekRange,
  formatMonthDisplay,
  type ViewMode,
} from '@/features/attendance/utils/dateUtils';
import type { Group } from '@/features/groups';

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
}: AttendanceControlsProps) {
  const t = useTranslations('attendance');
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
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <label className="block text-sm font-medium text-slate-700">View Mode</label>
        <ViewModeSelector
          value={viewMode}
          onChange={onViewModeChange}
          disabled={safeSelectedGroupIds.length === 0}
        />
      </div>

      {/* Selection Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Date</label>
              <input
                type="date"
                value={formatDateString(currentDate)}
                onChange={(e) => onDateChange(e.target.value)}
                max={getTodayDate()}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                disabled={safeSelectedGroupIds.length === 0}
              />
            </>
          )}
          {viewMode === 'week' && (
            <>
              <label className="block text-sm font-medium text-slate-700 mb-2">Week</label>
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
                <div className="flex-1 text-center px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm font-medium">
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
              <label className="block text-sm font-medium text-slate-700 mb-2">Month</label>
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
                <div className="flex-1 text-center px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm font-medium">
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

        {/* Back to Today Button */}
        <div className="flex items-end">
          <Button
            onClick={onGoToToday}
            disabled={isCurrentDateToday && viewMode === 'day'}
            variant={isCurrentDateToday && viewMode === 'day' ? 'outline' : 'default'}
            className="w-full"
          >
            {isCurrentDateToday && viewMode === 'day' ? 'Today' : 'Back to Today'}
          </Button>
        </div>
      </div>
    </div>
  );
}




