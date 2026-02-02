'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchLessonAttendance,
  fetchStudentAttendance,
  markAttendance,
  markBulkAttendance,
  updateAbsenceType,
  fetchAtRiskStudents,
  fetchGroupAttendanceReport,
} from '../api/attendance.api';
import type { MarkAttendanceDto, BulkAttendanceDto, AbsenceType } from '../types';

// Query keys
export const attendanceKeys = {
  all: ['attendance'] as const,
  lesson: (lessonId: string) => [...attendanceKeys.all, 'lesson', lessonId] as const,
  student: (studentId: string, dateFrom?: string, dateTo?: string) =>
    [...attendanceKeys.all, 'student', studentId, { dateFrom, dateTo }] as const,
  atRisk: () => [...attendanceKeys.all, 'at-risk'] as const,
  groupReport: (groupId: string, dateFrom: string, dateTo: string) =>
    [...attendanceKeys.all, 'report', groupId, { dateFrom, dateTo }] as const,
};

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
      queryClient.invalidateQueries({ queryKey: attendanceKeys.atRisk() });
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
