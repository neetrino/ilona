'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchLessonAttendance,
  fetchAttendanceByLessons,
  fetchStudentAttendance,
  fetchMyStudentCalendar,
  createMyPlannedAbsence,
  deleteMyPlannedAbsence,
  fetchStaffPlannedAbsences,
  markAttendance,
  markBulkAttendance,
  updateAbsenceType,
  fetchAtRiskStudents,
  fetchGroupAttendanceReport,
} from '../api/attendance.api';
import type { MarkAttendanceDto, BulkAttendanceDto, AbsenceType } from '../types';
import { financeKeys } from '@/features/finance/hooks';

// Query keys
export const attendanceKeys = {
  all: ['attendance'] as const,
  lesson: (lessonId: string) => [...attendanceKeys.all, 'lesson', lessonId] as const,
  lessons: (lessonIds: string[]) => [...attendanceKeys.all, 'lessons', [...lessonIds].sort()] as const,
  student: (studentId: string, dateFrom?: string, dateTo?: string) =>
    [...attendanceKeys.all, 'student', studentId, { dateFrom, dateTo }] as const,
  atRisk: () => [...attendanceKeys.all, 'at-risk'] as const,
  groupReport: (groupId: string, dateFrom: string, dateTo: string) =>
    [...attendanceKeys.all, 'report', groupId, { dateFrom, dateTo }] as const,
  myCalendar: (dateFrom?: string, dateTo?: string) =>
    [...attendanceKeys.all, 'my-calendar', { dateFrom, dateTo }] as const,
  staffPlanned: (dateFrom: string, dateTo: string) =>
    [...attendanceKeys.all, 'staff-planned', { dateFrom, dateTo }] as const,
};

/**
 * Hook to fetch attendance for multiple lessons in one request (batch)
 */
export function useBatchLessonAttendance(lessonIds: string[], enabled: boolean) {
  return useQuery({
    queryKey: attendanceKeys.lessons(lessonIds),
    queryFn: () => fetchAttendanceByLessons(lessonIds),
    enabled: enabled && lessonIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch lesson attendance
 */
export function useLessonAttendance(lessonId: string, enabled = true) {
  return useQuery({
    queryKey: attendanceKeys.lesson(lessonId),
    queryFn: () => fetchLessonAttendance(lessonId),
    enabled: enabled && !!lessonId,
  });
}

/**
 * Hook to fetch student attendance history
 */
export function useStudentAttendance(
  studentId: string,
  dateFrom?: string,
  dateTo?: string,
  enabled = true
) {
  return useQuery({
    queryKey: attendanceKeys.student(studentId, dateFrom, dateTo),
    queryFn: () => fetchStudentAttendance(studentId, dateFrom, dateTo),
    enabled: enabled && !!studentId,
    staleTime: 5 * 60 * 1000, // 5 minutes - attendance data doesn't change frequently
    retry: 2, // Retry up to 2 times on failure
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}

export function useMyStudentCalendar(dateFrom?: string, dateTo?: string, enabled = true) {
  return useQuery({
    queryKey: attendanceKeys.myCalendar(dateFrom, dateTo),
    queryFn: () => fetchMyStudentCalendar(dateFrom, dateTo),
    enabled,
    staleTime: 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useCreateMyPlannedAbsence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ date, comment }: { date: string; comment: string }) =>
      createMyPlannedAbsence(date, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}

export function useDeleteMyPlannedAbsence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMyPlannedAbsence(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}

export function useStaffPlannedAbsences(dateFrom: string, dateTo: string, enabled = true) {
  return useQuery({
    queryKey: attendanceKeys.staffPlanned(dateFrom, dateTo),
    queryFn: () => fetchStaffPlannedAbsences(dateFrom, dateTo),
    enabled: enabled && !!dateFrom && !!dateTo,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to mark single attendance
 */
export function useMarkAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MarkAttendanceDto) => markAttendance(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.lesson(data.lessonId) });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.atRisk() });
      // Invalidate salary queries to reflect immediate salary updates
      queryClient.invalidateQueries({ queryKey: financeKeys.salaries() });
      queryClient.invalidateQueries({ queryKey: financeKeys.salaryBreakdown('', '') });
    },
  });
}

/**
 * Hook to mark bulk attendance
 */
export function useMarkBulkAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkAttendanceDto) => markBulkAttendance(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.lesson(data.lessonId) });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.atRisk() });
      // Invalidate salary queries to reflect immediate salary updates
      queryClient.invalidateQueries({ queryKey: financeKeys.salaries() });
      queryClient.invalidateQueries({ queryKey: financeKeys.salaryBreakdown('', '') });
    },
  });
}

/**
 * Hook to update absence type
 */
export function useUpdateAbsenceType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      attendanceId,
      absenceType,
      note,
    }: {
      attendanceId: string;
      absenceType: AbsenceType;
      note?: string;
    }) => updateAbsenceType(attendanceId, absenceType, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}

/**
 * Hook to fetch at-risk students
 */
export function useAtRiskStudents() {
  return useQuery({
    queryKey: attendanceKeys.atRisk(),
    queryFn: () => fetchAtRiskStudents(),
  });
}

/**
 * Hook to fetch group attendance report
 */
export function useGroupAttendanceReport(
  groupId: string,
  dateFrom: string,
  dateTo: string,
  enabled = true
) {
  return useQuery({
    queryKey: attendanceKeys.groupReport(groupId, dateFrom, dateTo),
    queryFn: () => fetchGroupAttendanceReport(groupId, dateFrom, dateTo),
    enabled: enabled && !!groupId && !!dateFrom && !!dateTo,
  });
}
