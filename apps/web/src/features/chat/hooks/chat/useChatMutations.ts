'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createDirectChat,
  addGroupChatMember,
  createCustomGroupChat,
  addCustomGroupChatMember,
} from '../../api/chat.api';
import { chatKeys } from './chat-query-keys';

export function useCreateDirectChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (participantId: string) => createDirectChat(participantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...chatKeys.all, 'teacher'] });
      queryClient.invalidateQueries({ queryKey: [...chatKeys.all, 'admin'] });
    },
  });
}

export function useAddGroupChatMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      addGroupChatMember(groupId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.list() });
      queryClient.invalidateQueries({ queryKey: chatKeys.details() });
      queryClient.invalidateQueries({ queryKey: [...chatKeys.all, 'admin'] });
    },
  });
}

export function useCreateCustomGroupChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; participantIds?: string[] }) =>
      createCustomGroupChat(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.list() });
      queryClient.invalidateQueries({ queryKey: chatKeys.details() });
      queryClient.invalidateQueries({ queryKey: chatKeys.customGroupChats() });
      queryClient.invalidateQueries({ queryKey: [...chatKeys.all, 'admin'] });
    },
  });
}

export function useAddCustomGroupChatMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatId, userId }: { chatId: string; userId: string }) =>
      addCustomGroupChatMember(chatId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.list() });
      queryClient.invalidateQueries({ queryKey: chatKeys.details() });
      queryClient.invalidateQueries({ queryKey: [...chatKeys.all, 'admin'] });
    },
  });
}
