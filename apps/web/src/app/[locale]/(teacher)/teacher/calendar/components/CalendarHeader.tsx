type ViewMode = 'week' | 'month' | 'list';

interface CalendarHeaderProps {
  viewMode: ViewMode;
  currentDate: Date;
  weekDates?: Date[];
  onNavigate: (direction: number) => void;
  onGoToToday: () => void;
  t?: (key: string) => string;
}

export function CalendarHeader({ 
  viewMode, 
  currentDate, 
  weekDates,
  onNavigate, 
  onGoToToday,
  t 
}: CalendarHeaderProps) {
  const formatHeader = () => {
    if (viewMode === 'week' && weekDates) {
      return `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onNavigate(-1)}
        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h2 className="text-lg font-semibold text-slate-800 min-w-[200px] text-center">
        {formatHeader()}
      </h2>
      <button
        onClick={() => onNavigate(1)}
        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <button
        onClick={onGoToToday}
        className="ml-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        {t?.('today') || 'Today'}
      </button>
    </div>
  );
}

