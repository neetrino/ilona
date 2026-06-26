'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchFooterIconLinks,
  updateFooterIconLinks,
  type FooterIconLinks,
} from '../api/settings.api';
import { settingsKeys } from './useSettings';

export function useFooterIconLinks() {
  return useQuery({
    queryKey: settingsKeys.footerIconLinks(),
    queryFn: () => fetchFooterIconLinks(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateFooterIconLinks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<FooterIconLinks>) => updateFooterIconLinks(payload),
    onSuccess: (result) => {
      queryClient.setQueryData(settingsKeys.footerIconLinks(), result);
      queryClient.invalidateQueries({ queryKey: settingsKeys.footerIconLinks() });
    },
  });
}
