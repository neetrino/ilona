'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteDashboardBanner,
  fetchDashboardBanner,
  uploadDashboardBanner,
} from '../api/settings.api';
import { settingsKeys } from './useSettings';

export function useDashboardBanner() {
  return useQuery({
    queryKey: settingsKeys.dashboardBanner(),
    queryFn: () => fetchDashboardBanner(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUploadDashboardBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadDashboardBanner(file),
    onSuccess: (result) => {
      queryClient.setQueryData(settingsKeys.dashboardBanner(), {
        bannerUrl: result.bannerUrl,
      });
      queryClient.invalidateQueries({ queryKey: settingsKeys.dashboardBanner() });
      queryClient.invalidateQueries({ queryKey: settingsKeys.public() });
    },
  });
}

export function useDeleteDashboardBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteDashboardBanner(),
    onSuccess: () => {
      queryClient.setQueryData(settingsKeys.dashboardBanner(), {
        bannerUrl: null,
      });
      queryClient.invalidateQueries({ queryKey: settingsKeys.dashboardBanner() });
      queryClient.invalidateQueries({ queryKey: settingsKeys.public() });
    },
  });
}
