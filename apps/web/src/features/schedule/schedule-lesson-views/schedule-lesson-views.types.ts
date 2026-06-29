import type { Lesson } from '@/features/lessons';

export type ScheduleUiVariant = 'default' | 'student';

export interface WeekLessonGridProps {
  weekDates: Date[];
  lessons: Lesson[];
  isLoading?: boolean;
  highlightPastLessonCards?: boolean;
  theme?: ScheduleUiVariant;
  forceMobileLayout?: boolean;
}

export interface MonthLessonGridProps {
  monthDates: (Date | null)[][];
  lessonsByDate: Record<string, Lesson[]>;
  isLoading?: boolean;
  className?: string;
  highlightPastLessonCards?: boolean;
  theme?: ScheduleUiVariant;
}

export interface ScheduleLessonCardProps {
  lesson: Lesson;
  variant?: 'cell' | 'dialog';
  highlightPastLessonCards?: boolean;
  referenceTime: Date;
  uiVariant?: ScheduleUiVariant;
}
