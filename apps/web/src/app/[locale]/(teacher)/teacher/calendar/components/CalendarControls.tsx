'use client';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import {
  getSegmentedIndicatorStyle,
  SEGMENTED_TOGGLE_BUTTON_ACTIVE_CLASS,
  SEGMENTED_TOGGLE_BUTTON_CLASS,
  SEGMENTED_TOGGLE_BUTTON_INACTIVE_CLASS,
  SEGMENTED_TOGGLE_GRID_TRACK_CLASS,
  SEGMENTED_TOGGLE_INDICATOR_CLASS,
  SEGMENTED_TOGGLE_TRACK_PADDING_PX,
} from '@/shared/components/ui/segmented-toggle-theme';

type ViewMode = 'week' | 'month' | 'list';

const VIEW_MODES: ViewMode[] = ['list', 'week', 'month'];

interface CalendarControlsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onAddCourse?: () => void;
  t?: (key: string) => string;
}

export function CalendarControls({
  viewMode,
  onViewModeChange,
  onAddCourse,
  t,
}: CalendarControlsProps) {
  const selectedIndex = Math.max(0, VIEW_MODES.indexOf(viewMode));
  const mobileSelectedIndex = viewMode === 'list' ? 0 : 1;

  return (
    <div className="flex items-center gap-3">
      <div
        role="group"
        aria-label={t?.('viewMode') ?? 'View mode'}
        className={cn(SEGMENTED_TOGGLE_GRID_TRACK_CLASS, 'w-full sm:w-[276px]')}
        style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
      >
        <span
          aria-hidden
          className={cn(SEGMENTED_TOGGLE_INDICATOR_CLASS, 'sm:hidden')}
          style={getSegmentedIndicatorStyle(
            mobileSelectedIndex,
            2,
            SEGMENTED_TOGGLE_TRACK_PADDING_PX,
          )}
        />
        <span
          aria-hidden
          className={cn(SEGMENTED_TOGGLE_INDICATOR_CLASS, 'hidden sm:block')}
          style={getSegmentedIndicatorStyle(
            selectedIndex,
            VIEW_MODES.length,
            SEGMENTED_TOGGLE_TRACK_PADDING_PX,
          )}
        />
        {VIEW_MODES.map((mode) => {
          const isSelected = viewMode === mode;
          const label =
            mode === 'list'
              ? (t?.('list') ?? 'List')
              : mode === 'week'
                ? (t?.('week') ?? 'Week')
                : (t?.('month') ?? 'Month');

          return (
            <button
              key={mode}
              type="button"
              onClick={() => onViewModeChange(mode)}
              className={cn(
                SEGMENTED_TOGGLE_BUTTON_CLASS,
                'duration-300',
                mode === 'month' && 'hidden sm:inline-flex',
                isSelected
                  ? SEGMENTED_TOGGLE_BUTTON_ACTIVE_CLASS
                  : cn(SEGMENTED_TOGGLE_BUTTON_INACTIVE_CLASS, 'hover:text-[#1010a3]'),
              )}
              aria-pressed={isSelected}
            >
              {label}
            </button>
          );
        })}
      </div>
      {viewMode === 'list' && onAddCourse ? (
        <Button
          onClick={onAddCourse}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          {t?.('addCourse') ?? 'Add Course'}
        </Button>
      ) : null}
    </div>
  );
}
