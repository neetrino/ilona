import { useState, useMemo, useEffect, useRef } from 'react';
import { useMyGroups } from '@/features/groups';
import { useLessons, useTodayLessons } from '@/features/lessons';
import { useStudents } from '@/features/students';
import { useMarkBulkAttendance, useBatchLessonAttendance, type AbsenceType } from '@/features/attendance';
import {
  getWeekStart,
  getWeekEnd,
  getMonthStart,
  getMonthEnd,
  formatDateString,
  type ViewMode,
} from '@/features/attendance/utils/dateUtils';
import type { Lesson } from '@/features/lessons';

type AttendanceStatus = 'present' | 'absent_justified' | 'absent_unjustified' | 'not_marked';

export interface AttendanceCell {
  studentId: string;
  lessonId: string;
  status: AttendanceStatus;
  isPresent: boolean;
  absenceType?: AbsenceType;
}

interface UseTeacherAttendanceDataProps {
  viewMode: ViewMode;
  currentDate: Date;
  selectedGroupId: string | null; // backward compatibility
  selectedGroupIds: string[];
  selectedDayForMonthView: string | null;
  /** When set, only students that have at least one cell matching this status are included. */
  absenceFilter?: 'all' | 'present' | 'absent_justified' | 'absent_unjustified' | 'not_marked' | 'no_session';
}

