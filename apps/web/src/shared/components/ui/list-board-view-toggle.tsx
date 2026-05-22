import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

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
    <div
      className={cn(
        'inline-flex rounded-lg border-2 border-[rgba(14,14,16,0.12)] bg-white p-1 shadow-sm',
        className
      )}
    >
      <button
        type="button"
        onClick={() => onChange('list')}
        className={cn(
          'px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center gap-2',
          'focus:outline-none focus:ring-2 focus:ring-[#1010a3] focus:ring-offset-2',
          value === 'list'
            ? 'bg-[#1010a3] text-white shadow-md'
            : 'text-[#3b3b40] hover:bg-[#f6f6f7]'
        )}
        aria-pressed={value === 'list'}
      >
        <List className="w-4 h-4" />
        {listLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange('board')}
        className={cn(
          'px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center gap-2',
          'focus:outline-none focus:ring-2 focus:ring-[#1010a3] focus:ring-offset-2',
          value === 'board'
            ? 'bg-[#1010a3] text-white shadow-md'
            : 'text-[#3b3b40] hover:bg-[#f6f6f7]'
        )}
        aria-pressed={value === 'board'}
      >
        <LayoutGrid className="w-4 h-4" />
        {boardLabel}
      </button>
    </div>
  );
}
