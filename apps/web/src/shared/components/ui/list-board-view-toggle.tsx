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
        'relative inline-flex rounded-lg border-2 border-[rgba(14,14,16,0.12)] bg-white p-1 shadow-sm',
        className
      )}
    >
      <span
        className={cn(
          'pointer-events-none absolute bottom-1 left-1 top-1 z-0 w-[calc(50%-0.125rem)] rounded-md bg-[#1010a3] shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          value === 'board' ? 'translate-x-full' : 'translate-x-0'
        )}
      />
      <button
        type="button"
        onClick={() => onChange('list')}
        className={cn(
          'relative z-10 px-4 py-2 text-sm font-semibold rounded-md transition-colors flex items-center gap-2',
          'focus:outline-none',
          value === 'list' ? 'text-white' : 'text-[#3b3b40] hover:bg-[#f6f6f7]'
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
          'relative z-10 px-4 py-2 text-sm font-semibold rounded-md transition-colors flex items-center gap-2',
          'focus:outline-none',
          value === 'board' ? 'text-white' : 'text-[#3b3b40] hover:bg-[#f6f6f7]'
        )}
        aria-pressed={value === 'board'}
      >
        <LayoutGrid className="w-4 h-4" />
        {boardLabel}
      </button>
    </div>
  );
}
