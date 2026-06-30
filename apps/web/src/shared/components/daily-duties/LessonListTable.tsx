'use client';

import { useTranslations } from 'next-intl';
import { AdminListPagination } from '@/shared/components/ui';
import { TEACHER_DAILY_DUTIES_LIST_PAGE_SIZE } from '@/shared/lib/daily-duties/teacher-daily-duties-list-order';
import { cn } from '@/shared/lib/utils';
import type { LessonListTableProps } from './lesson-list-table/lesson-list-table.types';
import { useLessonListTable } from './lesson-list-table/useLessonListTable';
import { LessonListTableBulkBar } from './lesson-list-table/LessonListTableBulkBar';
import { LessonListTableMobileCards } from './lesson-list-table/LessonListTableMobileCards';
import { LessonListTableDesktopTable } from './lesson-list-table/LessonListTableDesktopTable';

export type { LessonListTableProps } from './lesson-list-table/lesson-list-table.types';

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
  showScheduleColumn = true,
  useMobileCards = false,
  listReferenceDate,
  hideActionsColumn = false,
  onMobileCardClick,
}: LessonListTableProps) {
  const tCal = useTranslations('dailyDuties');
  const table = useLessonListTable({
    lessons,
    onBulkDelete,
    sortBy,
    sortOrder,
    sectionedCalendarList,
    useMobileCards,
    listReferenceDate,
    showBulkBarWhenEmpty,
    hideActionsColumn,
    hideTeacherColumn,
    showScheduleColumn,
  });

  if (isLoading) {
    return (
      <div className="rounded-[15px] border border-slate-200 bg-white p-12">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="rounded-[15px] border border-slate-200 bg-white p-12 text-center">
        <p className="text-slate-500">{tCal('noLessons')}</p>
      </div>
    );
  }

  const mobileCardOpensSheet = Boolean(onMobileCardClick);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-[15px] border border-slate-200 bg-white">
        {table.showBulkBar && (
          <LessonListTableBulkBar
            selectedCount={table.selectedLessons.size}
            allSelected={table.allSelected}
            hasSelectedLessons={table.hasSelectedLessons}
            onBulkDelete={table.handleBulkDelete}
          />
        )}

        <LessonListTableMobileCards
          isIPad={table.isIPad}
          useMobileCards={useMobileCards}
          cardRows={table.cardRows}
          mobilePaginatedCardRows={table.mobilePaginatedCardRows}
          mobileCardPageSize={table.mobileCardPageSize}
          safeMobileCardsPage={table.safeMobileCardsPage}
          mobileCardsStartRef={table.mobileCardsStartRef}
          sectionedCalendarList={sectionedCalendarList}
          selectedLessons={table.selectedLessons}
          isTeacher={table.isTeacher}
          mobileCardOpensSheet={mobileCardOpensSheet}
          onSelectLesson={table.handleSelectLesson}
          onMobileCardClick={onMobileCardClick}
          onObligationClick={onObligationClick}
          onAssignSubstitute={onAssignSubstitute}
          onDelete={onDelete}
          onView={table.handleView}
          onGoToPage={table.goToMobileCardsPage}
        />

        <LessonListTableDesktopTable
          useMobileCards={useMobileCards}
          isIPad={table.isIPad}
          sectionedCalendarList={sectionedCalendarList}
          showScheduleColumn={showScheduleColumn}
          hideTeacherColumn={hideTeacherColumn}
          hideActionsColumn={hideActionsColumn}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
          allSelected={table.allSelected}
          someSelected={table.someSelected}
          onSelectAll={table.handleSelectAll}
          selectedLessons={table.selectedLessons}
          onSelectLesson={table.handleSelectLesson}
          isTeacher={table.isTeacher}
          sectionedPageRows={table.sectionedPageRows}
          sectionedOrderedRows={table.sectionedOrderedRows}
          sectionedListPage={table.sectionedListPage}
          sortedLessons={table.sortedLessons}
          scheduleCategoryLabels={table.scheduleCategoryLabels}
          tableColSpan={table.tableColSpan}
          onObligationClick={onObligationClick}
          onComplete={onComplete}
          onEdit={onEdit}
          onDelete={onDelete}
          onAssignSubstitute={onAssignSubstitute}
          onView={table.handleView}
        />
      </div>

      {sectionedCalendarList ? (
        <AdminListPagination
          className={cn(
            useMobileCards && !table.isIPad && 'hidden sm:block',
            useMobileCards && table.isIPad && 'hidden',
          )}
          page={table.sectionedListPage - 1}
          pageSize={TEACHER_DAILY_DUTIES_LIST_PAGE_SIZE}
          totalItems={table.sectionedOrderedRows.length}
          onPageChange={(page) => table.setSectionedListPage(page + 1)}
          previousLabel={tCal('paginationPrevious')}
          nextLabel={tCal('paginationNext')}
        />
      ) : null}
    </div>
  );
}
