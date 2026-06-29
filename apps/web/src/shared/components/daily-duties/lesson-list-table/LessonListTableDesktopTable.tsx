import type { ReactElement } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { LessonListTableBodyRow } from '@/shared/components/daily-duties/LessonListTableBodyRow';
import type { Lesson } from '@/features/lessons';
import { getScheduleCardDayStatus } from '@/features/schedule/schedule-dates';
import { cn } from '@/shared/lib/utils';
import {
  TEACHER_DAILY_DUTIES_LIST_PAGE_SIZE,
  teacherDailyDutiesRowSection,
} from '@/shared/lib/daily-duties/teacher-daily-duties-list-order';
import type { TeacherDailyDutiesOrderedRow } from '@/shared/lib/daily-duties/teacher-daily-duties-list-order';

interface LessonListTableDesktopTableProps {
  useMobileCards: boolean;
  isIPad: boolean;
  sectionedCalendarList: boolean;
  showScheduleColumn: boolean;
  hideTeacherColumn: boolean;
  hideActionsColumn: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  allSelected: boolean;
  someSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  selectedLessons: Set<string>;
  onSelectLesson: (lessonId: string, checked: boolean) => void;
  isTeacher: boolean;
  sectionedPageRows: TeacherDailyDutiesOrderedRow[];
  sectionedOrderedRows: TeacherDailyDutiesOrderedRow[];
  sectionedListPage: number;
  sectionedTotalPages: number;
  onSectionedPageChange: (page: number) => void;
  sortedLessons: Lesson[];
  scheduleCategoryLabels: {
    upcoming: string;
    upcomingNext: string;
    today: string;
    completed: string;
    todayPastSlot: string;
  };
  tableColSpan: number;
  onObligationClick?: (
    lessonId: string,
    obligation: 'absence' | 'feedback' | 'voice' | 'text' | 'dailyPlan',
  ) => void;
  onComplete?: (lessonId: string) => void;
  onEdit?: (lessonId: string) => void;
  onDelete?: (lessonId: string) => void;
  onAssignSubstitute?: (lessonId: string) => void;
  onView: (lessonId: string) => void;
}

