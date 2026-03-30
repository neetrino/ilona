'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchStudents,
  fetchStudent,
  fetchStudentStatistics,
  createStudent,
  updateStudent,
  changeStudentGroup,
  deleteStudent,
  deleteStudentsBulk,
  fetchMyProfile,
  fetchMyDashboard,
  fetchMyAssignedStudents,
  fetchMyTeachers,
} from '../api/students.api';
import type {
  StudentFilters,
  CreateStudentDto,
  UpdateStudentDto,
  Student,
  StudentsResponse,
} from '../types';
import { getItemId, isOnboardingItem } from '../types';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { groupKeys } from '@/features/groups/hooks/useGroups';
import { teacherKeys } from '@/features/teachers/hooks/useTeachers';
import { centerKeys } from '@/features/centers/hooks/useCenters';
import { dashboardKeys } from '@/features/dashboard/hooks/useDashboard';
import { analyticsKeys } from '@/features/analytics/hooks/useAnalytics';
import { chatKeys } from '@/features/chat/hooks/useChat';

// Query keys
export const studentKeys = {
  all: ['students'] as const,
  lists: () => [...studentKeys.all, 'list'] as const,
  list: (filters?: StudentFilters) => [...studentKeys.lists(), filters] as const,
  details: () => [...studentKeys.all, 'detail'] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
  statistics: (id: string) => [...studentKeys.detail(id), 'statistics'] as const,
  myProfile: () => [...studentKeys.all, 'my-profile'] as const,
  myDashboard: () => [...studentKeys.all, 'my-dashboard'] as const,
  /** Include userId so cache is isolated per teacher; use [...studentKeys.all, 'my-assigned'] for prefix invalidation */
  myAssigned: (userId?: string, filters?: StudentFilters) =>
    [...studentKeys.all, 'my-assigned', userId ?? '', filters] as const,
  myTeachers: () => [...studentKeys.all, 'my-teachers'] as const,
};

/**
 * Hook to fetch students list
 */
export function useStudents(filters?: StudentFilters) {
  return useQuery({
    queryKey: studentKeys.list(filters),
    queryFn: () => fetchStudents(filters),
  });
}

/**
 * Hook to fetch a single student
 */
export function useStudent(id: string, enabled = true) {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: () => fetchStudent(id),
    enabled: enabled && !!id,
  });
}

/**
 * Hook to fetch student statistics
 */
export function useStudentStatistics(id: string, enabled = true) {
  return useQuery({
    queryKey: studentKeys.statistics(id),
    queryFn: () => fetchStudentStatistics(id),
    enabled: enabled && !!id,
  });
}

/**
 * Hook to create a student
 */
export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStudentDto) => createStudent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...studentKeys.all, 'my-assigned'] });
    },
  });
}

/**
 * Hook to update a student
 */
