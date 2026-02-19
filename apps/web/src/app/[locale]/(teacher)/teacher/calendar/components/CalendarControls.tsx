import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';

type ViewMode = 'week' | 'month' | 'list';

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
  t 
}: CalendarControlsProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex bg-slate-100 p-1 rounded-lg">
        <button
          onClick={() => onViewModeChange('list')}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md transition-colors',
            viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600'
          )}
        >
          {t?.('list') || 'List'}
        </button>
        <button
          onClick={() => onViewModeChange('week')}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md transition-colors',
            viewMode === 'week' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600'
          )}
        >
          {t?.('week') || 'Week'}
        </button>
        <button
          onClick={() => onViewModeChange('month')}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md transition-colors',
            viewMode === 'month' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600'
          )}
        >
          {t?.('month') || 'Month'}
        </button>
      </div>
      {viewMode === 'list' && onAddCourse && (
        <Button
          onClick={onAddCourse}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {t?.('addCourse') || 'Add Course'}
        </Button>
      )}
    </div>
  );
}