export function useTeacherAttendanceData({
  viewMode,
  currentDate,
  selectedGroupId,
  selectedGroupIds,
  selectedDayForMonthView,
  absenceFilter = 'all',
}: UseTeacherAttendanceDataProps) {
  const effectiveGroupIds = selectedGroupIds.length > 0
    ? selectedGroupIds
    : (selectedGroupId ? [selectedGroupId] : []);
  const [savingLessons, setSavingLessons] = useState<Record<string, boolean>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const hasAutoSelectedGroup = useRef(false);

  // Fetch teacher's groups (only groups assigned to this teacher)
  const { data: groupsData, isLoading: isLoadingGroups } = useMyGroups();
  const groups = groupsData || [];

  // Fetch today's lessons to auto-select group
  const { data: todayLessonsData } = useTodayLessons();
  const todayLessons = todayLessonsData || [];

  // Auto-select first group with a lesson today on initial load
  useEffect(() => {
    if (!hasAutoSelectedGroup.current && todayLessons.length > 0 && groups.length > 0 && effectiveGroupIds.length === 0) {
      const groupWithLesson = groups.find((group) =>
        todayLessons.some((lesson) => lesson.groupId === group.id)
      );
      if (groupWithLesson) {
        hasAutoSelectedGroup.current = true;
      }
    }
  }, [todayLessons, groups, effectiveGroupIds.length]);

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

  // Fetch lessons for selected groups and date range
  const { data: lessonsData, isLoading: isLoadingLessons } = useLessons({
    groupIds: effectiveGroupIds.length > 0 ? effectiveGroupIds : undefined,
    dateFrom: effectiveDateRange.from ? new Date(effectiveDateRange.from + 'T00:00:00Z').toISOString() : undefined,
    dateTo: effectiveDateRange.to ? new Date(effectiveDateRange.to + 'T23:59:59Z').toISOString() : undefined,
    take: 1000,
  });
  const lessons = lessonsData?.items || [];

  // Filter lessons based on view mode
  const filteredLessons = useMemo(() => {
    if (effectiveGroupIds.length === 0) return [];

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
  }, [lessons, viewMode, currentDate, effectiveGroupIds.length, selectedDayForMonthView]);

  // Fetch students for selected groups (teacher-scoped: backend GET /students enforces teacher's groups)
  const { data: studentsData, isLoading: isLoadingStudents } = useStudents({
    groupIds: effectiveGroupIds.length > 0 ? effectiveGroupIds : undefined,
    take: 100,
  });
  const students = studentsData?.items ?? [];

  // Fetch attendance for all filtered lessons in one batch request
  const lessonIds = useMemo(() => filteredLessons.map((l) => l.id), [filteredLessons]);
  const batchAttendanceQuery = useBatchLessonAttendance(
    lessonIds,
    effectiveGroupIds.length > 0 && filteredLessons.length > 0,
  );
  const batchAttendanceMap = batchAttendanceQuery.data ?? {};
  const isLoadingAttendance = batchAttendanceQuery.isLoading;

  // Compatibility: single-item array so existing UI (attendanceQueries.some(q => q.isError)) still works
  const attendanceQueries = useMemo(
    () => [{ isError: batchAttendanceQuery.isError, isLoading: batchAttendanceQuery.isLoading }],
    [batchAttendanceQuery.isError, batchAttendanceQuery.isLoading],
  );

  // Transform batch attendance data for grid
  const attendanceData = useMemo(() => {
    const data: Record<string, Record<string, AttendanceCell>> = {};

    filteredLessons.forEach((lesson) => {
      const lessonAttendance = batchAttendanceMap[lesson.id];
      if (lessonAttendance?.studentsWithAttendance) {
        const lessonData: Record<string, AttendanceCell> = {};
        lessonAttendance.studentsWithAttendance.forEach((s) => {
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
  }, [filteredLessons, batchAttendanceMap]);

  // Filter students by selected absence type (client-side)
  const filteredStudents = useMemo(() => {
    if (absenceFilter === 'all' || effectiveGroupIds.length === 0) return students;
    if (absenceFilter === 'no_session') return [];
    return students.filter((student) =>
      filteredLessons.some((lesson) => {
        const cell = attendanceData[lesson.id]?.[student.id];
        const status: AttendanceStatus = cell?.status ?? 'not_marked';
        return status === absenceFilter;
      })
    );
  }, [students, filteredLessons, attendanceData, absenceFilter, effectiveGroupIds.length]);

  // Get lessons grouped by date for month view
  const lessonsByDate = useMemo(() => {
    if (viewMode !== 'month' || effectiveGroupIds.length === 0) return {};
    const grouped: Record<string, Lesson[]> = {};
    lessons.forEach((lesson) => {
      const lessonDate = new Date(lesson.scheduledAt).toISOString().split('T')[0];
      if (!grouped[lessonDate]) {
        grouped[lessonDate] = [];
      }
      grouped[lessonDate].push(lesson);
    });
    return grouped;
  }, [viewMode, lessons, effectiveGroupIds.length]);

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

  const markBulkAttendance = useMarkBulkAttendance();

  // Handle lesson save (for day view)
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

  // Handle day save (for week view)
  const handleDaySave = async (
    date: string,
    attendances: Array<{ studentId: string; lessonId: string; isPresent: boolean; absenceType?: AbsenceType }>
  ) => {
    setSavingLessons((prev) => ({ ...prev, [date]: true }));
    try {
      // Group attendances by lessonId
      const attendancesByLesson: Record<string, Array<{ studentId: string; isPresent: boolean; absenceType?: AbsenceType }>> = {};
      attendances.forEach((att) => {
        if (!attendancesByLesson[att.lessonId]) {
          attendancesByLesson[att.lessonId] = [];
        }
        attendancesByLesson[att.lessonId].push({
          studentId: att.studentId,
          isPresent: att.isPresent,
          absenceType: att.absenceType,
        });
      });

      // Save all lessons for this date
      await Promise.all(
        Object.entries(attendancesByLesson).map(([lessonId, atts]) =>
          markBulkAttendance.mutateAsync({
            lessonId,
            attendances: atts,
          })
        )
      );
    } finally {
      setSavingLessons((prev) => {
        const next = { ...prev };
        delete next[date];
        return next;
      });
    }
  };

  return {
    groups,
    todayLessons,
    isLoadingGroups,
    lessons,
    filteredLessons,
    isLoadingLessons,
    students,
    filteredStudents,
    isLoadingStudents,
    attendanceData,
    attendanceQueries,
    isLoadingAttendance,
    lessonsByDate,
    stats,
    savingLessons,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    handleLessonSave,
    handleDaySave,
    hasAutoSelectedGroup,
    effectiveDateRange,
  };
}

