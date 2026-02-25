'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth.store';
import { chatKeys } from '@/features/chat/hooks/useChat';

/**
 * Returns a logout function that clears chat cache and then logs out.
 * Use this instead of useAuthStore().logout so the next user does not see
 * the previous user's cached chat list (e.g. Admin chats showing for Student).
 */
export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.removeQueries({ queryKey: chatKeys.all });
    logout();
  }, [logout, queryClient]);
}
