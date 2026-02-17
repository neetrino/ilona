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
  myAssigned: (filters?: StudentFilters) => [...studentKeys.all, 'my-assigned', filters] as const,
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
      queryClient.invalidateQueries({ queryKey: studentKeys.myAssigned() });
    },
  });
}

/**
 * Hook to update a student
 */
export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStudentDto }) =>
      updateStudent(id, data),
    // Optimistic update for better UX
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: studentKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: studentKeys.lists() });
      await queryClient.cancelQueries({ queryKey: studentKeys.myAssigned() });

      // Snapshot previous values
      const previousStudent = queryClient.getQueryData(studentKeys.detail(id));
      const previousLists = queryClient.getQueriesData({ queryKey: studentKeys.lists() });
      const previousMyAssigned = queryClient.getQueriesData({ queryKey: studentKeys.myAssigned() });

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
          const updatedItems = items.map((item: Student) => {
            if (item.id === id) {
              return {
                ...item,
                ...(data.status && {
                  user: {
                    ...item.user,
                    status: data.status,
                  },
                }),
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

      // Optimistically update my-assigned queries
      previousMyAssigned.forEach(([queryKey, oldData]) => {
        if (oldData && typeof oldData === 'object' && 'items' in oldData) {
          const response = oldData as StudentsResponse;
          const items = response.items || [];
          const updatedItems = items.map((item: Student) => {
            if (item.id === id) {
              return {
                ...item,
                ...(data.status && {
                  user: {
                    ...item.user,
                    status: data.status,
                  },
                }),
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
    onSuccess: (_, { id }) => {
      // Invalidate to refetch and ensure consistency
      queryClient.invalidateQueries({ queryKey: studentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: studentKeys.myAssigned() });
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
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: studentKeys.myAssigned() });
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
 */
export function useMyAssignedStudents(filters?: StudentFilters) {
  return useQuery({
    queryKey: studentKeys.myAssigned(filters),
    queryFn: () => fetchMyAssignedStudents(filters),
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
