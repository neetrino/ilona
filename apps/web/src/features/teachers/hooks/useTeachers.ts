'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTeachers,
  fetchTeacher,
  fetchTeacherStatistics,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  deleteTeachers,
} from '../api/teachers.api';
import type {
  TeacherFilters,
  CreateTeacherDto,
  UpdateTeacherDto,
  Teacher,
} from '../types';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { settingsKeys } from '@/features/settings/hooks/useSettings';

// Query keys
export const teacherKeys = {
  all: ['teachers'] as const,
  lists: () => [...teacherKeys.all, 'list'] as const,
  list: (filters?: TeacherFilters) => [...teacherKeys.lists(), filters] as const,
  details: () => [...teacherKeys.all, 'detail'] as const,
  detail: (id: string) => [...teacherKeys.details(), id] as const,
  statistics: (id: string) => [...teacherKeys.detail(id), 'statistics'] as const,
};

/**
 * Hook to fetch teachers list
 */
export function useTeachers(filters?: TeacherFilters) {
  return useQuery({
    queryKey: teacherKeys.list(filters),
    queryFn: () => fetchTeachers(filters),
    // Refetch on window focus to ensure data consistency
    refetchOnWindowFocus: true,
    // Data is considered stale after 30 seconds
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch a single teacher
 */
export function useTeacher(id: string, enabled = true) {
  return useQuery({
    queryKey: teacherKeys.detail(id),
    queryFn: () => fetchTeacher(id),
    enabled: enabled && !!id,
    // Refetch on window focus to ensure data consistency
    refetchOnWindowFocus: true,
    // Data is considered stale after 30 seconds
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch teacher statistics
 */
export function useTeacherStatistics(
  id: string,
  dateFrom?: string,
  dateTo?: string,
  enabled = true
) {
  return useQuery({
    queryKey: teacherKeys.statistics(id),
    queryFn: () => fetchTeacherStatistics(id, dateFrom, dateTo),
    enabled: enabled && !!id,
  });
}

/**
 * Hook to create a teacher
 */
export function useCreateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTeacherDto) => createTeacher(data),
    onSuccess: () => {
      // Invalidate teachers list to refetch
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
    },
  });
}

/**
 * Hook to update a teacher
 */
export function useUpdateTeacher() {
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTeacherDto }) =>
      updateTeacher(id, data),
    // Optimistic update for better UX
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: teacherKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: teacherKeys.lists() });

      // Snapshot the previous value
      const previousTeacher = queryClient.getQueryData<Teacher>(teacherKeys.detail(id));

      // Optimistically update the cache
      if (previousTeacher) {
        queryClient.setQueryData<Teacher>(teacherKeys.detail(id), {
          ...previousTeacher,
          ...data,
          user: {
            ...previousTeacher.user,
            ...(data.firstName && { firstName: data.firstName }),
            ...(data.lastName && { lastName: data.lastName }),
            ...(data.phone !== undefined && { phone: data.phone }),
            ...(data.status && { status: data.status }),
          },
        });
      }

      return { previousTeacher };
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousTeacher) {
        queryClient.setQueryData(teacherKeys.detail(id), context.previousTeacher);
      }
    },
    onSuccess: (updatedTeacher, { id }) => {
      // Invalidate and refetch all related queries
      queryClient.invalidateQueries({ queryKey: teacherKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
      queryClient.invalidateQueries({ queryKey: teacherKeys.all });
      // Also invalidate user profile queries (settings)
      queryClient.invalidateQueries({ queryKey: settingsKeys.profile() });
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });

      // Update auth store if this is the current user
      if (user && updatedTeacher.user && user.id === updatedTeacher.user.id) {
        setUser({
          ...user,
          firstName: updatedTeacher.user.firstName,
          lastName: updatedTeacher.user.lastName,
          phone: updatedTeacher.user.phone,
          status: updatedTeacher.user.status,
        });
      }
    },
  });
}

/**
 * Hook to delete a teacher
 */
export function useDeleteTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTeacher(id),
    onSuccess: () => {
      // Invalidate teachers list
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
    },
  });
}

/**
 * Hook to delete multiple teachers
 */
export function useDeleteTeachers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => deleteTeachers(ids),
    onSuccess: () => {
      // Invalidate teachers list
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
    },
  });
}