export function LessonListTableDesktopTable({
  useMobileCards,
  isIPad,
  sectionedCalendarList,
  showScheduleColumn,
  hideTeacherColumn,
  hideActionsColumn,
  sortBy,
  sortOrder,
  onSort,
  allSelected,
  someSelected,
  onSelectAll,
  selectedLessons,
  onSelectLesson,
  isTeacher,
  sectionedPageRows,
  sectionedOrderedRows,
  sectionedListPage,
  sectionedTotalPages,
  onSectionedPageChange,
  sortedLessons,
  scheduleCategoryLabels,
  tableColSpan,
  onObligationClick,
  onComplete,
  onEdit,
  onDelete,
  onAssignSubstitute,
  onView,
}: LessonListTableDesktopTableProps) {
  const tCal = useTranslations('dailyDuties');
  const tCommon = useTranslations('common');
  const tActions = useTranslations('dailyDuties.lessonActions');
  const activeLocale = useLocale();

  return (
    <>
      <div
        className={cn(
          'overflow-x-auto',
          useMobileCards && !isIPad && 'hidden sm:block',
          useMobileCards && isIPad && 'hidden',
        )}
      >
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={onSelectAll}
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                {tCal('columnLessonName')}
              </th>
              {sectionedCalendarList && showScheduleColumn && (
                <th className="min-w-[7rem] px-3 py-3 text-center text-xs font-semibold text-slate-600 uppercase">
                  {tCal('scheduleCategoryColumn')}
                </th>
              )}
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">
                {!sectionedCalendarList && onSort ? (
                  <button
                    type="button"
                    onClick={() => onSort('scheduledAt')}
                    className={cn(
                      'mx-auto flex items-center justify-center gap-1.5 rounded-md px-0 py-0.5 text-xs font-semibold uppercase transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 focus:outline-none',
                      sortBy === 'scheduledAt' && 'text-slate-700',
                    )}
                    aria-label={
                      sortBy !== 'scheduledAt'
                        ? tCal('sortByDateTime')
                        : sortOrder === 'asc'
                          ? tCal('sortByDateTimeAsc')
                          : tCal('sortByDateTimeDesc')
                    }
                  >
                    <span>{tCal('columnDateTime')}</span>
                    <span className="flex-shrink-0">
                      {sortBy === 'scheduledAt' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                      )}
                    </span>
                  </button>
                ) : (
                  tCal('columnDateTime')
                )}
              </th>
              {!hideTeacherColumn && (
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">
                  {tCommon('teacher')}
                </th>
              )}
              <th className="w-[100px] px-2 py-3 text-center text-xs font-semibold text-slate-600 uppercase">
                {tActions('absenceLabel')}
              </th>
              <th className="w-[100px] px-2 py-3 text-center text-xs font-semibold text-slate-600 uppercase">
                {tActions('feedbackLabel')}
              </th>
              <th className="w-[100px] px-2 py-3 text-center text-xs font-semibold text-slate-600 uppercase">
                {tActions('voiceLabel')}
              </th>
              <th className="w-[100px] px-2 py-3 text-center text-xs font-semibold text-slate-600 uppercase">
                {tActions('textLabel')}
              </th>
              <th className="w-[100px] px-2 py-3 text-center text-xs font-semibold text-slate-600 uppercase">
                {tActions('dailyPlanLabel')}
              </th>
              {!hideActionsColumn && (
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">
                  {tCommon('actions')}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sectionedCalendarList
              ? sectionedPageRows.flatMap((row, idx) => {
                  const globalIdx =
                    (sectionedListPage - 1) * TEACHER_DAILY_DUTIES_LIST_PAGE_SIZE + idx;
                  const prevGlobal =
                    globalIdx > 0 ? sectionedOrderedRows[globalIdx - 1] : undefined;
                  const section = teacherDailyDutiesRowSection(row.category);
                  const prevSection = prevGlobal
                    ? teacherDailyDutiesRowSection(prevGlobal.category)
                    : null;
                  const showSectionHeader = section !== prevSection;
                  const nodes: ReactElement[] = [];
                  if (showSectionHeader) {
                    const title =
                      section === 'upcoming'
                        ? tCal('sectionUpcoming')
                        : section === 'today'
                          ? tCal('sectionToday')
                          : tCal('sectionCompleted');
                    nodes.push(
                      <tr
                        key={`sec-${sectionedListPage}-${section}-${idx}`}
                        className="border-y border-slate-200 bg-slate-100/95"
                      >
                        <td
                          colSpan={tableColSpan}
                          className="px-4 py-2.5 text-xs font-bold tracking-wide text-slate-700 uppercase"
                        >
                          {title}
                        </td>
                      </tr>,
                    );
                  }
                  nodes.push(
                    <LessonListTableBodyRow
                      key={row.lesson.id}
                      lesson={row.lesson}
                      locale={activeLocale}
                      hideTeacherColumn={hideTeacherColumn}
                      isTeacher={isTeacher}
                      isSelected={selectedLessons.has(row.lesson.id)}
                      onSelectLesson={onSelectLesson}
                      dateStatus={getScheduleCardDayStatus(row.lesson.scheduledAt)}
                      onObligationClick={onObligationClick}
                      onComplete={onComplete}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onAssignSubstitute={onAssignSubstitute}
                      hideActionsColumn={hideActionsColumn}
                      onRowClick={hideActionsColumn ? onView : undefined}
                      scheduleCategory={showScheduleColumn ? row.category : undefined}
                      scheduleCategoryLabels={scheduleCategoryLabels}
                    />,
                  );
                  return nodes;
                })
              : sortedLessons.map((lesson) => (
                  <LessonListTableBodyRow
                    key={lesson.id}
                    lesson={lesson}
                    locale={activeLocale}
                    hideTeacherColumn={hideTeacherColumn}
                    isTeacher={isTeacher}
                    isSelected={selectedLessons.has(lesson.id)}
                    onSelectLesson={onSelectLesson}
                    dateStatus={getScheduleCardDayStatus(lesson.scheduledAt)}
                    onObligationClick={onObligationClick}
                    onComplete={onComplete}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onAssignSubstitute={onAssignSubstitute}
                    hideActionsColumn={hideActionsColumn}
                    onRowClick={hideActionsColumn ? onView : undefined}
                    scheduleCategoryLabels={scheduleCategoryLabels}
                  />
                ))}
          </tbody>
        </table>
      </div>
      {sectionedCalendarList && sectionedTotalPages > 1 && (
        <div
          className={cn(
            'flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:justify-start lg:gap-4',
            useMobileCards && 'hidden',
          )}
        >
          <p className="text-center text-sm text-slate-600 sm:text-left">
            {tCal('paginationSummary', {
              showingFrom: (sectionedListPage - 1) * TEACHER_DAILY_DUTIES_LIST_PAGE_SIZE + 1,
              showingTo: Math.min(
                sectionedListPage * TEACHER_DAILY_DUTIES_LIST_PAGE_SIZE,
                sectionedOrderedRows.length,
              ),
              total: sectionedOrderedRows.length,
            })}
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={sectionedListPage <= 1}
              onClick={() => onSectionedPageChange(Math.max(1, sectionedListPage - 1))}
              aria-label={tCal('paginationPrevious')}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">{tCal('paginationPrevious')}</span>
            </Button>
            <span className="min-w-[6.5rem] text-center text-sm font-medium text-slate-800">
              {tCal('paginationPageOf', { current: sectionedListPage, total: sectionedTotalPages })}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={sectionedListPage >= sectionedTotalPages}
              onClick={() =>
                onSectionedPageChange(Math.min(sectionedTotalPages, sectionedListPage + 1))
              }
              aria-label={tCal('paginationNext')}
            >
              <span className="hidden sm:inline">{tCal('paginationNext')}</span>
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
