'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store/auth.store';
import {
  fetchChats,
  fetchChat,
  fetchMessages,
  createDirectChat,
  fetchAdminStudents,
  fetchAdminTeachers,
  fetchAdminGroups,
  fetchTeacherGroups,
  fetchTeacherStudents,
  fetchTeacherAdmin,
  fetchStudentAdmin,
} from '../api/chat.api';

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
    // Update messages cache
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

    // Update chat list cache with new lastMessage and lastMessageAt
    // This prevents unnecessary refetches and keeps the conversation at the top
    queryClient.setQueryData(
      chatKeys.list(),
      (oldData: Array<{ id: string; lastMessage?: unknown; lastMessageAt?: string; unreadCount?: number; updatedAt: string }> | undefined) => {
        if (!oldData) return oldData;

        const messageWithDate = message as { createdAt: string; senderId?: string };
        const now = new Date().toISOString();
        const lastMessageAt = messageWithDate?.createdAt || now;

        // Get current user to check if message is from another user
        const { user } = useAuthStore.getState();
        const isFromOtherUser = messageWithDate?.senderId && messageWithDate.senderId !== user?.id;

        return oldData.map((chat) => {
          if (chat.id === chatId) {
            // Update lastMessage, lastMessageAt, and updatedAt
            // Also increment unreadCount if message is from another user
            const newUnreadCount = isFromOtherUser 
              ? (chat.unreadCount || 0) + 1 
              : chat.unreadCount;

            return {
              ...chat,
              lastMessage: message,
              lastMessageAt,
              updatedAt: now,
              unreadCount: newUnreadCount,
            };
          }
          return chat;
        }).sort((a, b) => {
          // Re-sort by lastMessageAt (newest first)
          const aTime = a.lastMessageAt 
            ? new Date(a.lastMessageAt).getTime()
            : (a.lastMessage && typeof a.lastMessage === 'object' && 'createdAt' in a.lastMessage ? new Date((a.lastMessage as { createdAt: string }).createdAt).getTime() : new Date(a.updatedAt).getTime());
          const bTime = b.lastMessageAt 
            ? new Date(b.lastMessageAt).getTime()
            : (b.lastMessage && typeof b.lastMessage === 'object' && 'createdAt' in b.lastMessage ? new Date((b.lastMessage as { createdAt: string }).createdAt).getTime() : new Date(b.updatedAt).getTime());
          return bTime - aTime; // DESC order
        });
      }
    );
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
 * Hook to update chat unread count in cache after mark-as-read
 * This prevents infinite loops by updating cache directly instead of invalidating
 */
export function useUpdateChatUnreadCount() {
  const queryClient = useQueryClient();

  return (chatId: string, unreadCount: number) => {
    // Update the chat list cache
    queryClient.setQueryData(
      chatKeys.list(),
      (oldData: Array<{ id: string; unreadCount?: number }> | undefined) => {
        if (!oldData) return oldData;

        return oldData.map((chat) =>
          chat.id === chatId ? { ...chat, unreadCount } : chat
        );
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

/**
 * Hook to calculate unread message counts per section (Groups/Teachers/Students)
 * Used for admin chat sidebar badges
 */
export function useAdminUnreadCounts() {
  const { user } = useAuthStore();
  const { data: chats = [], isLoading } = useChats();

  const counts = React.useMemo(() => {
    if (!user || !chats.length) {
      return {
        groups: 0,
        teachers: 0,
        students: 0,
      };
    }

    let groupsUnread = 0;
    let teachersUnread = 0;
    let studentsUnread = 0;

    chats.forEach((chat) => {
      const unreadCount = chat.unreadCount || 0;
      if (unreadCount === 0) return;

      if (chat.type === 'GROUP') {
        groupsUnread += unreadCount;
      } else if (chat.type === 'DIRECT') {
        // Find the other participant (not the current user)
        const otherParticipant = chat.participants.find(
          (p) => p.userId !== user.id
        );
        
        if (otherParticipant?.user?.role === 'TEACHER') {
          teachersUnread += unreadCount;
        } else if (otherParticipant?.user?.role === 'STUDENT') {
          studentsUnread += unreadCount;
        }
      }
    });

    return {
      groups: groupsUnread,
      teachers: teachersUnread,
      students: studentsUnread,
    };
  }, [chats, user]);

  return {
    counts,
    isLoading,
  };
}

/**
 * Hook to calculate unread message counts per section (Groups/Students/Admin)
 * Used for teacher chat sidebar badges
 */
export function useTeacherUnreadCounts() {
  const { data: groups = [], isLoading: isLoadingGroups } = useTeacherGroups();
  const { data: students = [], isLoading: isLoadingStudents } = useTeacherStudents();
  const { data: admin, isLoading: isLoadingAdmin } = useTeacherAdmin();

  const counts = React.useMemo(() => {
    const groupsUnread = groups.reduce((sum, group) => sum + (group.unreadCount || 0), 0);
    const studentsUnread = students.reduce((sum, student) => sum + (student.unreadCount || 0), 0);
    const adminUnread = admin?.unreadCount || 0;

    return {
      groups: groupsUnread,
      students: studentsUnread,
      admin: adminUnread,
    };
  }, [groups, students, admin]);

  return {
    counts,
    isLoading: isLoadingGroups || isLoadingStudents || isLoadingAdmin,
  };
}

/**
 * Hook to calculate unread message counts per section (Chats/My Teachers/Admin)
 * Used for student chat sidebar badges
 */
export function useStudentUnreadCounts() {
  const { user } = useAuthStore();
  const { data: chats = [], isLoading: isLoadingChats } = useChats();
  const { data: admin, isLoading: isLoadingAdmin } = useStudentAdmin();

  const counts = React.useMemo(() => {
    if (!user) {
      return {
        chats: 0,
        teachers: 0,
        admin: 0,
      };
    }

    // Calculate unread for chats (excluding admin chats)
    let chatsUnread = 0;
    let teachersUnread = 0;

    chats.forEach((chat) => {
      const unreadCount = chat.unreadCount || 0;
      if (unreadCount === 0) return;

      if (chat.type === 'GROUP') {
        // Group chats count towards "Chats" tab
        chatsUnread += unreadCount;
      } else if (chat.type === 'DIRECT') {
        // Find the other participant (not the current user)
        const otherParticipant = chat.participants.find(
          (p) => p.userId !== user.id
        );
        
        // Exclude admin from chats count (admin has its own tab)
        if (otherParticipant?.user?.role === 'ADMIN') {
          // Admin is handled separately
          return;
        } else if (otherParticipant?.user?.role === 'TEACHER') {
          // Teachers count towards "My Teachers" tab
          teachersUnread += unreadCount;
        } else {
          // Other direct chats count towards "Chats" tab
          chatsUnread += unreadCount;
        }
      }
    });

    const adminUnread = admin?.unreadCount || 0;

    return {
      chats: chatsUnread,
      teachers: teachersUnread,
      admin: adminUnread,
    };
  }, [chats, admin, user]);

  return {
    counts,
    isLoading: isLoadingChats || isLoadingAdmin,
  };
}
