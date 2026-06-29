import type { Lesson } from '@/features/lessons';
import type { LessonActionId } from '@/shared/lib/daily-duties/lesson-action-states';
import type { TeacherDailyDutiesRowCategory } from '@/shared/lib/daily-duties/teacher-daily-duties-list-order';

export interface LessonListTableProps {
  lessons: Lesson[];
  isLoading?: boolean;
  onBulkDelete?: (lessonIds: string[]) => void;
  onEdit?: (lessonId: string) => void;
  onDelete?: (lessonId: string) => void;
  onComplete?: (lessonId: string) => void;
  onAssignSubstitute?: (lessonId: string) => void;
  onObligationClick?: (
    lessonId: string,
    obligation: 'absence' | 'feedback' | 'voice' | 'text' | 'dailyPlan',
  ) => void;
  hideTeacherColumn?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  showBulkBarWhenEmpty?: boolean;
  sectionedCalendarList?: boolean;
  showScheduleColumn?: boolean;
  useMobileCards?: boolean;
  listReferenceDate?: Date;
  hideActionsColumn?: boolean;
  onMobileCardClick?: (lessonId: string, tab?: LessonActionId) => void;
}

export type LessonListCardRow = {
  lesson: Lesson;
  category?: TeacherDailyDutiesRowCategory;
};
