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
  TeachersResponse,
} from '../types';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { settingsKeys } from '@/features/settings/hooks/useSettings';
import { financeKeys } from '@/features/finance/hooks/useFinance';

function viewerScope(viewerId: string | null | undefined): string {
  return viewerId ?? 'guest';
}

// Query keys (viewer scope prevents reusing another account's cached teacher list/detail in the same browser)
export const teacherKeys = {
  all: ['teachers'] as const,
  lists: () => [...teacherKeys.all, 'list'] as const,
  list: (filters?: TeacherFilters, viewerId?: string | null) =>
    [...teacherKeys.lists(), { scope: viewerScope(viewerId) }, filters] as const,
  details: () => [...teacherKeys.all, 'detail'] as const,
  detail: (id: string, viewerId?: string | null) =>
    [...teacherKeys.details(), { scope: viewerScope(viewerId) }, id] as const,
  statistics: (id: string, viewerId?: string | null) => [...teacherKeys.detail(id, viewerId), 'statistics'] as const,
};

function useViewerId(): string | null {
  return useAuthStore((s) => s.user?.id ?? null);
}

/**
 * Hook to fetch teachers list
 */
export function useTeachers(filters?: TeacherFilters, enabled = true) {
  const viewerId = useViewerId();
  return useQuery({
    queryKey: teacherKeys.list(filters, viewerId),
    queryFn: () => fetchTeachers(filters),
    enabled,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch a single teacher. Query is keyed by id — always use `data?.id === id`
 * before showing UI when the route id can change without remounting (defensive).
 */
export function useTeacher(id: string, enabled = true) {
  const viewerId = useViewerId();
  return useQuery({
    queryKey: teacherKeys.detail(id, viewerId),
    queryFn: () => fetchTeacher(id),
    enabled: enabled && !!id,
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
  const viewerId = useViewerId();
  return useQuery({
    queryKey: teacherKeys.statistics(id, viewerId),
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
      // Invalidate salaries query so new teacher appears in Teacher Salaries list
      queryClient.invalidateQueries({ queryKey: financeKeys.salaries() });
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
      const viewerId = user?.id ?? null;
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: teacherKeys.detail(id, viewerId) });
      await queryClient.cancelQueries({ queryKey: teacherKeys.lists() });

      // Snapshot previous values
      const previousTeacher = queryClient.getQueryData<Teacher>(teacherKeys.detail(id, viewerId));
      const previousLists = queryClient.getQueriesData({ queryKey: teacherKeys.lists() });

      // Optimistically update the detail query
      if (previousTeacher) {
        queryClient.setQueryData<Teacher>(teacherKeys.detail(id, viewerId), {
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

      // Optimistically update all list queries
      previousLists.forEach(([queryKey, oldData]) => {
        if (oldData && typeof oldData === 'object' && 'items' in oldData) {
          const response = oldData as TeachersResponse;
          const items = response.items || [];
          const updatedItems = items.map((item: Teacher) => {
            if (item.id === id) {
              return {
                ...item,
                user: {
                  ...item.user,
                  ...(data.firstName && { firstName: data.firstName }),
                  ...(data.lastName && { lastName: data.lastName }),
                  ...(data.phone !== undefined && { phone: data.phone }),
                  ...(data.status && { status: data.status }),
                },
              };
            }
            return item;
          });
          queryClient.setQueryData(queryKey, {
            ...response,
            items: updatedItems,
          });
        }
      });

      return { previousTeacher, previousLists };
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      const viewerId = user?.id ?? null;
      if (context?.previousTeacher) {
        queryClient.setQueryData(teacherKeys.detail(id, viewerId), context.previousTeacher);
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, oldData]) => {
          queryClient.setQueryData(queryKey, oldData);
        });
      }
    },
    onSuccess: (updatedTeacher, { id }) => {
      // Invalidate and refetch all related queries
      const viewerId = user?.id ?? null;
      queryClient.invalidateQueries({ queryKey: teacherKeys.detail(id, viewerId) });
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
