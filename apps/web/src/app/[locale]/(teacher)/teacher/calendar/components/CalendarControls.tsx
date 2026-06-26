'use client';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';

type ViewMode = 'week' | 'month' | 'list';

const VIEW_MODES: ViewMode[] = ['list', 'week', 'month'];
const TRACK_PADDING_PX = 4;

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
  const selectedIndex = VIEW_MODES.indexOf(viewMode);
  const segmentShare = 100 / VIEW_MODES.length;

  return (
    <div className="flex items-center gap-3">
      <div
        role="group"
        aria-label={t?.('viewMode') ?? 'View mode'}
        className="relative grid w-full rounded-lg border border-[rgba(14,14,16,0.12)] bg-[#f6f6f7] p-1 shadow-sm sm:w-[276px]"
        style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
      >
        {selectedIndex >= 0 ? (
          <span
            aria-hidden
            className="pointer-events-none absolute z-0 rounded-md bg-[#1010a3] shadow-sm transition-[left,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              top: TRACK_PADDING_PX,
              bottom: TRACK_PADDING_PX,
              left: `calc(${selectedIndex * segmentShare}% + ${TRACK_PADDING_PX}px)`,
              width: `calc(${segmentShare}% - ${TRACK_PADDING_PX * 2}px)`,
            }}
          />
        ) : null}
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
                'relative z-10 rounded-md px-4 py-2 text-sm font-semibold transition-colors duration-300 focus:outline-none',
                isSelected
                  ? 'text-white'
                  : 'text-[#3b3b40] hover:text-[#1010a3]',
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
