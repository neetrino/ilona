'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from '@/config/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { readUrlSearchParam } from '@/shared/lib/url-search-params';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';
import { useAuthStore, getDashboardPath } from '@/features/auth/store/auth.store';
import { useMyTeachers } from '@/features/students/hooks/useStudents';
import { useChatStore } from '../../store/chat.store';
import {
  useSocket,
  useChats,
  useCreateDirectChat,
  clearChatUnreadInCache,
  useEscapeToLeaveChatConversation,
} from '../../hooks';
import { fetchChat } from '../../api/chat.api';
import { getChatThemeForRole } from '../../lib/chat-theme';
import type { Chat } from '../../types';
import type { ChatContainerProps, ChatContainerViewModel } from './chat-container.types';
import { getChatContainerLayout, resolveReturnToPath } from './chat-container.util';
import {
  chatMatchesConversationParam,
  clearConversationSearchParams,
  findChatByConversationSlug,
  readConversationParam,
  setConversationSearchParam,
} from '../../lib/chat-conversation-url';

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

  const conversationFromUrl = useMemo(
    () =>
      readConversationParam((key) => readUrlSearchParam(key, searchParams, urlRevision)),
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

  const activeChatId = activeChat?.id ?? null;

  // URL is the source of truth after mount. User actions update both store and URL;
  // this effect only mirrors URL → store (never the reverse) so the two cannot ping-pong.
  useEffect(() => {
    if (isInitialMount.current || isLoadingChats) return;

    if (!conversationFromUrl) {
      if (activeChatId) {
        setActiveChat(null);
        setMobileListVisible(true);
      }
      return;
    }

    if (
      activeChat &&
      chatMatchesConversationParam(activeChat, conversationFromUrl, user?.id, chats)
    ) {
      return;
    }

    if (conversationFromUrl.kind === 'slug') {
      const matched = findChatByConversationSlug(chats, conversationFromUrl.value, user?.id);
      if (matched) {
        setActiveChat(matched);
        setMobileListVisible(false);
        return;
      }
      replaceSearchParams((params) => {
        clearConversationSearchParams(params);
      });
      return;
    }

    const fromList = chats.find((chat) => chat.id === conversationFromUrl.value);
    if (fromList) {
      setActiveChat(fromList);
      setMobileListVisible(false);
      replaceSearchParams((params) => {
        setConversationSearchParam(params, fromList, user?.id, chats);
      });
      return;
    }

    let cancelled = false;
    fetchChat(conversationFromUrl.value)
      .then((chat) => {
        if (cancelled) return;
        setActiveChat(chat);
        setMobileListVisible(false);
        replaceSearchParams((params) => {
          setConversationSearchParam(params, chat, user?.id, chats);
        });
      })
      .catch(() => {
        if (cancelled) return;
        replaceSearchParams((params) => {
          clearConversationSearchParams(params);
        });
      });

    return () => {
      cancelled = true;
    };
  }, [
    conversationFromUrl,
    urlRevision,
    activeChat,
    activeChatId,
    chats,
    isLoadingChats,
    replaceSearchParams,
    setActiveChat,
    setMobileListVisible,
    user?.id,
  ]);

  useEffect(() => {
    if (isLoadingChats || !isInitialMount.current) return;

    const typeFromUrl = readUrlSearchParam('type', searchParams, urlRevision);
    const teacherIdFromUrl = readUrlSearchParam('teacherId', searchParams, urlRevision);
    if (isStudent && typeFromUrl === 'dm' && teacherIdFromUrl && isLoadingTeachers) {
      return;
    }

    if (!conversationFromUrl && !teacherIdFromUrl) {
      if (activeChatId) {
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
            setConversationSearchParam(params, existingChat, user?.id, chats);
          });
        } else {
          createDirectChat.mutate(teacher.userId, {
            onSuccess: (newChat) => {
              setActiveChat(newChat);
              setMobileListVisible(false);
              replaceSearchParams((params) => {
                params.delete('type');
                params.delete('teacherId');
                setConversationSearchParam(params, newChat, user?.id, chats);
              });
            },
          });
        }
        isInitialMount.current = false;
        return;
      }
    }

    if (conversationFromUrl && chats.length > 0) {
      if (conversationFromUrl.kind === 'slug') {
        const matched = findChatByConversationSlug(chats, conversationFromUrl.value, user?.id);
        if (matched) {
          setActiveChat(matched);
          setMobileListVisible(false);
        } else {
          replaceSearchParams((params) => {
            clearConversationSearchParams(params);
          });
        }
        isInitialMount.current = false;
        return;
      }

      const chatFromList = chats.find((chat) => chat.id === conversationFromUrl.value);
      if (chatFromList) {
        setActiveChat(chatFromList);
        setMobileListVisible(false);
        replaceSearchParams((params) => {
          setConversationSearchParam(params, chatFromList, user?.id, chats);
        });
      } else if (isTeacher || !isStudent) {
        fetchChat(conversationFromUrl.value)
          .then((chat) => {
            setActiveChat(chat);
            setMobileListVisible(false);
            replaceSearchParams((params) => {
              setConversationSearchParam(params, chat, user?.id, chats);
            });
          })
          .catch(() => {
            replaceSearchParams((params) => {
              clearConversationSearchParams(params);
            });
          });
      } else {
        replaceSearchParams((params) => {
          clearConversationSearchParams(params);
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
    urlRevision,
    setActiveChat,
    setMobileListVisible,
    replaceSearchParams,
    isTeacher,
    isStudent,
    createDirectChat,
    conversationFromUrl,
    activeChatId,
    user?.id,
  ]);

  const handleSelectChat = useCallback(
    (chat: Chat) => {
      clearChatUnreadInCache(queryClient, chat.id);
      setActiveChat({ ...chat, unreadCount: 0 });
      setMobileListVisible(false);
      setMobileChatPanelOpen(true);
      replaceSearchParams((params) => {
        params.delete('type');
        params.delete('teacherId');
        setConversationSearchParam(params, chat, user?.id, chats);
      });
    },
    [chats, queryClient, replaceSearchParams, setActiveChat, setMobileListVisible, user?.id],
  );

  const handleBack = useCallback(() => {
    setMobileListVisible(true);
    setActiveChat(null);
    replaceSearchParams((params) => {
      clearConversationSearchParams(params);
    });
  }, [replaceSearchParams, setActiveChat, setMobileListVisible]);

  useEscapeToLeaveChatConversation(Boolean(activeChat), handleBack);

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
      clearConversationSearchParams(params);
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