export function useUpdateStudent() {
  const queryClient = useQueryClient();

  const syncStudentInCachedLists = (studentId: string, updatedStudent: Student) => {
    const patchListData = (oldData: unknown): unknown => {
      if (!oldData || typeof oldData !== 'object' || !('items' in oldData)) {
        return oldData;
      }

      const response = oldData as StudentsResponse;
      const items = response.items || [];
      const nextItems = items.map((item) => {
        if (getItemId(item) !== studentId || isOnboardingItem(item)) {
          return item;
        }
        return {
          ...item,
          ...updatedStudent,
          user: {
            ...item.user,
            ...updatedStudent.user,
          },
          group: updatedStudent.group ?? null,
          teacher: updatedStudent.teacher ?? null,
          groupId: updatedStudent.groupId ?? null,
          teacherId: updatedStudent.teacherId ?? null,
          registerDate: updatedStudent.registerDate ?? null,
        };
      });

      return {
        ...response,
        items: nextItems,
      };
    };

    queryClient.setQueriesData({ queryKey: studentKeys.lists() }, patchListData);
    queryClient.setQueriesData({ queryKey: [...studentKeys.all, 'my-assigned'] }, patchListData);
  };

  const invalidateStudentRelatedQueries = (studentId: string) => {
    queryClient.invalidateQueries({ queryKey: studentKeys.detail(studentId) });
    queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    queryClient.invalidateQueries({ queryKey: [...studentKeys.all, 'my-assigned'] });

    // Student reassignment impacts groups, teachers, centers, dashboards, analytics and chat lists.
    queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    queryClient.invalidateQueries({ queryKey: groupKeys.details() });
    queryClient.invalidateQueries({ queryKey: [...groupKeys.all, 'my-groups'] });
    queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
    queryClient.invalidateQueries({ queryKey: teacherKeys.details() });
    queryClient.invalidateQueries({ queryKey: centerKeys.lists() });
    queryClient.invalidateQueries({ queryKey: centerKeys.details() });
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
    queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
    queryClient.invalidateQueries({ queryKey: [...chatKeys.all, 'admin'] });
    queryClient.invalidateQueries({ queryKey: [...chatKeys.all, 'teacher'] });
    queryClient.invalidateQueries({ queryKey: chatKeys.details() });
  };

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStudentDto }) =>
      updateStudent(id, data),
    // Optimistic update for better UX
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: studentKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: studentKeys.lists() });
      await queryClient.cancelQueries({ queryKey: [...studentKeys.all, 'my-assigned'] });

      // Snapshot previous values
      const previousStudent = queryClient.getQueryData(studentKeys.detail(id));
      const previousLists = queryClient.getQueriesData({ queryKey: studentKeys.lists() });
      const previousMyAssigned = queryClient.getQueriesData({ queryKey: [...studentKeys.all, 'my-assigned'] });

      // Optimistically update the detail query
      if (previousStudent) {
        const student = previousStudent as Student;
        queryClient.setQueryData(studentKeys.detail(id), {
          ...student,
          ...(data.status && {
            user: {
              ...student.user,
              status: data.status,
            },
          }),
        });
      }

      // Optimistically update all list queries
      previousLists.forEach(([queryKey, oldData]) => {
        if (oldData && typeof oldData === 'object' && 'items' in oldData) {
          const response = oldData as StudentsResponse;
          const items = response.items || [];
          const updatedItems = items.map((item) => {
            if (getItemId(item) !== id || isOnboardingItem(item)) return item;
            const student = item;
            return {
              ...student,
              ...(data.status && {
                user: {
                  ...student.user,
                  status: data.status,
                },
              }),
            };
          });
          queryClient.setQueryData(queryKey, {
            ...response,
            items: updatedItems,
          });
        }
      });

      // Optimistically update my-assigned queries
      previousMyAssigned.forEach(([queryKey, oldData]) => {
        if (oldData && typeof oldData === 'object' && 'items' in oldData) {
          const response = oldData as StudentsResponse;
          const items = response.items || [];
          const updatedItems = items.map((item) => {
            if (getItemId(item) !== id || isOnboardingItem(item)) return item;
            const student = item;
            return {
              ...student,
              ...(data.status && {
                user: {
                  ...student.user,
                  status: data.status,
                },
              }),
            };
          });
          queryClient.setQueryData(queryKey, {
            ...response,
            items: updatedItems,
          });
        }
      });

      return { previousStudent, previousLists, previousMyAssigned };
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousStudent) {
        queryClient.setQueryData(studentKeys.detail(id), context.previousStudent);
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, oldData]) => {
          queryClient.setQueryData(queryKey, oldData);
        });
      }
      if (context?.previousMyAssigned) {
        context.previousMyAssigned.forEach(([queryKey, oldData]) => {
          queryClient.setQueryData(queryKey, oldData);
        });
      }
    },
    onSuccess: (updatedStudent, { id }) => {
      // Ensure immediate UI sync without waiting for refetch.
      queryClient.setQueryData(studentKeys.detail(id), updatedStudent);
      syncStudentInCachedLists(id, updatedStudent);
      invalidateStudentRelatedQueries(id);
    },
  });
}

/**
 * Hook to change student's group
 */
export function useChangeStudentGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, groupId }: { id: string; groupId: string | null }) =>
      changeStudentGroup(id, groupId),
    onSuccess: (updatedStudent, { id }) => {
      queryClient.setQueryData(studentKeys.detail(id), updatedStudent);
      queryClient.invalidateQueries({ queryKey: studentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...studentKeys.all, 'my-assigned'] });
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: groupKeys.details() });
      queryClient.invalidateQueries({ queryKey: [...groupKeys.all, 'my-groups'] });
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
      queryClient.invalidateQueries({ queryKey: centerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...chatKeys.all, 'teacher'] });
      queryClient.invalidateQueries({ queryKey: [...chatKeys.all, 'admin'] });
    },
  });
}

/**
 * Hook to delete a student
 */
export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
  });
}

/**
 * Hook to delete multiple students in one request
 */
export function useDeleteStudentsBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => deleteStudentsBulk(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...studentKeys.all, 'my-assigned'] });
    },
  });
}

/**
 * Hook to fetch current student's profile
 */
export function useMyProfile(enabled = true) {
  return useQuery({
    queryKey: studentKeys.myProfile(),
    queryFn: () => fetchMyProfile(),
    enabled,
  });
}

/**
 * Hook to fetch student's own dashboard
 */
export function useMyDashboard(enabled = true) {
  return useQuery({
    queryKey: studentKeys.myDashboard(),
    queryFn: () => fetchMyDashboard(),
    enabled,
  });
}

/**
 * Hook to fetch students assigned to the currently logged-in teacher
 * Only runs when auth is ready (hydrated + authenticated + token) to avoid 401 and empty first load.
 * Query key includes user id so cache is isolated per teacher and switching accounts does not show stale data.
 */
export function useMyAssignedStudents(filters?: StudentFilters) {
  const { user, isHydrated, isAuthenticated, tokens } = useAuthStore();
  const isAuthReady = isHydrated && isAuthenticated && !!tokens?.accessToken;

  return useQuery({
    queryKey: studentKeys.myAssigned(user?.id, filters),
    queryFn: () => fetchMyAssignedStudents(filters),
    enabled: isAuthReady,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

/**
 * Hook to fetch teachers assigned to the currently logged-in student
 */
export function useMyTeachers(enabled = true) {
  return useQuery({
    queryKey: studentKeys.myTeachers(),
    queryFn: () => fetchMyTeachers(),
    enabled,
    staleTime: 60 * 1000, // Cache for 1 minute
  });
}
