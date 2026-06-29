'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from '@/config/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { readUrlSearchParam } from '@/shared/lib/url-search-params';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';
import { useAuthStore, getDashboardPath } from '@/features/auth/store/auth.store';
import { useMyTeachers } from '@/features/students/hooks/useStudents';
import { useChatStore } from '../../store/chat.store';
import { useSocket, useChats, useCreateDirectChat, clearChatUnreadInCache } from '../../hooks';
import { fetchChat } from '../../api/chat.api';
import { getChatThemeForRole } from '../../lib/chat-theme';
import type { Chat } from '../../types';
import type { ChatContainerProps, ChatContainerViewModel } from './chat-container.types';
import { getChatContainerLayout, resolveReturnToPath } from './chat-container.util';

export function useChatContainer({
  emptyTitle,
  emptyDescription,
  className,
}: ChatContainerProps): ChatContainerViewModel {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { searchParams, urlRevision, replaceAllParams } = useAppSearchUrl();
  const { user } = useAuthStore();
  const { activeChat, setActiveChat, isMobileListVisible, setMobileListVisible, setAccountKey } =
    useChatStore();
  const { data: chats = [], isLoading: isLoadingChats } = useChats();
  const createDirectChat = useCreateDirectChat();
  const { data: teachers = [], isLoading: isLoadingTeachers } = useMyTeachers(
    user?.role === 'STUDENT',
  );

  const isInitialMount = useRef(true);
  const [mobileChatPanelOpen, setMobileChatPanelOpen] = useState(false);

  const replaceSearchParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      replaceAllParams(mutate);
    },
    [replaceAllParams],
  );

  const ui = getChatThemeForRole(user?.role);
  const layout = getChatContainerLayout(className, user?.role, activeChat);
  const { isTeacher, isStudent } = layout;

  const returnToParam = readUrlSearchParam('returnTo', searchParams, urlRevision);
  const returnTo = returnToParam ? decodeURIComponent(returnToParam) : null;

  const conversationIdFromUrl = useMemo(
    () =>
      readUrlSearchParam('conversationId', searchParams, urlRevision) ||
      readUrlSearchParam('chatId', searchParams, urlRevision),
    [searchParams, urlRevision],
  );

  useEffect(() => {
    const key =
      user?.id && user?.role ? `${user.id}-${user.role.toLowerCase()}` : null;
    setAccountKey(key);
  }, [user?.id, user?.role, setAccountKey]);

  useSocket();

  const handleBackToPrevious = useCallback(() => {
    const safeReturnTo = resolveReturnToPath(returnTo);
    if (safeReturnTo) {
      router.push(safeReturnTo);
      return;
    }
    if (user?.role) {
      router.push(getDashboardPath(user.role));
    } else {
      router.push('/');
    }
  }, [returnTo, router, user?.role]);

  useEffect(() => {
    if (isInitialMount.current || isLoadingChats) return;

    if (!conversationIdFromUrl) {
      if (activeChat) {
        setActiveChat(null);
        setMobileListVisible(true);
      }
      return;
    }

    if (activeChat?.id === conversationIdFromUrl) return;

    const fromList = chats.find((chat) => chat.id === conversationIdFromUrl);
    if (fromList) {
      setActiveChat(fromList);
      setMobileListVisible(false);
      return;
    }

    let cancelled = false;
    fetchChat(conversationIdFromUrl)
      .then((chat) => {
        if (cancelled) return;
        setActiveChat(chat);
        setMobileListVisible(false);
      })
      .catch(() => {
        if (cancelled) return;
        replaceSearchParams((params) => {
          params.delete('chatId');
          params.delete('conversationId');
        });
      });

    return () => {
      cancelled = true;
    };
  }, [
    conversationIdFromUrl,
    urlRevision,
    activeChat,
    chats,
    isLoadingChats,
    replaceSearchParams,
    setActiveChat,
    setMobileListVisible,
  ]);

  useEffect(() => {
    if (isLoadingChats || !isInitialMount.current) return;

    const typeFromUrl = readUrlSearchParam('type', searchParams);
    const teacherIdFromUrl = readUrlSearchParam('teacherId', searchParams);
    if (isStudent && typeFromUrl === 'dm' && teacherIdFromUrl && isLoadingTeachers) {
      return;
    }

    const chatIdFromUrl = conversationIdFromUrl;

    if (!chatIdFromUrl && !teacherIdFromUrl) {
      if (activeChat) {
        setActiveChat(null);
      }
      isInitialMount.current = false;
      return;
    }

    if (isStudent && typeFromUrl === 'dm' && teacherIdFromUrl && teachers.length > 0) {
      const teacher = teachers.find((t) => t.userId === teacherIdFromUrl);
      if (teacher) {
        const existingChat = chats.find((chat) => {
          if (chat.type !== 'DIRECT') return false;
          return chat.participants.some((p) => p.userId === teacher.userId);
        });

        if (existingChat) {
          setActiveChat(existingChat);
          setMobileListVisible(false);
          replaceSearchParams((params) => {
            params.delete('type');
            params.delete('teacherId');
            params.set('chatId', existingChat.id);
          });
        } else {
          createDirectChat.mutate(teacher.userId, {
            onSuccess: (newChat) => {
              setActiveChat(newChat);
              setMobileListVisible(false);
              replaceSearchParams((params) => {
                params.delete('type');
                params.delete('teacherId');
                params.set('chatId', newChat.id);
              });
            },
          });
        }
        isInitialMount.current = false;
        return;
      }
    }

    if (chatIdFromUrl && chats.length > 0) {
      const chatFromList = chats.find((chat) => chat.id === chatIdFromUrl);
      if (chatFromList) {
        setActiveChat(chatFromList);
        setMobileListVisible(false);
      } else if (isTeacher || !isStudent) {
        fetchChat(chatIdFromUrl)
          .then((chat) => {
            setActiveChat(chat);
            setMobileListVisible(false);
          })
          .catch(() => {
            replaceSearchParams((params) => {
              params.delete('chatId');
              params.delete('conversationId');
            });
          });
      } else {
        replaceSearchParams((params) => {
          params.delete('chatId');
          params.delete('conversationId');
        });
      }
      isInitialMount.current = false;
    }
  }, [
    chats,
    isLoadingChats,
    isLoadingTeachers,
    teachers,
    searchParams,
    setActiveChat,
    setMobileListVisible,
    replaceSearchParams,
    isTeacher,
    isStudent,
    createDirectChat,
    conversationIdFromUrl,
    activeChat,
  ]);

  useEffect(() => {
    if (isInitialMount.current) return;

    const chatIdInUrl = conversationIdFromUrl;
    if (activeChat) {
      if (activeChat.id !== chatIdInUrl) {
        replaceSearchParams((params) => {
          params.set('conversationId', activeChat.id);
          params.delete('chatId');
        });
      }
    } else if (chatIdInUrl) {
      replaceSearchParams((params) => {
        params.delete('chatId');
        params.delete('conversationId');
      });
    }
  }, [activeChat, conversationIdFromUrl, replaceSearchParams, urlRevision]);

  const handleSelectChat = useCallback(
    (chat: Chat) => {
      clearChatUnreadInCache(queryClient, chat.id);
      setActiveChat({ ...chat, unreadCount: 0 });
      setMobileListVisible(false);
      setMobileChatPanelOpen(true);
      replaceSearchParams((params) => {
        params.delete('type');
        params.delete('teacherId');
        params.set('conversationId', chat.id);
        params.delete('chatId');
      });
    },
    [queryClient, replaceSearchParams, setActiveChat, setMobileListVisible],
  );

  const handleBack = useCallback(() => {
    setMobileListVisible(true);
    setActiveChat(null);
    replaceSearchParams((params) => {
      params.delete('chatId');
      params.delete('conversationId');
    });
  }, [replaceSearchParams, setActiveChat, setMobileListVisible]);

  useEffect(() => {
    if (activeChat && !isMobileListVisible) {
      setMobileChatPanelOpen(true);
    }
  }, [activeChat, isMobileListVisible]);

  const handleMobileBack = useCallback(() => {
    setMobileChatPanelOpen(false);
  }, []);

  const finalizeMobileChatClose = useCallback(() => {
    setMobileListVisible(true);
    setActiveChat(null);
    replaceSearchParams((params) => {
      params.delete('chatId');
      params.delete('conversationId');
    });
  }, [replaceSearchParams, setActiveChat, setMobileListVisible]);

  return {
    ui,
    layout,
    activeChat,
    isMobileListVisible,
    mobileChatPanelOpen,
    emptyTitle,
    emptyDescription,
    className,
    handleBackToPrevious,
    handleSelectChat,
    handleBack,
    handleMobileBack,
    finalizeMobileChatClose,
    setActiveChat,
  };
}
