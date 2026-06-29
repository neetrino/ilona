import { LessonListTable } from '@/shared/components/daily-duties/LessonListTable';
import type { Lesson } from '@/features/lessons';
import { useTranslations } from 'next-intl';
import type { LessonActionId } from '@/shared/lib/daily-duties/lesson-action-states';

interface DailyDutiesListViewProps {
  lessons: Lesson[];
  isLoading: boolean;
  sortBy: string | undefined;
  sortOrder: 'asc' | 'desc' | undefined;
  listReferenceDate: Date;
  isTeacherMode: boolean;
  hasActiveFilters: boolean;
  onSort: (key: string) => void;
  onBulkDelete: (lessonIds: string[]) => void;
  onMobileCardClick: (lessonId: string, tab?: LessonActionId) => void;
  onObligationClick: (lessonId: string, obligation: string) => void;
  onDelete?: (lessonId: string) => void;
  onAssignSubstitute?: (lessonId: string) => void;
}

export function DailyDutiesListView({
  lessons,
  isLoading,
  sortBy,
  sortOrder,
  listReferenceDate,
  isTeacherMode,
  hasActiveFilters,
  onSort,
  onBulkDelete,
  onMobileCardClick,
  onObligationClick,
  onDelete,
  onAssignSubstitute,
}: DailyDutiesListViewProps) {
  const t = useTranslations('dailyDuties');

  if (isLoading) {
    return (
      <div className="rounded-[15px] border border-[rgba(14,14,16,0.07)] bg-white p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-12 rounded-[15px] bg-[#f1f1f2]" />
          <div className="h-12 rounded-[15px] bg-[#f1f1f2]" />
          <div className="h-12 rounded-[15px] bg-[#f1f1f2]" />
        </div>
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="rounded-[15px] border border-[rgba(14,14,16,0.07)] bg-white p-8 text-center">
        <p className="text-[#8b8b90]">
          {hasActiveFilters
            ? isTeacherMode
              ? t('noOwnDutiesMatchFilters')
              : t('noLessonsMatchFilters')
            : isTeacherMode
              ? t('noOwnDutiesFound')
              : t('noLessonsFound')}
        </p>
      </div>
    );
  }

  return (
    <LessonListTable
      lessons={lessons}
      isLoading={isLoading}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
      sectionedCalendarList
      showScheduleColumn={false}
      useMobileCards
      hideActionsColumn
      hideTeacherColumn={isTeacherMode}
      listReferenceDate={listReferenceDate}
      onBulkDelete={onBulkDelete}
      onMobileCardClick={onMobileCardClick}
      onObligationClick={onObligationClick}
      onDelete={onDelete}
      onAssignSubstitute={onAssignSubstitute}
    />
  );
}
