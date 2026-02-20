'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchCenters,
  fetchCenter,
  createCenter,
  updateCenter,
  deleteCenter,
  toggleCenterActive,
} from '../api/centers.api';
import type { CenterFilters, CreateCenterDto, UpdateCenterDto, CentersResponse, CenterWithCount } from '../types';

// Query keys
export const centerKeys = {
  all: ['centers'] as const,
  lists: () => [...centerKeys.all, 'list'] as const,
  list: (filters?: CenterFilters) => [...centerKeys.lists(), filters] as const,
  details: () => [...centerKeys.all, 'detail'] as const,
  detail: (id: string) => [...centerKeys.details(), id] as const,
};

/**
 * Hook to fetch centers list
 */
export function useCenters(filters?: CenterFilters) {
  return useQuery({
    queryKey: centerKeys.list(filters),
    queryFn: () => fetchCenters(filters),
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch a single center
 */
export function useCenter(id: string, enabled = true) {
  return useQuery({
    queryKey: centerKeys.detail(id),
    queryFn: () => fetchCenter(id),
    enabled: enabled && !!id,
  });
}

/**
 * Hook to create a center
 */
export function useCreateCenter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCenterDto) => createCenter(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: centerKeys.lists() });
    },
  });
}

/**
 * Hook to update a center
 */
export function useUpdateCenter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCenterDto }) =>
      updateCenter(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: centerKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: centerKeys.lists() });
    },
  });
}

/**
 * Hook to delete a center
 */
export function useDeleteCenter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCenter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: centerKeys.lists() });
    },
  });
}

/**
 * Hook to toggle center active status
 */
export function useToggleCenterActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => toggleCenterActive(id),
    // Optimistic update for better UX
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: centerKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: centerKeys.lists() });

      // Snapshot previous values
      const previousCenter = queryClient.getQueryData(centerKeys.detail(id));
      const previousLists = queryClient.getQueriesData({ queryKey: centerKeys.lists() });

      // Optimistically update the detail query
      if (previousCenter) {
        const center = previousCenter as CenterWithCount;
        queryClient.setQueryData(centerKeys.detail(id), {
          ...center,
          isActive: !center.isActive,
        });
      }

      // Optimistically update all list queries
      previousLists.forEach(([queryKey, oldData]) => {
        if (oldData && typeof oldData === 'object' && 'items' in oldData) {
          const response = oldData as CentersResponse;
          const items = response.items || [];
          const updatedItems = items.map((item: CenterWithCount) => {
            if (item.id === id) {
              return {
                ...item,
                isActive: !item.isActive,
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

      return { previousCenter, previousLists };
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousCenter) {
        queryClient.setQueryData(centerKeys.detail(id), context.previousCenter);
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, oldData]) => {
          queryClient.setQueryData(queryKey, oldData);
        });
      }
    },
    onSuccess: (_, id) => {
      // Invalidate to refetch and ensure consistency
      queryClient.invalidateQueries({ queryKey: centerKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: centerKeys.lists() });
    },
  });
}






