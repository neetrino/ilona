'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteDashboardBanner,
  fetchDashboardBanner,
  updateDashboardBannerText,
  uploadDashboardBanner,
  type DashboardBannerSettings,
  type UpdateDashboardBannerTextDto,
} from '../api/settings.api';
import { settingsKeys } from './useSettings';

export function useDashboardBanner() {
  return useQuery({
    queryKey: settingsKeys.dashboardBanner(),
    queryFn: () => fetchDashboardBanner(),
    staleTime: 5 * 60 * 1000,
  });
}

function patchDashboardBannerCache(
  queryClient: ReturnType<typeof useQueryClient>,
  patch: Partial<DashboardBannerSettings>,
) {
  queryClient.setQueryData<DashboardBannerSettings>(settingsKeys.dashboardBanner(), (current) => ({
    bannerUrl: current?.bannerUrl ?? null,
    title: current?.title ?? null,
    subtitle: current?.subtitle ?? null,
    ...patch,
  }));
}

export function useUploadDashboardBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadDashboardBanner(file),
    onSuccess: (result) => {
      patchDashboardBannerCache(queryClient, { bannerUrl: result.bannerUrl });
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
      patchDashboardBannerCache(queryClient, { bannerUrl: null });
      queryClient.invalidateQueries({ queryKey: settingsKeys.dashboardBanner() });
      queryClient.invalidateQueries({ queryKey: settingsKeys.public() });
    },
  });
}

export function useUpdateDashboardBannerText() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateDashboardBannerTextDto) => updateDashboardBannerText(payload),
    onSuccess: (result) => {
      patchDashboardBannerCache(queryClient, result);
      queryClient.invalidateQueries({ queryKey: settingsKeys.dashboardBanner() });
    },
  });
}
