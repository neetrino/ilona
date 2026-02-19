import { cn } from '@/shared/lib/utils';
import type { Lesson } from '@/features/lessons';
import { LessonBlock } from './CalendarComponents';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface MonthViewProps {
  monthDates: (Date | null)[][];
  lessonsByDate: Record<string, Lesson[]>;
  onComplete?: (lessonId: string) => void;
  isLoading?: boolean;
  t?: (key: string) => string;
}

export function MonthView({ 
  monthDates, 
  lessonsByDate, 
  onComplete,
  isLoading,
  t 
}: MonthViewProps) {
  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-500">
        {t?.('loading') || 'Loading...'}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-slate-200">
        {DAYS.map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-slate-600 bg-slate-50">
            {day}
          </div>
        ))}
      </div>
      <div className="divide-y divide-slate-200">
        {monthDates.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 divide-x divide-slate-200">
            {week.map((date, dayIndex) => {
              if (!date) {
                return <div key={dayIndex} className="min-h-[100px] bg-slate-50" />;
              }
              
              const dateKey = date.toISOString().split('T')[0];
              const dayLessons = lessonsByDate[dateKey] || [];
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <div key={dayIndex} className={cn(
                  'min-h-[100px] p-1',
                  isToday && 'bg-blue-50'
                )}>
                  <p className={cn(
                    'text-sm font-medium mb-1',
                    isToday ? 'text-blue-600' : 'text-slate-800'
                  )}>
                    {date.getDate()}
                  </p>
                  {dayLessons.slice(0, 2).map((lesson) => (
                    <LessonBlock key={lesson.id} lesson={lesson} onComplete={onComplete} />
                  ))}
                  {dayLessons.length > 2 && (
                    <p className="text-xs text-slate-500">+{dayLessons.length - 2} more</p>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}


