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
  CreateRecurringLessonsResult,
} from '../types';
import { financeKeys } from '@/features/finance/hooks/useFinance';
import { useAuthStore } from '@/features/auth/store/auth.store';

type Scope = string;

function scopeKey(userId: string | null | undefined): Scope {
  return userId ?? 'guest';
}

// Query keys (scoped by auth user so another account never receives cached lesson rows)
export const lessonKeys = {
  all: ['lessons'] as const,
  lists: () => [...lessonKeys.all, 'list'] as const,
  list: (filters?: LessonFilters, userId?: string | null) =>
    [...lessonKeys.lists(), { scope: scopeKey(userId) }, filters] as const,
  details: () => [...lessonKeys.all, 'detail'] as const,
  detail: (id: string, userId?: string | null) =>
    [...lessonKeys.details(), { scope: scopeKey(userId) }, id] as const,
  today: (userId?: string | null) =>
    [...lessonKeys.all, 'today', { scope: scopeKey(userId) }] as const,
  upcoming: (limit?: number, userId?: string | null) =>
    [...lessonKeys.all, 'upcoming', { scope: scopeKey(userId) }, limit] as const,
  myLessons: (dateFrom?: string, dateTo?: string, userId?: string | null) =>
    [...lessonKeys.all, 'my-lessons', { scope: scopeKey(userId) }, { dateFrom, dateTo }] as const,
  statistics: (teacherId?: string, dateFrom?: string, dateTo?: string, userId?: string | null) =>
    [...lessonKeys.all, 'statistics', { scope: scopeKey(userId) }, { teacherId, dateFrom, dateTo }] as const,
};

function useAuthUserId(): string | null {
  return useAuthStore((s) => s.user?.id ?? null);
}

export interface UseLessonsOptions {
  /** Polling interval in ms (e.g. 60000 for calendar). Only when tab visible if refetchIntervalInBackground is false. */
  refetchInterval?: number | false;
  refetchIntervalInBackground?: boolean;
  enabled?: boolean;
}

/**
 * Hook to fetch lessons list
 */
export function useLessons(filters?: LessonFilters, options?: UseLessonsOptions) {
  const userId = useAuthUserId();
  return useQuery({
    queryKey: lessonKeys.list(filters, userId),
    queryFn: () => fetchLessons(filters),
    refetchInterval: options?.refetchInterval,
    refetchIntervalInBackground: options?.refetchIntervalInBackground ?? false,
    enabled: options?.enabled !== false,
  });
}

/**
 * Hook to fetch a single lesson
 */
export function useLesson(id: string, enabled = true) {
  const userId = useAuthUserId();
  return useQuery({
    queryKey: lessonKeys.detail(id, userId),
    queryFn: () => fetchLesson(id),
    enabled: enabled && !!id,
  });
}

/**
 * Hook to fetch today's lessons for current teacher
 */
export function useTodayLessons(enabled = true) {
  const userId = useAuthUserId();
  return useQuery({
    queryKey: lessonKeys.today(userId),
    queryFn: () => fetchTodayLessons(),
    enabled,
  });
}

/**
 * Hook to fetch upcoming lessons for current teacher
 */
export function useUpcomingLessons(limit = 10, enabled = true) {
  const userId = useAuthUserId();
  return useQuery({
    queryKey: lessonKeys.upcoming(limit, userId),
    queryFn: () => fetchUpcomingLessons(limit),
    enabled,
  });
}

/**
 * Hook to fetch teacher's lessons with date filter
 */
export function useMyLessons(dateFrom?: string, dateTo?: string, enabled = true) {
  const userId = useAuthUserId();
  return useQuery({
    queryKey: lessonKeys.myLessons(dateFrom, dateTo, userId),
    queryFn: () => fetchMyLessons(dateFrom, dateTo),
    enabled,
  });
}

/**
 * Hook to fetch lesson statistics
 */
export function useLessonStatistics(teacherId?: string, dateFrom?: string, dateTo?: string) {
  const userId = useAuthUserId();
  return useQuery({
    queryKey: lessonKeys.statistics(teacherId, dateFrom, dateTo, userId),
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
      queryClient.invalidateQueries({ queryKey: lessonKeys.all });
    },
  });
}

/**
 * Hook to create recurring lessons
 */
export function useCreateRecurringLessons() {
  const queryClient = useQueryClient();

  return useMutation<CreateRecurringLessonsResult, Error, CreateRecurringLessonsDto>({
    mutationFn: (data) => createRecurringLessons(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lessonKeys.all });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lessonKeys.details() });
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
    onSuccess: () => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lessonKeys.all });
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
    onSuccess: () => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lessonKeys.details() });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lessonKeys.details() });
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
