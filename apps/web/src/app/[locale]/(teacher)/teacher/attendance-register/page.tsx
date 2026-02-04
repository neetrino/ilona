'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/shared/lib/utils';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { AttendanceGrid, ViewModeSelector } from '@/shared/components/attendance';
import { Button } from '@/shared/components/ui/button';
import { useGroups } from '@/features/groups';
import { useLessons, useTodayLessons } from '@/features/lessons';
import { useStudents } from '@/features/students';
import { useMarkBulkAttendance, attendanceKeys, type AbsenceType } from '@/features/attendance';
import { useQueries } from '@tanstack/react-query';
import { fetchLessonAttendance } from '@/features/attendance/api/attendance.api';
import {
  type ViewMode,
  getTodayDate,
  getWeekStart,
  getWeekEnd,
  getWeekDates,
  getMonthStart,
  getMonthEnd,
  getMonthDates,
  getPreviousWeek,
  getNextWeek,
  getPreviousMonth,
  getNextMonth,
  formatDateString,
  formatDateDisplay,
  formatWeekRange,
  formatMonthDisplay,
  isToday,
  isCurrentMonth,
} from '@/features/attendance/utils/dateUtils';

type AttendanceStatus = 'present' | 'absent_justified' | 'absent_unjustified' | 'not_marked';

interface AttendanceCell {
  studentId: string;
  lessonId: string;
  status: AttendanceStatus;
  isPresent: boolean;
  absenceType?: AbsenceType;
}

