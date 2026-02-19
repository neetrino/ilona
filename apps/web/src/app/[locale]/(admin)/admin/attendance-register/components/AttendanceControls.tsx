import { ViewModeSelector } from '@/shared/components/attendance';
import { Button } from '@/shared/components/ui/button';
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
  selectedGroupId: string | null;
  groups: Group[];
  isLoadingGroups: boolean;
  isCurrentDateToday: boolean;
  onViewModeChange: (mode: ViewMode) => void;
  onGroupChange: (groupId: string | null) => void;
  onDateChange: (date: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onGoToToday: () => void;
}

export function AttendanceControls({
  viewMode,
  currentDate,
  selectedGroupId,
  groups,
  isLoadingGroups,
  isCurrentDateToday,
  onViewModeChange,
  onGroupChange,
  onDateChange,
  onPrevious,
  onNext,
  onGoToToday,
}: AttendanceControlsProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <label className="block text-sm font-medium text-slate-700">View Mode</label>
        <ViewModeSelector
          value={viewMode}
          onChange={onViewModeChange}
          disabled={!selectedGroupId}
        />
      </div>

      {/* Selection Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Group Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Select Group</label>
          <select
            value={selectedGroupId || ''}
            onChange={(e) => {
              onGroupChange(e.target.value || null);
            }}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            disabled={isLoadingGroups}
          >
            <option value="">-- Select Group --</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name} {group.level && `(${group.level})`}
              </option>
            ))}
          </select>
        </div>

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
                disabled={!selectedGroupId}
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
                  disabled={!selectedGroupId}
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
                  disabled={!selectedGroupId}
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
                  disabled={!selectedGroupId}
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
                  disabled={!selectedGroupId}
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


