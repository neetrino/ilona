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
import { chatKeys } from '../../chat/hooks/useChat';

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
    onSuccess: (group, { id, data }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      // If teacher assignment changed, invalidate my-groups cache and chat queries
      if (data.teacherId !== undefined) {
        queryClient.invalidateQueries({ queryKey: groupKeys.myGroups() });
        queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
        queryClient.invalidateQueries({ queryKey: chatKeys.teacherGroups() });
        queryClient.invalidateQueries({ queryKey: chatKeys.details() });
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
    // Optimistic update for better UX
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: groupKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: groupKeys.lists() });

      // Snapshot previous values
      const previousGroup = queryClient.getQueryData(groupKeys.detail(id));
      const previousLists = queryClient.getQueriesData({ queryKey: groupKeys.lists() });

      // Optimistically update the detail query
      if (previousGroup) {
        queryClient.setQueryData(groupKeys.detail(id), {
          ...previousGroup,
          isActive: !(previousGroup as any).isActive,
        });
      }

      // Optimistically update all list queries
      previousLists.forEach(([queryKey, oldData]) => {
        if (oldData && typeof oldData === 'object' && 'items' in oldData) {
          const items = (oldData as any).items || [];
          const updatedItems = items.map((item: any) => {
            if (item.id === id) {
              return {
                ...item,
                isActive: !item.isActive,
              };
            }
            return item;
          });
          queryClient.setQueryData(queryKey, {
            ...oldData,
            items: updatedItems,
          });
        }
      });

      return { previousGroup, previousLists };
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousGroup) {
        queryClient.setQueryData(groupKeys.detail(id), context.previousGroup);
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, oldData]) => {
          queryClient.setQueryData(queryKey, oldData);
        });
      }
    },
    onSuccess: (_, id) => {
      // Invalidate to refetch and ensure consistency
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
      // Invalidate group-related queries
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: groupKeys.myGroups() });
      
      // Invalidate chat-related queries to ensure teacher sees updated groups
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
      queryClient.invalidateQueries({ queryKey: chatKeys.teacherGroups() });
      // Invalidate any group chat detail queries
      queryClient.invalidateQueries({ queryKey: chatKeys.details() });
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
