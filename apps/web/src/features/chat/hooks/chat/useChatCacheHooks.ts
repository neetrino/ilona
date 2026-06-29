'use client';

import { useQueryClient } from '@tanstack/react-query';
import type { Message } from '../../types';
import { chatKeys } from './chat-query-keys';
import {
  clearChatUnreadInCache,
  removeMessageFromMessagesCache,
  upsertIncomingMessageInCache,
} from './chat-cache.util';

export function useAddMessageToCache() {
  const queryClient = useQueryClient();

  return (chatId: string, message: unknown) => {
    upsertIncomingMessageInCache(queryClient, chatId, message as Message);
  };
}

export function useUpdateMessageInCache() {
  const queryClient = useQueryClient();

  return (chatId: string, messageId: string, updates: Partial<unknown>) => {
    queryClient.setQueryData(
      chatKeys.messages(chatId),
      (oldData: { pages: { items: { id: string }[] }[] } | undefined) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            items: page.items.map((msg) =>
              msg.id === messageId ? { ...msg, ...updates } : msg,
            ),
          })),
        };
      },
    );
  };
}

export function useRemoveMessageFromCache() {
  const queryClient = useQueryClient();

  return (chatId: string, messageId: string) => {
    removeMessageFromMessagesCache(queryClient, chatId, messageId);
  };
}

export function useUpdateChatUnreadCount() {
  const queryClient = useQueryClient();

  return (chatId: string, unreadCount: number) => {
    if (unreadCount === 0) {
      clearChatUnreadInCache(queryClient, chatId);
      return;
    }

    queryClient.setQueryData(
      chatKeys.list(),
      (oldData: Array<{ id: string; unreadCount?: number }> | undefined) => {
        if (!oldData) return oldData;

        return oldData.map((chat) =>
          chat.id === chatId ? { ...chat, unreadCount } : chat,
        );
      },
    );
  };
}
