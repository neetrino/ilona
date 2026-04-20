'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createDailyPlan,
  deleteDailyPlan,
  fetchDailyPlan,
  fetchDailyPlans,
  updateDailyPlan,
} from './api';
import type {
  CreateDailyPlanInput,
  DailyPlanFilters,
  UpdateDailyPlanInput,
} from './types';

export const dailyPlanKeys = {
  all: ['daily-plans'] as const,
  list: (filters?: DailyPlanFilters) => ['daily-plans', 'list', filters ?? {}] as const,
  detail: (id: string) => ['daily-plans', 'detail', id] as const,
};

export function useDailyPlans(filters?: DailyPlanFilters, enabled = true) {
  return useQuery({
    queryKey: dailyPlanKeys.list(filters),
    queryFn: () => fetchDailyPlans(filters),
    enabled,
    staleTime: 30 * 1000,
  });
}

export function useDailyPlan(id: string | undefined) {
  return useQuery({
    queryKey: dailyPlanKeys.detail(id ?? ''),
    queryFn: () => fetchDailyPlan(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateDailyPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDailyPlanInput) => createDailyPlan(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dailyPlanKeys.all });
    },
  });
}

export function useUpdateDailyPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDailyPlanInput }) =>
      updateDailyPlan(id, input),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: dailyPlanKeys.all });
      qc.invalidateQueries({ queryKey: dailyPlanKeys.detail(variables.id) });
    },
  });
}

export function useDeleteDailyPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDailyPlan(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dailyPlanKeys.all });
    },
  });
}
