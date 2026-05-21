'use client';

import { useState, useMemo, useEffect, type ReactElement } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { LessonListTableBodyRow } from '@/shared/components/calendar/LessonListTableBodyRow';
import type { Lesson } from '@/features/lessons';
import { getScheduleCardDayStatus } from '@/features/schedule/schedule-dates';
import { cn } from '@/shared/lib/utils';
import { useAuthStore } from '@/features/auth/store/auth.store';
import {
  buildTeacherCalendarOrderedRows,
  TEACHER_CALENDAR_LIST_PAGE_SIZE,
  teacherCalendarRowSection,
} from '@/shared/lib/calendar/teacher-calendar-list-order';

interface LessonListTableProps {
  lessons: Lesson[];
  isLoading?: boolean;
  onBulkDelete?: (lessonIds: string[]) => void;
  onEdit?: (lessonId: string) => void;
  onDelete?: (lessonId: string) => void;
  onComplete?: (lessonId: string) => void;
  /** Admin calendar: open substitute-teacher dialog for this lesson */
  onAssignSubstitute?: (lessonId: string) => void;
  onObligationClick?: (
    lessonId: string,
    obligation: 'absence' | 'feedback' | 'voice' | 'text' | 'dailyPlan'
  ) => void;
  hideTeacherColumn?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  /** When true, bulk action bar stays visible with a disabled delete until at least one row is selected (admin calendar). */
  showBulkBarWhenEmpty?: boolean;
  /**
   * List view: completed first, then next 2 upcoming, today, later; Schedule column; 10 rows per page.
   * Used for teacher and admin calendar list.
   */
  sectionedCalendarList?: boolean;
}

