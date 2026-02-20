'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { getWeekDates } from '@/features/attendance/utils/dateUtils';
import { useAttendanceData } from './hooks/useAttendanceData';
import { useAttendanceNavigation } from './hooks/useAttendanceNavigation';
import { AttendanceControls } from './components/AttendanceControls';
import { SaveMessages } from './components/SaveMessages';
import { AttendanceEmptyGroupState } from './components/AttendanceEmptyGroupState';
import { MonthViewCalendar } from './components/MonthViewCalendar';
import { DayView } from './components/DayView';
import { WeekView } from './components/WeekView';
import { MonthView } from './components/MonthView';

export default function AdminAttendanceRegisterPage() {
  const t = useTranslations('attendance');
  const [saveMessages, setSaveMessages] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use navigation hook - this manages URL state and navigation
  // Start with empty data, will be updated after data loads
  const [tempHasUnsavedChanges, setTempHasUnsavedChanges] = useState(false);
  const nav = useAttendanceNavigation({
    groups: [],
    todayLessons: [],
    hasUnsavedChanges: tempHasUnsavedChanges,
  });

  // Use data hook - this fetches data based on navigation state
  const data = useAttendanceData({
    viewMode: nav.viewMode,
    currentDate: nav.currentDate,
    selectedGroupId: nav.selectedGroupId, // For backward compatibility
    selectedGroupIds: nav.selectedGroupIds, // New multi-select support
    selectedDayForMonthView: nav.selectedDayForMonthView,
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
  }, [data.todayLessons, data.groups, nav.selectedGroupIds, data.hasAutoSelectedGroup]);

  // Get week dates for week view
  const weekDates = useMemo(() => {
    if (nav.viewMode === 'week') {
      return getWeekDates(nav.currentDate);
    }
    return [];
  }, [nav.viewMode, nav.currentDate]);

  // Handle save success
  const handleSaveSuccess = (_id: string) => {
    setSaveMessages({ type: 'success', message: 'Attendance saved successfully' });
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    messageTimeoutRef.current = setTimeout(() => {
      setSaveMessages(null);
    }, 3000);
  };

  // Handle save error
  const handleSaveError = (id: string, error: string) => {
    setSaveMessages({ type: 'error', message: `Failed to save attendance: ${error}` });
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    messageTimeoutRef.current = setTimeout(() => {
      setSaveMessages(null);
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

  // For backward compatibility, get first selected group
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
        />

        {/* Month View Calendar */}
        {nav.viewMode === 'month' &&
          nav.selectedGroupIds.length > 0 &&
          data.students.length > 0 && (
            <MonthViewCalendar
              currentDate={nav.currentDate}
              selectedGroup={selectedGroup}
              selectedDayForMonthView={nav.selectedDayForMonthView}
              lessonsByDate={data.lessonsByDate}
              hasUnsavedChanges={data.hasUnsavedChanges}
              onDaySelect={nav.handleDaySelect}
            />
          )}

        {/* Day View */}
        {nav.selectedGroupIds.length > 0 &&
          data.students.length > 0 &&
          nav.viewMode === 'day' && (
            <DayView
              group={selectedGroup}
              groups={data.groups}
              selectedGroupIds={nav.selectedGroupIds}
              currentDate={nav.currentDate}
              students={data.students}
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
        {nav.selectedGroupIds.length > 0 &&
          data.students.length > 0 &&
          nav.viewMode === 'week' && (
            <WeekView
              group={selectedGroup}
              groups={data.groups}
              selectedGroupIds={nav.selectedGroupIds}
              currentDate={nav.currentDate}
              students={data.students}
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

        {/* Month View - Selected Day Grid */}
        {nav.viewMode === 'month' &&
          nav.selectedGroupIds.length > 0 &&
          data.students.length > 0 &&
          nav.selectedDayForMonthView && (
            <MonthView
              group={selectedGroup}
              groups={data.groups}
              selectedGroupIds={nav.selectedGroupIds}
              currentDate={nav.currentDate}
              selectedDayForMonthView={nav.selectedDayForMonthView}
              students={data.students}
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

        {/* Empty State */}
        {nav.selectedGroupIds.length === 0 && <AttendanceEmptyGroupState />}
      </div>
    </DashboardLayout>
  );
}
