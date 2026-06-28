import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import {
  SEGMENTED_TOGGLE_BUTTON_ACTIVE_CLASS,
  SEGMENTED_TOGGLE_BUTTON_CLASS,
  SEGMENTED_TOGGLE_BUTTON_INACTIVE_CLASS,
  SEGMENTED_TOGGLE_INDICATOR_CLASS,
  SEGMENTED_TOGGLE_TRACK_CLASS,
  SEGMENTED_TOGGLE_TWO_SEGMENT_WIDTH_CLASS,
} from './segmented-toggle-theme';

interface ListBoardViewToggleProps {
  value: 'list' | 'board';
  onChange: (mode: 'list' | 'board') => void;
  listLabel: string;
  boardLabel: string;
  className?: string;
}

export function ListBoardViewToggle({
  value,
  onChange,
  listLabel,
  boardLabel,
  className,
}: ListBoardViewToggleProps) {
  return (
    <div className={cn(SEGMENTED_TOGGLE_TRACK_CLASS, className)}>
      <span
        className={cn(
          SEGMENTED_TOGGLE_INDICATOR_CLASS,
          SEGMENTED_TOGGLE_TWO_SEGMENT_WIDTH_CLASS,
          value === 'board' && 'translate-x-full',
        )}
      />
      <button
        type="button"
        onClick={() => onChange('list')}
        className={cn(
          SEGMENTED_TOGGLE_BUTTON_CLASS,
          'gap-2',
          value === 'list' ? SEGMENTED_TOGGLE_BUTTON_ACTIVE_CLASS : SEGMENTED_TOGGLE_BUTTON_INACTIVE_CLASS,
        )}
        aria-pressed={value === 'list'}
      >
        <List className="h-4 w-4 shrink-0" />
        {listLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange('board')}
        className={cn(
          SEGMENTED_TOGGLE_BUTTON_CLASS,
          'gap-2',
          value === 'board' ? SEGMENTED_TOGGLE_BUTTON_ACTIVE_CLASS : SEGMENTED_TOGGLE_BUTTON_INACTIVE_CLASS,
        )}
        aria-pressed={value === 'board'}
      >
        <LayoutGrid className="h-4 w-4 shrink-0" />
        {boardLabel}
      </button>
    </div>
  );
}
