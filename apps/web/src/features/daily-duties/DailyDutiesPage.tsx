'use client';

import { portalPageStackClass } from '@/shared/lib/portal-theme';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useTranslations } from 'next-intl';
import type { DailyDutiesMode } from './components/daily-duties.types';
import { useDailyDutiesPage } from './components/useDailyDutiesPage';
import { useDailyDutiesDeleteActions } from './components/useDailyDutiesDeleteActions';
import { DailyDutiesFiltersSection } from './components/DailyDutiesFiltersSection';
import { DailyDutiesStatsGrid } from './components/DailyDutiesStatsGrid';
import { DailyDutiesControls } from './components/DailyDutiesControls';
import { DailyDutiesWeekView } from './components/DailyDutiesWeekView';
import { DailyDutiesMonthView } from './components/DailyDutiesMonthView';
import { DailyDutiesListView } from './components/DailyDutiesListView';
import { DailyDutiesOverlays } from './components/DailyDutiesOverlays';

export type { DailyDutiesMode } from './components/daily-duties.types';

interface DailyDutiesPageProps {
  mode: DailyDutiesMode;
}

export function DailyDutiesPage({ mode }: DailyDutiesPageProps) {
  const t = useTranslations('dailyDuties');
  const dailyDuties = useDailyDutiesPage(mode);
  const deleteActions = useDailyDutiesDeleteActions(dailyDuties.lessons, t);

  const hasActiveFilters =
    Boolean(dailyDuties.searchQuery) ||
    Boolean(dailyDuties.selectedStatus) ||
    (!dailyDuties.isTeacherMode && dailyDuties.selectedTeacherIds.size > 0);

  const periodHeader =
    dailyDuties.viewMode === 'month' ? dailyDuties.monthHeader : dailyDuties.weekHeader;

  return (
    <DashboardLayout
      title={dailyDuties.isTeacherMode ? t('teacherDailyDutiesTitle') : t('adminTitle')}
      subtitle={dailyDuties.isTeacherMode ? t('teacherDailyDutiesSubtitle') : t('adminSubtitle')}
    >
      <div className={portalPageStackClass}>
        <DailyDutiesFiltersSection
          searchQuery={dailyDuties.searchQuery}
          selectedTeacherIds={dailyDuties.selectedTeacherIds}
          selectedStatus={dailyDuties.selectedStatus}
          teacherOptions={dailyDuties.teacherOptions}
          isLoadingTeachers={dailyDuties.isLoadingTeachers}
          hideTeacherFilter={dailyDuties.isTeacherMode}
          onSearchChange={dailyDuties.handleSearchChange}
          onTeacherChange={dailyDuties.handleTeacherChange}
          onStatusChange={dailyDuties.handleStatusChange}
        />

        <DailyDutiesStatsGrid stats={dailyDuties.stats} />

        <DailyDutiesControls
          viewMode={dailyDuties.viewMode}
          periodHeader={periodHeader}
          onNavigatePeriod={dailyDuties.navigatePeriod}
          onGoToToday={dailyDuties.goToToday}
          onViewModeChange={dailyDuties.updateViewModeInUrl}
          onAddLesson={
            dailyDuties.isTeacherMode
              ? undefined
              : () => dailyDuties.handleAddLessonOpenChange(true)
          }
        />

        {dailyDuties.viewMode === 'week' && (
          <DailyDutiesWeekView
            weekDates={dailyDuties.weekDates}
            lessonsByDate={dailyDuties.filteredLessonsByDate}
            isLoading={dailyDuties.isLoading}
            isTeacherMode={dailyDuties.isTeacherMode}
            hasActiveFilters={hasActiveFilters}
          />
        )}

        {dailyDuties.viewMode === 'month' && (
          <DailyDutiesMonthView
            monthDates={dailyDuties.monthDates}
            lessonsByDate={dailyDuties.filteredLessonsByDate}
            isLoading={dailyDuties.isLoading}
            onLessonClick={(lessonId) => dailyDuties.handleOpenLessonDetail(lessonId)}
          />
        )}

        {dailyDuties.viewMode === 'list' && (
          <DailyDutiesListView
            lessons={dailyDuties.listViewLessons}
            isLoading={dailyDuties.isListLoading}
            sortBy={dailyDuties.sortBy}
            sortOrder={dailyDuties.sortOrder}
            listReferenceDate={dailyDuties.listReferenceDate}
            isTeacherMode={dailyDuties.isTeacherMode}
            hasActiveFilters={hasActiveFilters}
            onSort={dailyDuties.handleSort}
            onBulkDelete={deleteActions.bulkDelete.onClick}
            onMobileCardClick={dailyDuties.handleMobileLessonCardClick}
            onObligationClick={dailyDuties.handleOpenLessonDetail}
            onDelete={dailyDuties.isTeacherMode ? undefined : deleteActions.singleDelete.onClick}
            onAssignSubstitute={
              dailyDuties.isTeacherMode ? undefined : dailyDuties.handleAssignSubstitute
            }
          />
        )}
      </div>

      <DailyDutiesOverlays
        isTeacherMode={dailyDuties.isTeacherMode}
        isAddLessonOpen={dailyDuties.isAddLessonOpen}
        onAddLessonOpenChange={dailyDuties.handleAddLessonOpenChange}
        substituteLessonModalOpen={dailyDuties.substituteLessonModalOpen}
        substituteLessonId={dailyDuties.substituteLessonId}
        onSubstituteLessonOpenChange={dailyDuties.handleSubstituteLessonOpenChange}
        teacherOptions={dailyDuties.teacherOptions}
        lessonDetailSheetOpen={dailyDuties.lessonDetailSheetOpen}
        lessonDetailSheetId={dailyDuties.lessonDetailSheetId}
        lessonDetailSheetTab={dailyDuties.lessonDetailSheetTab}
        onLessonDetailSheetOpenChange={dailyDuties.handleLessonDetailSheetOpenChange}
        bulkDelete={deleteActions.bulkDelete}
        singleDelete={deleteActions.singleDelete}
        deleteNotice={deleteActions.deleteNotice}
      />
    </DashboardLayout>
  );
}
