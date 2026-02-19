'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { LessonListTable } from '@/shared/components/calendar/LessonListTable';
import { AddCourseForm } from '@/features/lessons/components/AddCourseForm';
import { EditLessonForm } from '@/features/lessons/components/EditLessonForm';
import { BulkDeleteConfirmationDialog } from '@/features/lessons/components/BulkDeleteConfirmationDialog';
import { CompleteLessonDialog } from '@/features/lessons/components/CompleteLessonDialog';
import { useTranslations } from 'next-intl';
import { useCalendarNavigation } from './hooks/useCalendarNavigation';
import { useCalendarData } from './hooks/useCalendarData';
import { useLessonActions } from './hooks/useLessonActions';
import { CalendarHeader } from './components/CalendarHeader';
import { CalendarControls } from './components/CalendarControls';
import { CalendarLegend } from './components/CalendarLegend';
import { WeekView } from './components/WeekView';
import { MonthView } from './components/MonthView';
import { CalendarMessages } from './components/CalendarMessages';

export default function TeacherCalendarPage() {
  const router = useRouter();
  const t = useTranslations('calendar');
  const tCommon = useTranslations('common');
  
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('scheduledAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Navigation hook
  const {
    viewMode,
    currentDate,
    updateViewModeInUrl,
    goToToday,
    navigate,
  } = useCalendarNavigation();

  // Data hook
  const {
    lessons,
    lessonsByDate,
    isLoading,
    refetch,
    weekDates,
    monthDates,
  } = useCalendarData({
    viewMode,
    currentDate,
    sortBy,
    sortOrder,
  });

  // Lesson actions hook
  const {
    selectedLessonIds,
    isBulkDeleteDialogOpen,
    handleBulkDeleteDialogClose,
    bulkDeleteError,
    bulkDeleteSuccess,
    deletedCount,
    handleBulkDeleteClick,
    handleBulkDeleteConfirm,
    isBulkDeleteLoading,
    completingLessonId,
    isCompleteDialogOpen,
    handleCompleteDialogClose,
    completeError,
    completeSuccess,
    handleCompleteClick,
    handleCompleteConfirm,
    isCompleteLoading,
  } = useLessonActions(refetch);

  // Handle sorting
  const handleSort = (key: string) => {
    if (sortBy === key) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort column and default to ascending
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  return (
    <DashboardLayout
      title={t('title') || 'My Calendar'}
      subtitle={t('subtitle') || 'View your teaching schedule.'}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <CalendarHeader
          viewMode={viewMode}
          currentDate={currentDate}
          weekDates={weekDates}
          onNavigate={navigate}
          onGoToToday={goToToday}
          t={t}
        />
        <CalendarControls
          viewMode={viewMode}
          onViewModeChange={updateViewModeInUrl}
          onAddCourse={viewMode === 'list' ? () => setIsAddCourseOpen(true) : undefined}
          t={t}
        />
      </div>

      {/* Legend */}
      {viewMode !== 'list' && <CalendarLegend t={t} />}

      {/* Calendar */}
      {viewMode === 'list' ? (
        <>
          <LessonListTable
            lessons={lessons}
            isLoading={isLoading}
            onEdit={(lessonId) => setEditingLessonId(lessonId)}
            onComplete={handleCompleteClick}
            onObligationClick={(lessonId, obligation) => {
              router.push(`/teacher/calendar/${lessonId}?tab=${obligation}`);
            }}
            onBulkDelete={handleBulkDeleteClick}
            hideTeacherColumn={true}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
          <AddCourseForm
            open={isAddCourseOpen}
            onOpenChange={setIsAddCourseOpen}
          />
          {editingLessonId && (
            <EditLessonForm
              open={!!editingLessonId}
              onOpenChange={(open) => {
                if (!open) {
                  setEditingLessonId(null);
                }
              }}
              lessonId={editingLessonId}
            />
          )}
          <BulkDeleteConfirmationDialog
            open={isBulkDeleteDialogOpen}
            onOpenChange={handleBulkDeleteDialogClose}
            onConfirm={handleBulkDeleteConfirm}
            lessonCount={selectedLessonIds.length}
            isLoading={isBulkDeleteLoading}
            error={bulkDeleteError}
          />
        </>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {viewMode === 'week' ? (
            <WeekView
              weekDates={weekDates}
              lessonsByDate={lessonsByDate}
              onComplete={handleCompleteClick}
              isLoading={isLoading}
              t={tCommon}
            />
          ) : (
            <MonthView
              monthDates={monthDates}
              lessonsByDate={lessonsByDate}
              onComplete={handleCompleteClick}
              isLoading={isLoading}
              t={tCommon}
            />
          )}
        </div>
      )}

      {/* Complete Lesson Dialog */}
      <CompleteLessonDialog
        open={isCompleteDialogOpen}
        onOpenChange={handleCompleteDialogClose}
        onConfirm={handleCompleteConfirm}
        lessonName={
          completingLessonId
            ? lessons.find((l) => l.id === completingLessonId)?.group?.name || undefined
            : undefined
        }
        isLoading={isCompleteLoading}
        error={completeError}
      />

      {/* Success/Error Messages */}
      <CalendarMessages
        bulkDeleteSuccess={bulkDeleteSuccess}
        bulkDeleteError={bulkDeleteError}
        deletedCount={deletedCount}
        completeSuccess={completeSuccess}
        isBulkDeleteDialogOpen={isBulkDeleteDialogOpen}
      />
    </DashboardLayout>
  );
}
