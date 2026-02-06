'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchGroups,
  fetchGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  toggleGroupActive,
  assignTeacher,
  addStudentToGroup,
  removeStudentFromGroup,
  fetchMyGroups,
} from '../api/groups.api';
import type { GroupFilters, CreateGroupDto, UpdateGroupDto } from '../types';

// Query keys
export const groupKeys = {
  all: ['groups'] as const,
  lists: () => [...groupKeys.all, 'list'] as const,
  list: (filters?: GroupFilters) => [...groupKeys.lists(), filters] as const,
  details: () => [...groupKeys.all, 'detail'] as const,
  detail: (id: string) => [...groupKeys.details(), id] as const,
  myGroups: () => [...groupKeys.all, 'my-groups'] as const,
};

/**
 * Hook to fetch groups list
 */
export function useGroups(filters?: GroupFilters) {
  return useQuery({
    queryKey: groupKeys.list(filters),
    queryFn: () => fetchGroups(filters),
  });
}

/**
 * Hook to fetch a single group
 */
export function useGroup(id: string, enabled = true) {
  return useQuery({
    queryKey: groupKeys.detail(id),
    queryFn: () => fetchGroup(id),
    enabled: enabled && !!id,
  });
}

/**
 * Hook to fetch groups assigned to the currently logged-in teacher
 */
export function useMyGroups() {
  return useQuery({
    queryKey: groupKeys.myGroups(),
    queryFn: () => fetchMyGroups(),
  });
}

/**
 * Hook to create a group
 */
export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGroupDto) => createGroup(data),
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      // If a teacher is assigned, invalidate their my-groups cache
      if (group.teacherId) {
        queryClient.invalidateQueries({ queryKey: groupKeys.myGroups() });
      }
    },
  });
}

/**
 * Hook to update a group
 */
export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGroupDto }) =>
      updateGroup(id, data),
    onSuccess: (group, { id }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      // If teacher assignment changed, invalidate my-groups cache
      if (data.teacherId !== undefined) {
        queryClient.invalidateQueries({ queryKey: groupKeys.myGroups() });
      }
    },
  });
}

/**
 * Hook to delete a group
 */
export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
}

/**
 * Hook to toggle group active status
 */
export function useToggleGroupActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => toggleGroupActive(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
  });
}

/**
 * Hook to assign teacher to group
 */
export function useAssignTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, teacherId }: { groupId: string; teacherId: string }) =>
      assignTeacher(groupId, teacherId),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: groupKeys.myGroups() });
    },
  });
}

/**
 * Hook to add student to group
 */
export function useAddStudentToGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, studentId }: { groupId: string; studentId: string }) =>
      addStudentToGroup(groupId, studentId),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: groupKeys.myGroups() });
      // Invalidate student queries to refresh student lists
      queryClient.invalidateQueries({ queryKey: ['students', 'my-assigned'] });
    },
  });
}

/**
 * Hook to remove student from group
 */
export function useRemoveStudentFromGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, studentId }: { groupId: string; studentId: string }) =>
      removeStudentFromGroup(groupId, studentId),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: groupKeys.myGroups() });
      // Invalidate student queries to refresh student lists
      queryClient.invalidateQueries({ queryKey: ['students', 'my-assigned'] });
    },
  });
}
