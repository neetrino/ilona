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
import type { CenterFilters, CreateCenterDto, UpdateCenterDto } from '../types';

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
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: centerKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: centerKeys.lists() });
    },
  });
}




