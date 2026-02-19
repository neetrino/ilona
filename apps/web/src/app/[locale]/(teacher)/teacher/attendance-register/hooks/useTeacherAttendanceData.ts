import { useState, useMemo, useEffect, useRef } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useGroups } from '@/features/groups';
import { useLessons, useTodayLessons } from '@/features/lessons';
import { useStudents } from '@/features/students';
import { useMarkBulkAttendance, attendanceKeys, type AbsenceType } from '@/features/attendance';
import { fetchLessonAttendance } from '@/features/attendance/api/attendance.api';
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
  selectedGroupId: string | null;
  selectedDayForMonthView: string | null;
}

export function useTeacherAttendanceData({
  viewMode,
  currentDate,
  selectedGroupId,
  selectedDayForMonthView,
}: UseTeacherAttendanceDataProps) {
  const [savingLessons, setSavingLessons] = useState<Record<string, boolean>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const hasAutoSelectedGroup = useRef(false);

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
        // This will be handled by the parent component
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

  // Get lessons grouped by date for month view
  const lessonsByDate = useMemo(() => {
    if (viewMode !== 'month' || !selectedGroupId) return {};
    const grouped: Record<string, Lesson[]> = {};
    lessons.forEach((lesson) => {
      const lessonDate = new Date(lesson.scheduledAt).toISOString().split('T')[0];
      if (!grouped[lessonDate]) {
        grouped[lessonDate] = [];
      }
      grouped[lessonDate].push(lesson);
    });
    return grouped;
  }, [viewMode, lessons, selectedGroupId]);

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

