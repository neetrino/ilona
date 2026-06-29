'use client';

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { fetchChats, fetchChat, fetchMessages, fetchCustomGroupChats } from '../../api/chat.api';
import { chatKeys } from './chat-query-keys';

export function useChats() {
  return useQuery({
    queryKey: chatKeys.list(),
    queryFn: () => fetchChats(),
  });
}

export function useChatDetail(chatId: string, enabled = true) {
  return useQuery({
    queryKey: chatKeys.detail(chatId),
    queryFn: () => fetchChat(chatId),
    enabled: enabled && !!chatId,
  });
}

export function useMessages(chatId: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: chatKeys.messages(chatId),
    queryFn: ({ pageParam }) => fetchMessages(chatId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    enabled: enabled && !!chatId,
  });
}

export function useCustomGroupChats(enabled = true) {
  return useQuery({
    queryKey: chatKeys.customGroupChats(),
    queryFn: () => fetchCustomGroupChats(),
    staleTime: 30 * 1000,
    enabled,
  });
}
