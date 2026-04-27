import { CalendarMonthGrid } from '@/shared/components/calendar/CalendarMonthGrid';
import type { Lesson } from '@/features/lessons';
import { LessonBlock } from './CalendarComponents';

interface MonthViewProps {
  monthDates: (Date | null)[][];
  lessonsByDate: Record<string, Lesson[]>;
  onComplete?: (lessonId: string) => void;
  onLessonClick?: (lessonId: string) => void;
  isLoading?: boolean;
}

export function MonthView({
  monthDates,
  lessonsByDate,
  onComplete,
  onLessonClick,
  isLoading,
}: MonthViewProps) {
  return (
    <CalendarMonthGrid<Lesson>
      monthDates={monthDates}
      getLessonsForDay={(k) => lessonsByDate[k] ?? []}
      getLessonKey={(l) => l.id}
      getSortTime={(l) => new Date(l.scheduledAt).getTime()}
      renderLesson={({ lesson, variant }) => (
        <div
          className={variant === 'dialog' ? 'min-w-0' : 'min-w-0 max-w-full overflow-hidden'}
        >
          <LessonBlock
            lesson={lesson}
            onComplete={onComplete}
            onClick={onLessonClick}
          />
        </div>
      )}
      isLoading={isLoading}
    />
  );
}
