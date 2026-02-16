'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  fetchChats,
  fetchChat,
  fetchMessages,
  createDirectChat,
  fetchAdminStudents,
  fetchAdminTeachers,
  fetchAdminGroups,
  fetchGroupChat,
  fetchTeacherGroups,
  fetchTeacherStudents,
  fetchTeacherAdmin,
  fetchStudentAdmin,
} from '../api/chat.api';
import type { AdminChatUser, AdminChatGroup, TeacherGroup, TeacherStudent, TeacherAdmin, StudentAdmin } from '../api/chat.api';

// Query keys
export const chatKeys = {
  all: ['chats'] as const,
  lists: () => [...chatKeys.all, 'list'] as const,
  list: () => [...chatKeys.lists()] as const,
  details: () => [...chatKeys.all, 'detail'] as const,
  detail: (id: string) => [...chatKeys.details(), id] as const,
  messages: (chatId: string) => [...chatKeys.all, 'messages', chatId] as const,
  // Admin chat lists
  adminStudents: (search?: string) => [...chatKeys.all, 'admin', 'students', search] as const,
  adminTeachers: (search?: string) => [...chatKeys.all, 'admin', 'teachers', search] as const,
  adminGroups: (search?: string) => [...chatKeys.all, 'admin', 'groups', search] as const,
  // Teacher chat lists
  teacherGroups: (search?: string) => [...chatKeys.all, 'teacher', 'groups', search] as const,
  teacherStudents: (search?: string) => [...chatKeys.all, 'teacher', 'students', search] as const,
  teacherAdmin: () => [...chatKeys.all, 'teacher', 'admin'] as const,
  // Student chat lists
  studentAdmin: () => [...chatKeys.all, 'student', 'admin'] as const,
};

/**
 * Hook to fetch all chats
 */
export function useChats() {
  return useQuery({
    queryKey: chatKeys.list(),
    queryFn: () => fetchChats(),
  });
}

/**
 * Hook to fetch a single chat
 */
export function useChatDetail(chatId: string, enabled = true) {
  return useQuery({
    queryKey: chatKeys.detail(chatId),
    queryFn: () => fetchChat(chatId),
    enabled: enabled && !!chatId,
  });
}

/**
 * Hook to fetch messages with infinite scroll
 */
export function useMessages(chatId: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: chatKeys.messages(chatId),
    queryFn: ({ pageParam }) => fetchMessages(chatId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    enabled: enabled && !!chatId,
  });
}

/**
 * Hook to create a direct chat
 */
export function useCreateDirectChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (participantId: string) => createDirectChat(participantId),
    onSuccess: () => {
      // Invalidate all chat-related queries to ensure both sides see the conversation
      queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
      // Invalidate teacher-specific queries
      queryClient.invalidateQueries({ queryKey: [...chatKeys.all, 'teacher'] });
      // Invalidate admin-specific queries
      queryClient.invalidateQueries({ queryKey: [...chatKeys.all, 'admin'] });
    },
  });
}

/**
 * Hook to add a new message to cache (for real-time updates)
 */
export function useAddMessageToCache() {
  const queryClient = useQueryClient();

  return (chatId: string, message: unknown) => {
    queryClient.setQueryData(
      chatKeys.messages(chatId),
      (oldData: { pages: { items: unknown[] }[] } | undefined) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page, index) => {
            if (index === 0) {
              return {
                ...page,
                items: [...page.items, message],
              };
            }
            return page;
          }),
        };
      }
    );

    // Also update the chat list with the last message
    queryClient.invalidateQueries({ queryKey: chatKeys.lists() });
  };
}

/**
 * Hook to update a message in cache
 */
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
              msg.id === messageId ? { ...msg, ...updates } : msg
            ),
          })),
        };
      }
    );
  };
}

/**
 * Hook to remove a message from cache
 */
export function useRemoveMessageFromCache() {
  const queryClient = useQueryClient();

  return (chatId: string, messageId: string) => {
    queryClient.setQueryData(
      chatKeys.messages(chatId),
      (oldData: { pages: { items: { id: string }[] }[] } | undefined) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            items: page.items.filter((msg) => msg.id !== messageId),
          })),
        };
      }
    );
  };
}

/**
 * Admin-only: Hook to fetch students list for chat
 */
export function useAdminStudents(search?: string) {
  return useQuery({
    queryKey: chatKeys.adminStudents(search),
    queryFn: () => fetchAdminStudents(search),
    staleTime: 60 * 1000, // Cache for 1 minute
  });
}

/**
 * Admin-only: Hook to fetch teachers list for chat
 */
export function useAdminTeachers(search?: string) {
  return useQuery({
    queryKey: chatKeys.adminTeachers(search),
    queryFn: () => fetchAdminTeachers(search),
    staleTime: 60 * 1000, // Cache for 1 minute
  });
}

/**
 * Admin-only: Hook to fetch groups list for chat
 */
export function useAdminGroups(search?: string) {
  return useQuery({
    queryKey: chatKeys.adminGroups(search),
    queryFn: () => fetchAdminGroups(search),
    staleTime: 60 * 1000, // Cache for 1 minute
  });
}

/**
 * Teacher-only: Hook to fetch teacher's assigned groups
 */
export function useTeacherGroups(search?: string) {
  return useQuery({
    queryKey: chatKeys.teacherGroups(search),
    queryFn: () => fetchTeacherGroups(search),
    // Set staleTime to 0 to ensure fresh data after mutations
    // This prevents stale cache from hiding newly assigned groups
    staleTime: 0,
    // Refetch on window focus to catch updates from other tabs/windows
    refetchOnWindowFocus: true,
  });
}

/**
 * Teacher-only: Hook to fetch teacher's assigned students
 */
export function useTeacherStudents(search?: string) {
  return useQuery({
    queryKey: chatKeys.teacherStudents(search),
    queryFn: () => fetchTeacherStudents(search),
    staleTime: 60 * 1000, // Cache for 1 minute
  });
}

/**
 * Teacher-only: Hook to fetch admin user info for direct messaging
 */
export function useTeacherAdmin() {
  return useQuery({
    queryKey: chatKeys.teacherAdmin(),
    queryFn: () => fetchTeacherAdmin(),
    staleTime: 60 * 1000, // Cache for 1 minute
  });
}

/**
 * Student-only: Hook to fetch admin user info for direct messaging
 */
export function useStudentAdmin() {
  return useQuery({
    queryKey: chatKeys.studentAdmin(),
    queryFn: () => fetchStudentAdmin(),
    staleTime: 60 * 1000, // Cache for 1 minute
  });
}
