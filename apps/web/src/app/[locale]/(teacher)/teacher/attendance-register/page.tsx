'use client';

import { useState, useMemo, useEffect, useRef, startTransition } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { getWeekDates } from '@/features/attendance/utils/dateUtils';
import { useTeacherAttendanceData } from './hooks/useTeacherAttendanceData';
import { useTeacherAttendanceNavigation } from './hooks/useTeacherAttendanceNavigation';
import { AttendanceControls, type AbsenceFilterType } from '@/app/[locale]/(admin)/admin/attendance-register/components/AttendanceControls';
import { AttendanceStats } from '@/app/[locale]/(admin)/admin/attendance-register/components/AttendanceStats';
import { SaveMessages } from '@/app/[locale]/(admin)/admin/attendance-register/components/SaveMessages';
import { AttendanceEmptyGroupState } from '@/app/[locale]/(admin)/admin/attendance-register/components/AttendanceEmptyGroupState';
import { DayView } from '@/app/[locale]/(admin)/admin/attendance-register/components/DayView';
import { WeekView } from '@/app/[locale]/(admin)/admin/attendance-register/components/WeekView';
import { MonthView } from '@/app/[locale]/(admin)/admin/attendance-register/components/MonthView';

export default function TeacherAttendanceRegisterPage() {
  const t = useTranslations('attendance');
  const [saveMessages, setSaveMessages] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [absenceFilter, setAbsenceFilter] = useState<AbsenceFilterType>('all');

  // Use navigation hook - this manages navigation state
  const [tempHasUnsavedChanges, setTempHasUnsavedChanges] = useState(false);
  const nav = useTeacherAttendanceNavigation({
    groups: [],
    todayLessons: [],
    hasUnsavedChanges: tempHasUnsavedChanges,
  });

  // Use data hook - this fetches data based on navigation state
  const data = useTeacherAttendanceData({
    viewMode: nav.viewMode,
    currentDate: nav.currentDate,
    selectedGroupId: nav.selectedGroupId,
    selectedGroupIds: nav.selectedGroupIds,
    selectedDayForMonthView: nav.selectedDayForMonthView,
    absenceFilter,
  });

  // Update hasUnsavedChanges in navigation when data changes
  useEffect(() => {
    setTempHasUnsavedChanges(data.hasUnsavedChanges);
  }, [data.hasUnsavedChanges]);

  // Create a custom goToToday that uses actual data
  const goToToday = () => {
    nav.goToToday();
    if (data.todayLessons.length > 0 && data.groups.length > 0) {
      const groupWithLesson = data.groups.find((group) =>
        data.todayLessons.some((lesson) => lesson.groupId === group.id)
      );
      if (groupWithLesson) {
        nav.handleGroupsChange([groupWithLesson.id]);
      }
    }
  };

  // Auto-select first group with a lesson today on initial load
  useEffect(() => {
    if (
      !data.hasAutoSelectedGroup.current &&
      data.todayLessons.length > 0 &&
      data.groups.length > 0 &&
      nav.selectedGroupIds.length === 0
    ) {
      const groupWithLesson = data.groups.find((group) =>
        data.todayLessons.some((lesson) => lesson.groupId === group.id)
      );
      if (groupWithLesson) {
        nav.handleGroupsChange([groupWithLesson.id]);
        data.hasAutoSelectedGroup.current = true;
      }
    }
  }, [data.todayLessons, data.groups, nav.selectedGroupIds, data.hasAutoSelectedGroup, nav]);

  // Get week dates for week view
  const weekDates = useMemo(() => {
    if (nav.viewMode === 'week') {
      return getWeekDates(nav.currentDate);
    }
    return [];
  }, [nav.viewMode, nav.currentDate]);

  // Handle save success
  const handleSaveSuccess = (_id: string) => {
    setSaveMessages({ type: 'success', message: t('attendanceSaved') });
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    messageTimeoutRef.current = setTimeout(() => {
      startTransition(() => setSaveMessages(null));
    }, 3000);
  };

  // Handle save error
  const handleSaveError = (_id: string, error: string) => {
    setSaveMessages({ type: 'error', message: t('failedToSaveAttendance', { error }) });
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    messageTimeoutRef.current = setTimeout(() => {
      startTransition(() => setSaveMessages(null));
    }, 5000);
  };

  // Cleanup message timeout
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  const selectedGroup = nav.selectedGroupIds.length > 0
    ? data.groups.find((g) => g.id === nav.selectedGroupIds[0])
    : undefined;

  return (
    <DashboardLayout title={t('attendanceRegister')} subtitle={t('subtitle')}>
      <div className="space-y-6">
        {/* Save messages */}
        <SaveMessages saveMessages={saveMessages} />

        {/* Controls */}
        <AttendanceControls
          viewMode={nav.viewMode}
          currentDate={nav.currentDate}
          selectedGroupId={nav.selectedGroupId}
          selectedGroupIds={nav.selectedGroupIds}
          groups={data.groups}
          isLoadingGroups={data.isLoadingGroups}
          isCurrentDateToday={nav.isCurrentDateToday}
          onViewModeChange={nav.handleViewModeChange}
          onGroupChange={nav.handleGroupChange}
          onGroupsChange={nav.handleGroupsChange}
          onDateChange={nav.handleDateChange}
          onPrevious={nav.handlePrevious}
          onNext={nav.handleNext}
          onGoToToday={goToToday}
          showAbsenceTypeFilter={true}
          absenceFilter={absenceFilter}
          onAbsenceFilterChange={setAbsenceFilter}
        />

        {/* Statistics */}
        {nav.selectedGroupIds.length > 0 && <AttendanceStats stats={data.stats} />}

        {/* Empty State */}
        {nav.selectedGroupIds.length === 0 && (
          <AttendanceEmptyGroupState
            variant={!data.isLoadingGroups && data.groups.length === 0 ? 'no_groups' : 'no_selection'}
          />
        )}

        {/* Day View */}
        {nav.selectedGroupIds.length > 0 && data.students.length > 0 && nav.viewMode === 'day' && (
          <DayView
            group={selectedGroup}
            groups={data.groups}
            selectedGroupIds={nav.selectedGroupIds}
            currentDate={nav.currentDate}
            students={data.filteredStudents}
            filteredLessons={data.filteredLessons}
            attendanceData={data.attendanceData}
            attendanceQueries={data.attendanceQueries}
            isLoadingLessons={data.isLoadingLessons}
            isLoadingStudents={data.isLoadingStudents}
            isLoadingAttendance={data.isLoadingAttendance}
            savingLessons={data.savingLessons}
            hasUnsavedChanges={data.hasUnsavedChanges}
            effectiveDateRange={data.effectiveDateRange}
            onLessonSave={data.handleLessonSave}
            onSaveSuccess={handleSaveSuccess}
            onSaveError={handleSaveError}
            onUnsavedChangesChange={data.setHasUnsavedChanges}
            isCurrentDateToday={nav.isCurrentDateToday}
          />
        )}

        {/* Week View */}
        {nav.selectedGroupIds.length > 0 && data.students.length > 0 && nav.viewMode === 'week' && (
          <WeekView
            group={selectedGroup}
            groups={data.groups}
            selectedGroupIds={nav.selectedGroupIds}
            currentDate={nav.currentDate}
            students={data.filteredStudents}
            filteredLessons={data.filteredLessons}
            attendanceData={data.attendanceData}
            attendanceQueries={data.attendanceQueries}
            isLoadingLessons={data.isLoadingLessons}
            isLoadingStudents={data.isLoadingStudents}
            isLoadingAttendance={data.isLoadingAttendance}
            savingLessons={data.savingLessons}
            hasUnsavedChanges={data.hasUnsavedChanges}
            weekDates={weekDates}
            onDaySave={data.handleDaySave}
            onSaveSuccess={handleSaveSuccess}
            onSaveError={handleSaveError}
            onUnsavedChangesChange={data.setHasUnsavedChanges}
          />
        )}

        {/* Month View */}
        {nav.selectedGroupIds.length > 0 && data.students.length > 0 && nav.viewMode === 'month' && (
          <MonthView
            group={selectedGroup}
            groups={data.groups}
            selectedGroupIds={nav.selectedGroupIds}
            currentDate={nav.currentDate}
            selectedDayForMonthView={nav.selectedDayForMonthView}
            students={data.filteredStudents}
            filteredLessons={data.filteredLessons}
            attendanceData={data.attendanceData}
            isLoadingLessons={data.isLoadingLessons}
            isLoadingStudents={data.isLoadingStudents}
            isLoadingAttendance={data.isLoadingAttendance}
            savingLessons={data.savingLessons}
            hasUnsavedChanges={data.hasUnsavedChanges}
            effectiveDateRange={data.effectiveDateRange}
            lessonsByDate={data.lessonsByDate}
            onDaySelect={nav.handleDaySelect}
            onLessonSave={data.handleLessonSave}
            onSaveSuccess={handleSaveSuccess}
            onSaveError={handleSaveError}
            onUnsavedChangesChange={data.setHasUnsavedChanges}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