export default function TeacherAttendanceRegisterPage() {
  const router = useRouter();
  
  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  
  // Date state
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [savingLessons, setSavingLessons] = useState<Record<string, boolean>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveMessages, setSaveMessages] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasAutoSelectedGroup = useRef(false);
  const [selectedDayForMonthView, setSelectedDayForMonthView] = useState<string | null>(null);

  // Fetch teacher's groups (backend filters automatically)
  const { data: groupsData, isLoading: isLoadingGroups } = useGroups({ take: 100, isActive: true });
  const groups = groupsData?.items || [];

  // Fetch today's lessons to auto-select group
  const { data: todayLessonsData } = useTodayLessons();
  const todayLessons = todayLessonsData || [];

  // Auto-select first group with a lesson today on initial load
  useEffect(() => {
    if (!hasAutoSelectedGroup.current && todayLessons.length > 0 && groups.length > 0 && !selectedGroupId) {
      const groupWithLesson = groups.find((group) =>
        todayLessons.some((lesson) => lesson.groupId === group.id)
      );
      if (groupWithLesson) {
        setSelectedGroupId(groupWithLesson.id);
        hasAutoSelectedGroup.current = true;
      }
    }
  }, [todayLessons, groups, selectedGroupId]);

  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    if (viewMode === 'day') {
      const dateStr = formatDateString(currentDate);
      return { from: dateStr, to: dateStr };
    } else if (viewMode === 'week') {
      const weekStart = getWeekStart(currentDate);
      const weekEnd = getWeekEnd(currentDate);
      return { from: formatDateString(weekStart), to: formatDateString(weekEnd) };
    } else {
      const monthStart = getMonthStart(currentDate);
      const monthEnd = getMonthEnd(currentDate);
      return { from: formatDateString(monthStart), to: formatDateString(monthEnd) };
    }
  }, [viewMode, currentDate]);

  // For month view with selected day, use that day
  const effectiveDateRange = useMemo(() => {
    if (viewMode === 'month' && selectedDayForMonthView) {
      return { from: selectedDayForMonthView, to: selectedDayForMonthView };
    }
    return dateRange;
  }, [viewMode, dateRange, selectedDayForMonthView]);

  // Fetch lessons for selected group and date range
  // Use UTC dates to avoid timezone shifts
  const { data: lessonsData, isLoading: isLoadingLessons } = useLessons({
    groupId: selectedGroupId || undefined,
    dateFrom: effectiveDateRange.from ? new Date(effectiveDateRange.from + 'T00:00:00Z').toISOString() : undefined,
    dateTo: effectiveDateRange.to ? new Date(effectiveDateRange.to + 'T23:59:59Z').toISOString() : undefined,
    take: 1000,
  });
  const lessons = lessonsData?.items || [];

  // Filter lessons based on view mode
  const filteredLessons = useMemo(() => {
    if (!selectedGroupId) return [];
    
    if (viewMode === 'day') {
      const dateStr = formatDateString(currentDate);
      return lessons.filter((lesson) => {
        const lessonDate = new Date(lesson.scheduledAt).toISOString().split('T')[0];
        return lessonDate === dateStr;
      });
    } else if (viewMode === 'week') {
      const weekStart = getWeekStart(currentDate);
      const weekEnd = getWeekEnd(currentDate);
      const weekStartStr = formatDateString(weekStart);
      const weekEndStr = formatDateString(weekEnd);
      return lessons.filter((lesson) => {
        const lessonDate = new Date(lesson.scheduledAt).toISOString().split('T')[0];
        return lessonDate >= weekStartStr && lessonDate <= weekEndStr;
      });
    } else {
      if (selectedDayForMonthView) {
        return lessons.filter((lesson) => {
          const lessonDate = new Date(lesson.scheduledAt).toISOString().split('T')[0];
          return lessonDate === selectedDayForMonthView;
        });
      }
      return [];
    }
  }, [lessons, viewMode, currentDate, selectedGroupId, selectedDayForMonthView]);

  // Fetch students for selected group
  const { data: studentsData, isLoading: isLoadingStudents } = useStudents({
    groupId: selectedGroupId || undefined,
    take: 100,
  });
  const students = studentsData?.items || [];

  // Fetch attendance for filtered lessons
  const attendanceQueries = useQueries({
    queries: filteredLessons.map((lesson) => ({
      queryKey: attendanceKeys.lesson(lesson.id),
      queryFn: () => fetchLessonAttendance(lesson.id),
      enabled: !!selectedGroupId && filteredLessons.length > 0,
    })),
  });

  const isLoadingAttendance = attendanceQueries.some((q) => q.isLoading);

  // Transform attendance data for grid
  const attendanceData = useMemo(() => {
    const data: Record<string, Record<string, AttendanceCell>> = {};

    filteredLessons.forEach((lesson, index) => {
      const query = attendanceQueries[index];
      if (query?.data?.studentsWithAttendance) {
        const lessonData: Record<string, AttendanceCell> = {};
        query.data.studentsWithAttendance.forEach((s) => {
          if (s.attendance) {
            let status: AttendanceStatus = 'not_marked';
            if (s.attendance.isPresent) {
              status = 'present';
            } else if (s.attendance.absenceType === 'JUSTIFIED') {
              status = 'absent_justified';
            } else if (s.attendance.absenceType === 'UNJUSTIFIED') {
              status = 'absent_unjustified';
            }

            lessonData[s.student.id] = {
              studentId: s.student.id,
              lessonId: lesson.id,
              status,
              isPresent: s.attendance.isPresent,
              absenceType: s.attendance.absenceType || undefined,
            };
          }
        });
        data[lesson.id] = lessonData;
      }
    });

    return data;
  }, [filteredLessons, attendanceQueries]);

  // Helper function to go back to today
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDayForMonthView(null);
    if (todayLessons.length > 0 && groups.length > 0) {
      const groupWithLesson = groups.find((group) =>
        todayLessons.some((lesson) => lesson.groupId === group.id)
      );
      if (groupWithLesson) {
        setSelectedGroupId(groupWithLesson.id);
      }
    }
  };

  // Check if current date is today (for day view)
  const isCurrentDateToday = viewMode === 'day' && isToday(currentDate);

  // Confirmation helper
  const confirmWithUnsavedChanges = (message: string): boolean => {
    if (hasUnsavedChanges) {
      return window.confirm(message);
    }
    return true;
  };

  // Handle view mode change
  const handleViewModeChange = (newMode: ViewMode) => {
    if (!confirmWithUnsavedChanges(
      'You have unsaved changes. Are you sure you want to switch view mode? Your changes will be lost.'
    )) {
      return;
    }
    setViewMode(newMode);
    setSelectedDayForMonthView(null);
    if (newMode === 'day') {
      setCurrentDate(new Date());
    }
  };

  // Handle date change
  const handleDateChange = (newDate: string) => {
    if (!confirmWithUnsavedChanges(
      'You have unsaved changes. Are you sure you want to change the date? Your changes will be lost.'
    )) {
      return;
    }
    setCurrentDate(new Date(newDate));
    setSelectedDayForMonthView(null);
  };

  // Handle group change
  const handleGroupChange = (newGroupId: string | null) => {
    if (!confirmWithUnsavedChanges(
      'You have unsaved changes. Are you sure you want to switch groups? Your changes will be lost.'
    )) {
      return;
    }
    setSelectedGroupId(newGroupId);
    setSelectedDayForMonthView(null);
  };

  // Navigation handlers
  const handlePrevious = () => {
    if (!confirmWithUnsavedChanges(
      'You have unsaved changes. Are you sure you want to navigate? Your changes will be lost.'
    )) {
      return;
    }
    if (viewMode === 'week') {
      setCurrentDate(getPreviousWeek(currentDate));
    } else if (viewMode === 'month') {
      setCurrentDate(getPreviousMonth(currentDate));
      setSelectedDayForMonthView(null);
    }
  };

  const handleNext = () => {
    if (!confirmWithUnsavedChanges(
      'You have unsaved changes. Are you sure you want to navigate? Your changes will be lost.'
    )) {
      return;
    }
    if (viewMode === 'week') {
      setCurrentDate(getNextWeek(currentDate));
    } else if (viewMode === 'month') {
      setCurrentDate(getNextMonth(currentDate));
      setSelectedDayForMonthView(null);
    }
  };

  // Handle day selection in month view
  const handleDaySelect = (date: Date) => {
    if (!confirmWithUnsavedChanges(
      'You have unsaved changes. Are you sure you want to select a different day? Your changes will be lost.'
    )) {
      return;
    }
    const dateStr = formatDateString(date);
    setSelectedDayForMonthView(dateStr);
  };

  const markBulkAttendance = useMarkBulkAttendance();

  // Handle lesson save
  const handleLessonSave = async (
    lessonId: string,
    attendances: Array<{ studentId: string; isPresent: boolean; absenceType?: AbsenceType }>
  ) => {
    setSavingLessons((prev) => ({ ...prev, [lessonId]: true }));
    try {
      await markBulkAttendance.mutateAsync({
        lessonId,
        attendances,
      });
    } finally {
      setSavingLessons((prev) => {
        const next = { ...prev };
        delete next[lessonId];
        return next;
      });
    }
  };

  // Handle save success
  const handleSaveSuccess = (lessonId: string) => {
    setSaveMessages({ type: 'success', message: 'Attendance saved successfully' });
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    messageTimeoutRef.current = setTimeout(() => {
      setSaveMessages(null);
    }, 3000);
  };

  // Handle save error
  const handleSaveError = (lessonId: string, error: string) => {
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

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  // Calculate statistics
  const stats = useMemo(() => {
    let total = 0;
    let present = 0;
    let absent = 0;
    let notMarked = 0;

    students.forEach((student) => {
      filteredLessons.forEach((lesson) => {
        total++;
        const cell = attendanceData[lesson.id]?.[student.id];
        if (!cell) {
          notMarked++;
        } else if (cell.isPresent) {
          present++;
        } else {
          absent++;
        }
      });
    });

    return { total, present, absent, notMarked };
  }, [students, filteredLessons, attendanceData]);

  // Get month dates for month view
  const monthDates = useMemo(() => {
    if (viewMode === 'month') {
      return getMonthDates(currentDate);
    }
    return [];
  }, [viewMode, currentDate]);

  // Get lessons grouped by date for month view
  const lessonsByDate = useMemo(() => {
    if (viewMode !== 'month' || !selectedGroupId) return {};
    const grouped: Record<string, typeof lessons> = {};
    lessons.forEach((lesson) => {
      const lessonDate = new Date(lesson.scheduledAt).toISOString().split('T')[0];
      if (!grouped[lessonDate]) {
        grouped[lessonDate] = [];
      }
      grouped[lessonDate].push(lesson);
    });
    return grouped;
  }, [viewMode, lessons, selectedGroupId]);

  return (
    <DashboardLayout title="Attendance Register" subtitle="Mark and manage student attendance">
      <div className="space-y-6">
        {/* Save messages */}
        {saveMessages && (
          <div
            className={cn(
              'rounded-lg px-4 py-3 text-sm font-medium',
              saveMessages.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            )}
          >
            {saveMessages.message}
          </div>
        )}

        {/* View Mode Selector */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-slate-700">View Mode</label>
            <ViewModeSelector
              value={viewMode}
              onChange={handleViewModeChange}
              disabled={!selectedGroupId}
            />
          </div>

          {/* Selection Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Group Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Group</label>
              <select
                value={selectedGroupId || ''}
                onChange={(e) => {
                  handleGroupChange(e.target.value || null);
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoadingGroups}
              >
                <option value="">-- Select Group --</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} {group.level && `(${group.level})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Date/Week/Month Selection and Navigation */}
            <div>
              {viewMode === 'day' && (
                <>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Select Date</label>
                  <input
                    type="date"
                    value={formatDateString(currentDate)}
                    onChange={(e) => handleDateChange(e.target.value)}
                    max={getTodayDate()}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={!selectedGroupId}
                  />
                </>
              )}
              {viewMode === 'week' && (
                <>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Week</label>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handlePrevious}
                      variant="outline"
                      size="sm"
                      disabled={!selectedGroupId}
                      className="px-3"
                    >
                      ←
                    </Button>
                    <div className="flex-1 text-center px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm font-medium">
                      {formatWeekRange(currentDate)}
                    </div>
                    <Button
                      onClick={handleNext}
                      variant="outline"
                      size="sm"
                      disabled={!selectedGroupId}
                      className="px-3"
                    >
                      →
                    </Button>
                  </div>
                </>
              )}
              {viewMode === 'month' && (
                <>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Month</label>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handlePrevious}
                      variant="outline"
                      size="sm"
                      disabled={!selectedGroupId}
                      className="px-3"
                    >
                      ←
                    </Button>
                    <div className="flex-1 text-center px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm font-medium">
                      {formatMonthDisplay(currentDate)}
                    </div>
                    <Button
                      onClick={handleNext}
                      variant="outline"
                      size="sm"
                      disabled={!selectedGroupId}
                      className="px-3"
                    >
                      →
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* Back to Today Button */}
            <div className="flex items-end">
              <Button
                onClick={goToToday}
                disabled={isCurrentDateToday && viewMode === 'day'}
                variant={isCurrentDateToday && viewMode === 'day' ? 'outline' : 'default'}
                className="w-full"
              >
                {isCurrentDateToday && viewMode === 'day' ? 'Today' : 'Back to Today'}
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {selectedGroupId && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="text-sm text-slate-600">Total Sessions</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="text-sm text-slate-600">Present</div>
              <div className="text-2xl font-bold text-green-600 mt-1">{stats.present}</div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="text-sm text-slate-600">Absent</div>
              <div className="text-2xl font-bold text-red-600 mt-1">{stats.absent}</div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="text-sm text-slate-600">Not Marked</div>
              <div className="text-2xl font-bold text-slate-400 mt-1">{stats.notMarked}</div>
            </div>
          </div>
        )}

        {/* Month View Calendar */}
        {viewMode === 'month' && selectedGroupId && students.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {selectedGroup?.name || 'N/A'} - {formatMonthDisplay(currentDate)}
              </h3>
              {hasUnsavedChanges && (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 border-2 border-amber-400 rounded-lg inline-flex">
                  <div className="h-2 w-2 rounded-full bg-amber-600 animate-pulse"></div>
                  <span className="text-sm font-semibold text-amber-800">Unsaved Changes</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {/* Week day headers */}
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="text-center text-sm font-semibold text-slate-700 py-2">
                  {day}
                </div>
              ))}
              {/* Calendar days */}
              {monthDates.map((date, idx) => {
                const dateStr = formatDateString(date);
                const isInCurrentMonth = isCurrentMonth(date, currentDate);
                const dayLessons = lessonsByDate[dateStr] || [];
                const hasLessons = dayLessons.length > 0;
                const isSelected = selectedDayForMonthView === dateStr;
                const isTodayDate = isToday(date);

                return (
                  <button
                    key={idx}
                    onClick={() => hasLessons && handleDaySelect(date)}
                    disabled={!hasLessons}
                    className={cn(
                      'p-3 border-2 rounded-lg text-center transition-all min-h-[80px]',
                      !isInCurrentMonth && 'opacity-40',
                      isSelected && 'border-blue-600 bg-blue-50 ring-2 ring-blue-500',
                      !isSelected && hasLessons && 'border-slate-300 hover:border-blue-400 hover:bg-blue-50',
                      !hasLessons && 'border-slate-200 bg-slate-50 cursor-not-allowed',
                      isTodayDate && !isSelected && 'border-blue-300 bg-blue-50/50'
                    )}
                  >
                    <div className="text-sm font-semibold text-slate-900 mb-1">
                      {date.getDate()}
                      {isTodayDate && (
                        <span className="ml-1 text-xs text-blue-600 font-bold">Today</span>
                      )}
                    </div>
                    {hasLessons && (
                      <div className="text-xs text-slate-600 mt-1">
                        {dayLessons.length} {dayLessons.length === 1 ? 'session' : 'sessions'}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedDayForMonthView && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-600 mb-2">
                  Click a day above to view and edit attendance, or select a different day.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Attendance Grid - Day and Week Views */}
        {selectedGroupId && students.length > 0 && viewMode !== 'month' && (
          <div className="bg-white rounded-xl border-2 border-slate-300 p-6 shadow-sm">
            {/* Context Indicators */}
            <div className="mb-6 pb-4 border-b-2 border-slate-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Group:</span>
                      <span className="text-xl font-bold text-slate-900">{selectedGroup?.name || 'N/A'}</span>
                      {selectedGroup?.level && (
                        <span className="text-sm font-medium text-slate-600">({selectedGroup.level})</span>
                      )}
                    </div>
                    <div className="h-6 w-px bg-slate-300"></div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        {viewMode === 'day' ? 'Date:' : 'Week:'}
                      </span>
                      <span className="text-xl font-bold text-slate-900">
                        {viewMode === 'day'
                          ? formatDateDisplay(currentDate)
                          : formatWeekRange(currentDate)}
                      </span>
                      {isCurrentDateToday && viewMode === 'day' && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">Today</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span>
                      <span className="font-semibold">{filteredLessons.length}</span> {filteredLessons.length === 1 ? 'session' : 'sessions'}
                    </span>
                    <span>•</span>
                    <span>
                      <span className="font-semibold">{students.length}</span> {students.length === 1 ? 'student' : 'students'}
                    </span>
                  </div>
                </div>
                {hasUnsavedChanges && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 border-2 border-amber-400 rounded-lg">
                    <div className="h-2 w-2 rounded-full bg-amber-600 animate-pulse"></div>
                    <span className="text-sm font-semibold text-amber-800">Unsaved Changes</span>
                  </div>
                )}
              </div>
            </div>

            {isLoadingLessons || isLoadingStudents || isLoadingAttendance ? (
              <div className="flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                  <p className="mt-4 text-sm text-slate-500">
                    {isLoadingAttendance ? 'Loading attendance records...' : 'Loading lessons...'}
                  </p>
                </div>
              </div>
            ) : attendanceQueries.some((q) => q.isError) ? (
              <div className="text-center p-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-red-600 mb-1">Error loading attendance data</p>
                <p className="text-xs text-slate-500">Please try again or contact support if the problem persists</p>
              </div>
            ) : filteredLessons.length === 0 ? (
              <div className="text-center p-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-600 mb-1">No lessons found</p>
                <p className="text-xs text-slate-500">
                  {viewMode === 'day'
                    ? `No lessons scheduled for ${formatDateDisplay(currentDate)}`
                    : `No lessons scheduled for this ${viewMode}`}
                </p>
              </div>
            ) : (
              <AttendanceGrid
                students={students.map((s) => ({
                  id: s.id,
                  user: {
                    id: s.user.id,
                    firstName: s.user.firstName,
                    lastName: s.user.lastName,
                    avatarUrl: s.user.avatarUrl,
                  },
                }))}
                lessons={filteredLessons}
                initialAttendance={attendanceData}
                onLessonSave={handleLessonSave}
                isLoading={isLoadingAttendance}
                isSaving={savingLessons}
                dateRange={effectiveDateRange}
                onSaveSuccess={handleSaveSuccess}
                onSaveError={handleSaveError}
                onUnsavedChangesChange={setHasUnsavedChanges}
              />
            )}
          </div>
        )}

        {/* Month View - Selected Day Grid */}
        {viewMode === 'month' && selectedGroupId && students.length > 0 && selectedDayForMonthView && (
          <div className="bg-white rounded-xl border-2 border-slate-300 p-6 shadow-sm">
            <div className="mb-6 pb-4 border-b-2 border-slate-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Date:</span>
                      <span className="text-xl font-bold text-slate-900">
                        {formatDateDisplay(new Date(selectedDayForMonthView))}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span>
                      <span className="font-semibold">{filteredLessons.length}</span> {filteredLessons.length === 1 ? 'session' : 'sessions'}
                    </span>
                    <span>•</span>
                    <span>
                      <span className="font-semibold">{students.length}</span> {students.length === 1 ? 'student' : 'students'}
                    </span>
                  </div>
                </div>
                {hasUnsavedChanges && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 border-2 border-amber-400 rounded-lg">
                    <div className="h-2 w-2 rounded-full bg-amber-600 animate-pulse"></div>
                    <span className="text-sm font-semibold text-amber-800">Unsaved Changes</span>
                  </div>
                )}
              </div>
            </div>

            {isLoadingLessons || isLoadingStudents || isLoadingAttendance ? (
              <div className="flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                  <p className="mt-4 text-sm text-slate-500">
                    {isLoadingAttendance ? 'Loading attendance records...' : 'Loading lessons...'}
                  </p>
                </div>
              </div>
            ) : filteredLessons.length === 0 ? (
              <div className="text-center p-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-600 mb-1">No lessons found</p>
                <p className="text-xs text-slate-500">
                  No lessons scheduled for {formatDateDisplay(new Date(selectedDayForMonthView))}
                </p>
              </div>
            ) : (
              <AttendanceGrid
                students={students.map((s) => ({
                  id: s.id,
                  user: {
                    id: s.user.id,
                    firstName: s.user.firstName,
                    lastName: s.user.lastName,
                    avatarUrl: s.user.avatarUrl,
                  },
                }))}
                lessons={filteredLessons}
                initialAttendance={attendanceData}
                onLessonSave={handleLessonSave}
                isLoading={isLoadingAttendance}
                isSaving={savingLessons}
                dateRange={effectiveDateRange}
                onSaveSuccess={handleSaveSuccess}
                onSaveError={handleSaveError}
                onUnsavedChangesChange={setHasUnsavedChanges}
              />
            )}
          </div>
        )}

        {/* Empty State */}
        {!selectedGroupId && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Select Group and View Mode</h3>
            <p className="text-sm text-slate-500">Please select a group and view mode to view attendance</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
