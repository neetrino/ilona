'use client';

import { useQuery } from '@tanstack/react-query';
import {
  fetchDashboardSummary,
  fetchTeacherPerformance,
  fetchStudentRisk,
  fetchRevenueAnalytics,
  fetchAttendanceOverview,
  fetchLessonsOverview,
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

export function useDashboardSummary() {
  return useQuery({
    queryKey: analyticsKeys.summary(),
    queryFn: fetchDashboardSummary,
  });
}

export function useTeacherPerformance(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: analyticsKeys.teachers(dateFrom, dateTo),
    queryFn: () => fetchTeacherPerformance(dateFrom, dateTo),
  });
}

export function useStudentRisk() {
  return useQuery({
    queryKey: analyticsKeys.studentsRisk(),
    queryFn: fetchStudentRisk,
  });
}

export function useRevenueAnalytics(months = 6) {
  return useQuery({
    queryKey: analyticsKeys.revenue(months),
    queryFn: () => fetchRevenueAnalytics(months),
  });
}

export function useAttendanceOverview(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: analyticsKeys.attendance(dateFrom, dateTo),
    queryFn: () => fetchAttendanceOverview(dateFrom, dateTo),
  });
}

export function useLessonsOverview(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: analyticsKeys.lessons(dateFrom, dateTo),
    queryFn: () => fetchLessonsOverview(dateFrom, dateTo),
  });
}
