'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchLessonFeedback,
  fetchStudentFeedback,
  createOrUpdateFeedback,
  updateFeedback,
  deleteFeedback,
} from '../api/feedback.api';
import type {
  CreateFeedbackDto,
  UpdateFeedbackDto,
} from '../types';
import { financeKeys } from '@/features/finance/hooks';

// Query keys
export const feedbackKeys = {
  all: ['feedback'] as const,
  lesson: (lessonId: string) => [...feedbackKeys.all, 'lesson', lessonId] as const,
  student: (studentId: string, dateFrom?: string, dateTo?: string) =>
    [...feedbackKeys.all, 'student', studentId, { dateFrom, dateTo }] as const,
};

/**
 * Hook to fetch feedback data for a lesson
 */
export function useLessonFeedback(lessonId: string, enabled = true) {
  return useQuery({
    queryKey: feedbackKeys.lesson(lessonId),
    queryFn: () => fetchLessonFeedback(lessonId),
    enabled: enabled && !!lessonId,
  });
}

/**
 * Hook to fetch feedback for a student
 */
export function useStudentFeedback(
  studentId: string,
  dateFrom?: string,
  dateTo?: string,
  enabled = true
) {
  return useQuery({
    queryKey: feedbackKeys.student(studentId, dateFrom, dateTo),
    queryFn: () => fetchStudentFeedback(studentId, dateFrom, dateTo),
    enabled: enabled && !!studentId,
  });
}

/**
 * Hook to create or update feedback
 */
export function useCreateOrUpdateFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateFeedbackDto) => createOrUpdateFeedback(dto),
    onSuccess: (_, variables) => {
      // Invalidate lesson feedback query
      queryClient.invalidateQueries({
        queryKey: feedbackKeys.lesson(variables.lessonId),
      });
      // Invalidate student feedback query
      queryClient.invalidateQueries({
        queryKey: feedbackKeys.student(variables.studentId),
      });
      // Invalidate salary queries to reflect immediate salary updates
      queryClient.invalidateQueries({ queryKey: financeKeys.salaries() });
      queryClient.invalidateQueries({ queryKey: financeKeys.salaryBreakdown('', '') });
    },
  });
}

/**
 * Hook to update feedback
 */
export function useUpdateFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateFeedbackDto }) =>
      updateFeedback(id, dto),
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: feedbackKeys.lesson(data.lessonId),
      });
      queryClient.invalidateQueries({
        queryKey: feedbackKeys.student(data.studentId),
      });
      // Invalidate salary queries to reflect immediate salary updates
      queryClient.invalidateQueries({ queryKey: financeKeys.salaries() });
      queryClient.invalidateQueries({ queryKey: financeKeys.salaryBreakdown('', '') });
    },
  });
}

/**
 * Hook to delete feedback
 */
export function useDeleteFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteFeedback(id),
    onSuccess: () => {
      // Invalidate all feedback queries
      queryClient.invalidateQueries({ queryKey: feedbackKeys.all });
      // Invalidate salary queries to reflect immediate salary updates
      queryClient.invalidateQueries({ queryKey: financeKeys.salaries() });
      queryClient.invalidateQueries({ queryKey: financeKeys.salaryBreakdown('', '') });
    },
  });
}

