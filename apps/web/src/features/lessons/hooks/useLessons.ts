'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchLessons,
  fetchLesson,
  fetchTodayLessons,
  fetchUpcomingLessons,
  fetchMyLessons,
  fetchLessonStatistics,
  createLesson,
  createRecurringLessons,
  updateLesson,
  startLesson,
  completeLesson,
  cancelLesson,
  markLessonMissed,
  markVocabularySent,
  deleteLesson,
  deleteLessonsBulk,
} from '../api/lessons.api';
import type {
  LessonFilters,
  CreateLessonDto,
  UpdateLessonDto,
  CompleteLessonDto,
  CreateRecurringLessonsDto,
} from '../types';
import { financeKeys } from '@/features/finance/hooks/useFinance';

// Query keys
export const lessonKeys = {
  all: ['lessons'] as const,
  lists: () => [...lessonKeys.all, 'list'] as const,
  list: (filters?: LessonFilters) => [...lessonKeys.lists(), filters] as const,
  details: () => [...lessonKeys.all, 'detail'] as const,
  detail: (id: string) => [...lessonKeys.details(), id] as const,
  today: () => [...lessonKeys.all, 'today'] as const,
  upcoming: (limit?: number) => [...lessonKeys.all, 'upcoming', limit] as const,
  myLessons: (dateFrom?: string, dateTo?: string) => [...lessonKeys.all, 'my-lessons', { dateFrom, dateTo }] as const,
  statistics: (teacherId?: string, dateFrom?: string, dateTo?: string) =>
    [...lessonKeys.all, 'statistics', { teacherId, dateFrom, dateTo }] as const,
};

/**
 * Hook to fetch lessons list
 */
export function useLessons(filters?: LessonFilters) {
  return useQuery({
    queryKey: lessonKeys.list(filters),
    queryFn: () => fetchLessons(filters),
  });
}

/**
 * Hook to fetch a single lesson
 */
export function useLesson(id: string, enabled = true) {
  return useQuery({
    queryKey: lessonKeys.detail(id),
    queryFn: () => fetchLesson(id),
    enabled: enabled && !!id,
  });
}

/**
 * Hook to fetch today's lessons for current teacher
 */
export function useTodayLessons(enabled = true) {
  return useQuery({
    queryKey: lessonKeys.today(),
    queryFn: () => fetchTodayLessons(),
    enabled,
  });
}

/**
 * Hook to fetch upcoming lessons for current teacher
 */
export function useUpcomingLessons(limit = 10, enabled = true) {
  return useQuery({
    queryKey: lessonKeys.upcoming(limit),
    queryFn: () => fetchUpcomingLessons(limit),
    enabled,
  });
}

/**
 * Hook to fetch teacher's lessons with date filter
 */
export function useMyLessons(dateFrom?: string, dateTo?: string, enabled = true) {
  return useQuery({
    queryKey: lessonKeys.myLessons(dateFrom, dateTo),
    queryFn: () => fetchMyLessons(dateFrom, dateTo),
    enabled,
  });
}

/**
 * Hook to fetch lesson statistics
 */
export function useLessonStatistics(teacherId?: string, dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: lessonKeys.statistics(teacherId, dateFrom, dateTo),
    queryFn: () => fetchLessonStatistics(teacherId, dateFrom, dateTo),
  });
}

/**
 * Hook to create a lesson
 */
export function useCreateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLessonDto) => createLesson(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lessonKeys.lists() });
    },
  });
}

/**
 * Hook to create recurring lessons
 */
export function useCreateRecurringLessons() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRecurringLessonsDto) => createRecurringLessons(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lessonKeys.lists() });
    },
  });
}

/**
 * Hook to update a lesson
 */
export function useUpdateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLessonDto }) =>
      updateLesson(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: lessonKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: lessonKeys.lists() });
    },
  });
}

/**
 * Hook to start a lesson
 */
export function useStartLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => startLesson(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: lessonKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: lessonKeys.lists() });
      queryClient.invalidateQueries({ queryKey: lessonKeys.all });
    },
  });
}

/**
 * Hook to complete a lesson
 */
export function useCompleteLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: CompleteLessonDto }) =>
      completeLesson(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate all lesson queries to ensure UI updates immediately
      queryClient.invalidateQueries({ queryKey: lessonKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: lessonKeys.lists() });
      queryClient.invalidateQueries({ queryKey: lessonKeys.all });
      queryClient.invalidateQueries({ queryKey: lessonKeys.today() });
      queryClient.invalidateQueries({ queryKey: lessonKeys.myLessons() });
      // Invalidate salary queries since completing a lesson affects salary calculation
      queryClient.invalidateQueries({ queryKey: financeKeys.salaries() });
    },
  });
}

/**
 * Hook to cancel a lesson
 */
export function useCancelLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      cancelLesson(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: lessonKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: lessonKeys.lists() });
      queryClient.invalidateQueries({ queryKey: lessonKeys.all });
    },
  });
}

/**
 * Hook to mark lesson as missed
 */
export function useMarkLessonMissed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markLessonMissed(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: lessonKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: lessonKeys.lists() });
    },
  });
}

/**
 * Hook to mark vocabulary as sent
 */
export function useMarkVocabularySent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markVocabularySent(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: lessonKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: lessonKeys.lists() });
    },
  });
}

/**
 * Hook to delete a lesson
 */
export function useDeleteLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteLesson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lessonKeys.lists() });
    },
  });
}

/**
 * Hook to delete multiple lessons (bulk delete)
 */
export function useDeleteLessonsBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lessonIds: string[]) => deleteLessonsBulk(lessonIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lessonKeys.lists() });
      queryClient.invalidateQueries({ queryKey: lessonKeys.all });
    },
  });
}
