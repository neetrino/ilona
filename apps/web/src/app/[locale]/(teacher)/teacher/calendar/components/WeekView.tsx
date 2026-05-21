import { cn } from '@/shared/lib/utils';
import type { Lesson } from '@/features/lessons';
import { LessonBlock } from './CalendarComponents';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface WeekViewProps {
  weekDates: Date[];
  lessonsByDate: Record<string, Lesson[]>;
  onComplete?: (lessonId: string) => void;
  onLessonClick?: (lessonId: string) => void;
  isLoading?: boolean;
  t?: (key: string) => string;
}

export function WeekView({ 
  weekDates, 
  lessonsByDate, 
  onComplete,
  onLessonClick,
  isLoading,
  t 
}: WeekViewProps) {
  if (isLoading) {
    return (
      <div className="p-8 text-center text-[#8b8b90]">
        {t?.('loading') || 'Loading...'}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-7 divide-x divide-[rgba(14,14,16,0.07)]">
      {weekDates.map((date, index) => {
        const dateKey = date.toISOString().split('T')[0];
        const dayLessons = lessonsByDate[dateKey] || [];
        const isToday = date.toDateString() === new Date().toDateString();

        return (
          <div key={index} className="min-h-[400px]">
            <div className={cn(
              'p-3 border-b border-[rgba(14,14,16,0.07)] text-center',
              isToday && 'bg-blue-50'
            )}>
              <p className="text-xs text-[#8b8b90]">{DAYS[index]}</p>
              <p className={cn(
                'text-lg font-semibold',
                isToday ? 'text-blue-600' : 'text-[#1010a3]'
              )}>
                {date.getDate()}
              </p>
            </div>
            <div className={cn('p-2', isToday && 'bg-blue-50/50')}>
              {dayLessons
                .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                .map((lesson) => (
                  <LessonBlock
                    key={lesson.id}
                    lesson={lesson}
                    onComplete={onComplete}
                    onClick={onLessonClick}
                  />
                ))}
              {dayLessons.length === 0 && (
                <p className="text-xs text-[#8b8b90] text-center py-4">
                  {t?.('noLessons') || 'No lessons'}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}





