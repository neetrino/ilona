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
  fetchMyDashboard,
  fetchMyAssignedStudents,
} from '../api/students.api';
import type {
  StudentFilters,
  CreateStudentDto,
  UpdateStudentDto,
} from '../types';

// Query keys
export const studentKeys = {
  all: ['students'] as const,
  lists: () => [...studentKeys.all, 'list'] as const,
  list: (filters?: StudentFilters) => [...studentKeys.lists(), filters] as const,
  details: () => [...studentKeys.all, 'detail'] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
  statistics: (id: string) => [...studentKeys.detail(id), 'statistics'] as const,
  myDashboard: () => [...studentKeys.all, 'my-dashboard'] as const,
  myAssigned: (filters?: StudentFilters) => [...studentKeys.all, 'my-assigned', filters] as const,
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
    onSuccess: (_, { id }) => {
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
