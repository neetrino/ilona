'use client';

import { portalPageStackClass } from '@/shared/lib/portal-theme';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useTranslations } from 'next-intl';
import type { PortalCalendarMode } from './portal-calendar/portal-calendar.types';
import { usePortalCalendarPage } from './portal-calendar/usePortalCalendarPage';
import { usePortalCalendarDeleteActions } from './portal-calendar/usePortalCalendarDeleteActions';
import { PortalCalendarFiltersSection } from './portal-calendar/PortalCalendarFiltersSection';
import { PortalCalendarStatsGrid } from './portal-calendar/PortalCalendarStatsGrid';
import { PortalCalendarControls } from './portal-calendar/PortalCalendarControls';
import { PortalCalendarWeekView } from './portal-calendar/PortalCalendarWeekView';
import { PortalCalendarMonthView } from './portal-calendar/PortalCalendarMonthView';
import { PortalCalendarListView } from './portal-calendar/PortalCalendarListView';
import { PortalCalendarOverlays } from './portal-calendar/PortalCalendarOverlays';

export type { PortalCalendarMode } from './portal-calendar/portal-calendar.types';

interface PortalCalendarPageProps {
  mode: PortalCalendarMode;
}

export function PortalCalendarPage({ mode }: PortalCalendarPageProps) {
  const t = useTranslations('calendar');
  const calendar = usePortalCalendarPage(mode);
  const deleteActions = usePortalCalendarDeleteActions(calendar.lessons, t);

  const hasActiveFilters =
    Boolean(calendar.searchQuery) || (!calendar.isTeacherMode && Boolean(calendar.selectedTeacherId));

  const periodHeader = calendar.viewMode === 'month' ? calendar.monthHeader : calendar.weekHeader;

  return (
    <DashboardLayout
      title={calendar.isTeacherMode ? t('teacherDailyDutiesTitle') : t('adminTitle')}
      subtitle={calendar.isTeacherMode ? t('teacherDailyDutiesSubtitle') : t('adminSubtitle')}
    >
      <div className={portalPageStackClass}>
        <PortalCalendarFiltersSection
          searchQuery={calendar.searchQuery}
          selectedTeacherId={calendar.selectedTeacherId}
          teacherOptions={calendar.teacherOptions}
          isLoadingTeachers={calendar.isLoadingTeachers}
          hideTeacherFilter={calendar.isTeacherMode}
          onSearchChange={calendar.handleSearchChange}
          onTeacherChange={calendar.handleTeacherChange}
        />

        <PortalCalendarStatsGrid stats={calendar.stats} />

        <PortalCalendarControls
          viewMode={calendar.viewMode}
          periodHeader={periodHeader}
          onNavigatePeriod={calendar.navigatePeriod}
          onGoToToday={calendar.goToToday}
          onViewModeChange={calendar.updateViewModeInUrl}
          onAddLesson={() => calendar.handleAddLessonOpenChange(true)}
        />

        {calendar.viewMode === 'week' && (
          <PortalCalendarWeekView
            weekDates={calendar.weekDates}
            lessonsByDate={calendar.lessonsByDate}
            isLoading={calendar.isLoading}
            isTeacherMode={calendar.isTeacherMode}
            hasActiveFilters={hasActiveFilters}
          />
        )}

        {calendar.viewMode === 'month' && (
          <PortalCalendarMonthView
            monthDates={calendar.monthDates}
            lessonsByDate={calendar.lessonsByDate}
            isLoading={calendar.isLoading}
            portalBasePath={calendar.portalBasePath}
            router={calendar.router}
          />
        )}

        {calendar.viewMode === 'list' && (
          <PortalCalendarListView
            lessons={calendar.listViewLessons}
            isLoading={calendar.isListLoading}
            sortBy={calendar.sortBy}
            sortOrder={calendar.sortOrder}
            listReferenceDate={calendar.listReferenceDate}
            isTeacherMode={calendar.isTeacherMode}
            hasActiveFilters={hasActiveFilters}
            onSort={calendar.handleSort}
            onBulkDelete={deleteActions.bulkDelete.onClick}
            onMobileCardClick={calendar.handleMobileLessonCardClick}
            onObligationClick={calendar.handleOpenLessonDetail}
            onDelete={calendar.isTeacherMode ? undefined : deleteActions.singleDelete.onClick}
            onAssignSubstitute={calendar.isTeacherMode ? undefined : calendar.handleAssignSubstitute}
          />
        )}
      </div>

      <PortalCalendarOverlays
        isTeacherMode={calendar.isTeacherMode}
        isAddLessonOpen={calendar.isAddLessonOpen}
        onAddLessonOpenChange={calendar.handleAddLessonOpenChange}
        substituteLessonModalOpen={calendar.substituteLessonModalOpen}
        substituteLessonId={calendar.substituteLessonId}
        onSubstituteLessonOpenChange={calendar.handleSubstituteLessonOpenChange}
        teacherOptions={calendar.teacherOptions}
        lessonDetailSheetOpen={calendar.lessonDetailSheetOpen}
        lessonDetailSheetId={calendar.lessonDetailSheetId}
        lessonDetailSheetTab={calendar.lessonDetailSheetTab}
        onLessonDetailSheetOpenChange={calendar.handleLessonDetailSheetOpenChange}
        bulkDelete={deleteActions.bulkDelete}
        singleDelete={deleteActions.singleDelete}
        deleteNotice={deleteActions.deleteNotice}
      />
    </DashboardLayout>
  );
}