export function LessonListTable({
  lessons,
  isLoading = false,
  onBulkDelete,
  onEdit,
  onDelete,
  onComplete,
  onAssignSubstitute,
  onObligationClick,
  hideTeacherColumn = false,
  sortBy,
  sortOrder,
  onSort,
  showBulkBarWhenEmpty = false,
  sectionedCalendarList = false,
}: LessonListTableProps) {
  const locale = useLocale();
  const tCal = useTranslations('calendar');
  const tCommon = useTranslations('common');
  const tActions = useTranslations('calendar.lessonActions');
  const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set());
  const [sectionedListPage, setSectionedListPage] = useState(1);
  const { user } = useAuthStore();
  const isTeacher = user?.role === 'TEACHER';

  const sectionedOrderedRows = useMemo(
    () => (sectionedCalendarList ? buildTeacherCalendarOrderedRows(lessons) : []),
    [lessons, sectionedCalendarList],
  );

  const sectionedLessonsKey = useMemo(() => lessons.map((l) => l.id).join('|'), [lessons]);

  useEffect(() => {
    if (sectionedCalendarList) {
      setSectionedListPage(1);
    }
  }, [sectionedCalendarList, sectionedLessonsKey]);

  const sectionedTotalPages = Math.max(
    1,
    Math.ceil(sectionedOrderedRows.length / TEACHER_CALENDAR_LIST_PAGE_SIZE),
  );

  useEffect(() => {
    if (sectionedCalendarList && sectionedListPage > sectionedTotalPages) {
      setSectionedListPage(sectionedTotalPages);
    }
  }, [sectionedCalendarList, sectionedListPage, sectionedTotalPages]);

  const sectionedPageRows = useMemo(() => {
    if (!sectionedCalendarList) return [];
    return sectionedOrderedRows.slice(
      (sectionedListPage - 1) * TEACHER_CALENDAR_LIST_PAGE_SIZE,
      sectionedListPage * TEACHER_CALENDAR_LIST_PAGE_SIZE,
    );
  }, [sectionedCalendarList, sectionedOrderedRows, sectionedListPage]);

  const sectionedPageLessonIds = useMemo(
    () => sectionedPageRows.map((r) => r.lesson.id),
    [sectionedPageRows],
  );

  const scheduleCategoryLabels = useMemo(
    () => ({
      upcoming: tCal('scheduleStatusUpcoming'),
      upcomingNext: tCal('scheduleStatusNext'),
      today: tCal('scheduleStatusToday'),
      completed: tCal('scheduleStatusCompleted'),
      todayPastSlot: tCal('scheduleTodayPastSlot'),
    }),
    [tCal],
  );

  // Sort lessons: Respect server-side sort order when sorting by scheduledAt
  // Otherwise, apply completion status grouping
  const sortedLessons = useMemo(() => {
    const sorted = [...lessons];
    
    // If explicitly sorting by scheduledAt, respect the server sort order
    if (sortBy === 'scheduledAt' && sortOrder) {
      sorted.sort((a, b) => {
        const aTime = new Date(a.scheduledAt).getTime();
        const bTime = new Date(b.scheduledAt).getTime();
        // Apply completion status grouping as secondary sort
        if (a.completionStatus === 'DONE' && b.completionStatus !== 'DONE') return 1;
        if (a.completionStatus !== 'DONE' && b.completionStatus === 'DONE') return -1;
        // Then sort by scheduledAt according to sortOrder
        return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
      });
    } else {
      // Default behavior: Done lessons go to bottom, then sort by scheduledAt desc
      sorted.sort((a, b) => {
        // If both have completionStatus, Done goes to bottom
        if (a.completionStatus === 'DONE' && b.completionStatus !== 'DONE') return 1;
        if (a.completionStatus !== 'DONE' && b.completionStatus === 'DONE') return -1;
        // If both are IN_PROCESS or both are Done, maintain original order (by scheduledAt)
        const aTime = new Date(a.scheduledAt).getTime();
        const bTime = new Date(b.scheduledAt).getTime();
        return bTime - aTime; // Most recent first within same status
      });
    }
    
    return sorted;
  }, [lessons, sortBy, sortOrder]);

  const lessonIdSet = useMemo(() => new Set(lessons.map((l) => l.id)), [lessons]);

  useEffect(() => {
    setSelectedLessons((prev) => {
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (lessonIdSet.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [lessonIdSet]);

  const handleSelectAll = (checked: boolean) => {
    if (sectionedCalendarList) {
      if (checked) {
        setSelectedLessons(new Set(sectionedPageLessonIds));
      } else {
        setSelectedLessons(new Set());
      }
      return;
    }
    if (checked) {
      setSelectedLessons(new Set(lessons.map((l) => l.id)));
    } else {
      setSelectedLessons(new Set());
    }
  };

  const handleSelectLesson = (lessonId: string, checked: boolean) => {
    const newSelected = new Set(selectedLessons);
    if (checked) {
      newSelected.add(lessonId);
    } else {
      newSelected.delete(lessonId);
    }
    setSelectedLessons(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedLessons.size > 0 && onBulkDelete) {
      onBulkDelete(Array.from(selectedLessons));
      // Don't clear selection here - let parent handle it after confirmation
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <p className="text-slate-500">{tCal('noLessons')}</p>
      </div>
    );
  }

  const tableColSpan =
    10 + (sectionedCalendarList ? 1 : 0) + (hideTeacherColumn ? 0 : 1);

  const allSelected = sectionedCalendarList
    ? sectionedPageLessonIds.length > 0 && sectionedPageLessonIds.every((id) => selectedLessons.has(id))
    : lessons.length > 0 && selectedLessons.size === lessons.length;
  const someSelected = sectionedCalendarList
    ? sectionedPageLessonIds.some((id) => selectedLessons.has(id)) && !allSelected
    : selectedLessons.size > 0 && selectedLessons.size < lessons.length;
  const showBulkBar = onBulkDelete && (showBulkBarWhenEmpty || selectedLessons.size > 0);
  const bulkDeleteDisabled = selectedLessons.size === 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Bulk Actions */}
      {showBulkBar && (
        <div className="px-6 py-3 bg-blue-50 border-b border-slate-200 flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-blue-900">
            {selectedLessons.size === 0
              ? tCal('bulkSelectHint')
              : tCal('lessonsSelected', { count: selectedLessons.size })}
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={bulkDeleteDisabled}
          >
            {tCal('deleteSelected')}
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={handleSelectAll}
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                {tCal('columnLessonName')}
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase w-[120px]">
                {tCommon('status')}
              </th>
              {sectionedCalendarList && (
                <th className="px-3 py-3 text-center text-xs font-semibold text-slate-600 uppercase min-w-[7rem]">
                  {tCal('scheduleCategoryColumn')}
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                {!sectionedCalendarList && onSort ? (
                  <button
                    type="button"
                    onClick={() => onSort('scheduledAt')}
                    className={cn(
                      'flex items-center gap-1.5 w-full text-left text-xs font-semibold uppercase hover:bg-slate-50 rounded-md px-0 py-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1',
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
                          <ArrowUp className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                      )}
                    </span>
                  </button>
                ) : (
                  tCal('columnDateTime')
                )}
              </th>
              {!hideTeacherColumn && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  {tCommon('teacher')}
                </th>
              )}
              <th className="px-2 py-3 text-center text-xs font-semibold text-slate-600 uppercase w-[100px]">
                {tActions('absenceLabel')}
              </th>
              <th className="px-2 py-3 text-center text-xs font-semibold text-slate-600 uppercase w-[100px]">
                {tActions('feedbackLabel')}
              </th>
              <th className="px-2 py-3 text-center text-xs font-semibold text-slate-600 uppercase w-[100px]">
                {tActions('voiceLabel')}
              </th>
              <th className="px-2 py-3 text-center text-xs font-semibold text-slate-600 uppercase w-[100px]">
                {tActions('textLabel')}
              </th>
              <th className="px-2 py-3 text-center text-xs font-semibold text-slate-600 uppercase w-[100px]">
                {tActions('dailyPlanLabel')}
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">
                {tCommon('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sectionedCalendarList
              ? sectionedPageRows.flatMap((row, idx) => {
                  const globalIdx = (sectionedListPage - 1) * TEACHER_CALENDAR_LIST_PAGE_SIZE + idx;
                  const prevGlobal = globalIdx > 0 ? sectionedOrderedRows[globalIdx - 1] : undefined;
                  const section = teacherCalendarRowSection(row.category);
                  const prevSection = prevGlobal ? teacherCalendarRowSection(prevGlobal.category) : null;
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
                        className="bg-slate-100/95 border-y border-slate-200"
                      >
                        <td
                          colSpan={tableColSpan}
                          className="px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-700"
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
                      locale={locale}
                      hideTeacherColumn={hideTeacherColumn}
                      isTeacher={isTeacher}
                      isSelected={selectedLessons.has(row.lesson.id)}
                      onSelectLesson={handleSelectLesson}
                      dateStatus={getScheduleCardDayStatus(row.lesson.scheduledAt)}
                      onObligationClick={onObligationClick}
                      onComplete={onComplete}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onAssignSubstitute={onAssignSubstitute}
                      scheduleCategory={row.category}
                      scheduleCategoryLabels={scheduleCategoryLabels}
                    />,
                  );
                  return nodes;
                })
              : sortedLessons.map((lesson) => (
                  <LessonListTableBodyRow
                    key={lesson.id}
                    lesson={lesson}
                    locale={locale}
                    hideTeacherColumn={hideTeacherColumn}
                    isTeacher={isTeacher}
                    isSelected={selectedLessons.has(lesson.id)}
                    onSelectLesson={handleSelectLesson}
                    dateStatus={getScheduleCardDayStatus(lesson.scheduledAt)}
                    onObligationClick={onObligationClick}
                    onComplete={onComplete}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onAssignSubstitute={onAssignSubstitute}
                    scheduleCategoryLabels={scheduleCategoryLabels}
                  />
                ))}
          </tbody>
        </table>
      </div>
      {sectionedCalendarList && sectionedTotalPages > 1 && (
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center text-sm text-slate-600 sm:text-left">
            {tCal('paginationSummary', {
              showingFrom: (sectionedListPage - 1) * TEACHER_CALENDAR_LIST_PAGE_SIZE + 1,
              showingTo: Math.min(
                sectionedListPage * TEACHER_CALENDAR_LIST_PAGE_SIZE,
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
              onClick={() => setSectionedListPage((p) => Math.max(1, p - 1))}
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
              onClick={() => setSectionedListPage((p) => Math.min(sectionedTotalPages, p + 1))}
              aria-label={tCal('paginationNext')}
            >
              <span className="hidden sm:inline">{tCal('paginationNext')}</span>
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

