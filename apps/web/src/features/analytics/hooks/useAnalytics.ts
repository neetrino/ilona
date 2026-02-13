'use client';

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import {
  fetchDashboardSummary,
  fetchTeacherPerformance,
  fetchStudentRisk,
  fetchRevenueAnalytics,
  fetchAttendanceOverview,
  fetchLessonsOverview,
  type DashboardSummary,
  type TeacherPerformance,
  type StudentRisk,
  type RevenueData,
  type AttendanceOverview,
  type LessonsOverview,
} from '../api/analytics.api';

export const analyticsKeys = {
  all: ['analytics'] as const,
  summary: () => [...analyticsKeys.all, 'summary'] as const,
  teachers: (dateFrom?: string, dateTo?: string) => [...analyticsKeys.all, 'teachers', { dateFrom, dateTo }] as const,
  studentsRisk: () => [...analyticsKeys.all, 'students-risk'] as const,
  revenue: (months?: number) => [...analyticsKeys.all, 'revenue', months] as const,
  attendance: (dateFrom?: string, dateTo?: string) => [...analyticsKeys.all, 'attendance', { dateFrom, dateTo }] as const,
  lessons: (dateFrom?: string, dateTo?: string) => [...analyticsKeys.all, 'lessons', { dateFrom, dateTo }] as const,
};

export function useDashboardSummary(options?: Omit<UseQueryOptions<DashboardSummary>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: analyticsKeys.summary(),
    queryFn: fetchDashboardSummary,
    ...options,
  });
}

export function useTeacherPerformance(
  dateFrom?: string,
  dateTo?: string,
  options?: Omit<UseQueryOptions<TeacherPerformance[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: analyticsKeys.teachers(dateFrom, dateTo),
    queryFn: () => fetchTeacherPerformance(dateFrom, dateTo),
    ...options,
  });
}

export function useStudentRisk(options?: Omit<UseQueryOptions<StudentRisk[]>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: analyticsKeys.studentsRisk(),
    queryFn: fetchStudentRisk,
    ...options,
  });
}

export function useRevenueAnalytics(
  months = 6,
  options?: Omit<UseQueryOptions<RevenueData[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: analyticsKeys.revenue(months),
    queryFn: () => fetchRevenueAnalytics(months),
    ...options,
  });
}

export function useAttendanceOverview(
  dateFrom?: string,
  dateTo?: string,
  options?: Omit<UseQueryOptions<AttendanceOverview>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: analyticsKeys.attendance(dateFrom, dateTo),
    queryFn: () => fetchAttendanceOverview(dateFrom, dateTo),
    ...options,
  });
}

export function useLessonsOverview(
  dateFrom?: string,
  dateTo?: string,
  options?: Omit<UseQueryOptions<LessonsOverview>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: analyticsKeys.lessons(dateFrom, dateTo),
    queryFn: () => fetchLessonsOverview(dateFrom, dateTo),
    ...options,
  });
}
