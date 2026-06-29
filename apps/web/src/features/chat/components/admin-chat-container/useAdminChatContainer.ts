'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { readUrlSearchParam } from '@/shared/lib/url-search-params';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';
import { useRouter } from '@/config/navigation';
import { fetchChat } from '../../api/chat.api';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore, getDashboardPath } from '@/features/auth/store/auth.store';
import { useChatStore } from '../../store/chat.store';
import { useSocket, useChatDetail, chatKeys, clearChatUnreadInCache } from '../../hooks';
import type { Chat } from '../../types';
import type {
  AdminChatContainerProps,
  AdminChatContainerViewModel,
  AdminChatTab,
} from './admin-chat-container.types';
import {
  ADMIN_CHAT_VALID_TABS,
  getAdminChatContainerLayout,
  resolveAdminReturnToPath,
} from './admin-chat-container.util';
import { clearChatDeleteGroupParam } from '../../lib/chat-url-params';

export function useAdminChatContainer({
  emptyTitle,
  emptyDescription,
  className,
}: AdminChatContainerProps): AdminChatContainerViewModel {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { searchParams, urlRevision, replaceAllParams } = useAppSearchUrl();
  const { user } = useAuthStore();
  const { activeChat, setActiveChat, isMobileListVisible, setMobileListVisible, setAccountKey } =
    useChatStore();
  const isInitialMount = useRef(true);
  const layout = getAdminChatContainerLayout(className);

  const replaceSearchParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => replaceAllParams(mutate),
    [replaceAllParams],
  );

  useEffect(() => {
    const key = user?.id && user?.role ? `${user.id}-${user.role.toLowerCase()}` : null;
    setAccountKey(key);
  }, [user?.id, user?.role, setAccountKey]);

  const tabFromUrl = readUrlSearchParam('tab', searchParams, urlRevision) as AdminChatTab | null;
  const initialTab =
    tabFromUrl && ADMIN_CHAT_VALID_TABS.includes(tabFromUrl) ? tabFromUrl : null;
  const [activeTab, setActiveTab] = useState<AdminChatTab | null>(initialTab);
  const [showCreateGroupChatModal, setShowCreateGroupChatModal] = useState(false);
  const [mobileChatPanelOpen, setMobileChatPanelOpen] = useState(false);

  const conversationIdFromUrl = useMemo(
    () =>
      readUrlSearchParam('conversationId', searchParams, urlRevision) ||
      readUrlSearchParam('chatId', searchParams, urlRevision),
    [searchParams, urlRevision],
  );

  const returnToParam = readUrlSearchParam('returnTo', searchParams, urlRevision);
  const returnTo = returnToParam ? decodeURIComponent(returnToParam) : null;

  useSocket();

  const shouldFetchChat = !!conversationIdFromUrl && isInitialMount.current && !activeChat;
  const { data: chatFromUrl, isLoading: isLoadingChatFromUrl, isError: isChatError } = useChatDetail(
    conversationIdFromUrl || '',
    shouldFetchChat,
  );

  useEffect(() => {
    const tab = readUrlSearchParam('tab', searchParams, urlRevision) as AdminChatTab | null;
    if (tab && ADMIN_CHAT_VALID_TABS.includes(tab)) {
      setActiveTab(tab);
    } else if (!tab) {
      setActiveTab(null);
    }
  }, [searchParams, urlRevision]);

  useEffect(() => {
    if (isInitialMount.current) return;

    if (!conversationIdFromUrl) {
      if (activeChat) {
        setActiveChat(null);
        setMobileListVisible(true);
      }
      return;
    }

    if (activeChat?.id === conversationIdFromUrl) return;

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
          params.delete('conversationId');
          params.delete('chatId');
          clearChatDeleteGroupParam(params);
        });
      });

    return () => {
      cancelled = true;
    };
  }, [
    conversationIdFromUrl,
    urlRevision,
    activeChat,
    replaceSearchParams,
    setActiveChat,
    setMobileListVisible,
  ]);

  const handleTabChange = useCallback(
    (tab: AdminChatTab) => {
      setActiveTab(tab);
      replaceSearchParams((params) => {
        params.set('tab', tab);
        params.delete('conversationId');
        clearChatDeleteGroupParam(params);
      });
      setActiveChat(null);
    },
    [replaceSearchParams, setActiveChat],
  );

  useEffect(() => {
    if (!isInitialMount.current) return;

    if (!conversationIdFromUrl) {
      if (activeChat) setActiveChat(null);
      isInitialMount.current = false;
      return;
    }

    if (chatFromUrl) {
      setActiveChat(chatFromUrl);
      setMobileListVisible(false);

      if (chatFromUrl.type === 'GROUP' && chatFromUrl.groupId && activeTab !== 'groups') {
        setActiveTab('groups');
        replaceSearchParams((params) => params.set('tab', 'groups'));
      } else if (chatFromUrl.type === 'DIRECT') {
        const otherParticipant = chatFromUrl.participants.find((p) => p.userId !== user?.id);
        if (otherParticipant?.user.role === 'STUDENT' && activeTab !== 'students') {
          setActiveTab('students');
          replaceSearchParams((params) => params.set('tab', 'students'));
        } else if (otherParticipant?.user.role === 'TEACHER' && activeTab !== 'teachers') {
          setActiveTab('teachers');
          replaceSearchParams((params) => params.set('tab', 'teachers'));
        }
      }

      isInitialMount.current = false;
    } else if (!isLoadingChatFromUrl && isChatError) {
      replaceSearchParams((params) => {
        params.delete('conversationId');
        clearChatDeleteGroupParam(params);
      });
      isInitialMount.current = false;
    }
  }, [
    conversationIdFromUrl,
    chatFromUrl,
    isLoadingChatFromUrl,
    isChatError,
    setActiveChat,
    setMobileListVisible,
    replaceSearchParams,
    activeTab,
    user,
    activeChat,
  ]);

  useEffect(() => {
    if (isInitialMount.current) return;

    const conversationIdInUrl = readUrlSearchParam('conversationId', searchParams, urlRevision);
    if (activeChat) {
      if (activeChat.id !== conversationIdInUrl) {
        replaceSearchParams((params) => {
          params.set('conversationId', activeChat.id);
          if (!params.get('tab') && activeTab) params.set('tab', activeTab);
        });
      }
    } else if (conversationIdInUrl) {
      replaceSearchParams((params) => {
        params.delete('conversationId');
        clearChatDeleteGroupParam(params);
      });
    }
  }, [activeChat, activeTab, replaceSearchParams, searchParams, urlRevision]);

  const handleBackToPrevious = useCallback(() => {
    const safeReturnTo = resolveAdminReturnToPath(returnTo);
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

  const handleSelectChat = useCallback(
    (chat: Chat) => {
      clearChatUnreadInCache(queryClient, chat.id);
      setActiveChat({ ...chat, unreadCount: 0 });
      setMobileListVisible(false);
      setMobileChatPanelOpen(true);

      queryClient.setQueryData(chatKeys.list(), (oldData: Chat[] | undefined) => {
        if (!oldData) return [chat];
        const existingIndex = oldData.findIndex((c) => c.id === chat.id);
        if (existingIndex >= 0) {
          const updated = [...oldData];
          updated[existingIndex] = chat;
          return updated;
        }
        return [chat, ...oldData];
      });

      replaceSearchParams((params) => {
        params.set('conversationId', chat.id);
        if (activeTab) params.set('tab', activeTab);
        if (params.get('deleteGroup') !== chat.id) {
          clearChatDeleteGroupParam(params);
        }
      });
    },
    [activeTab, queryClient, replaceSearchParams, setActiveChat, setMobileListVisible],
  );

  const handleBack = useCallback(() => {
    setMobileListVisible(true);
    setActiveChat(null);
    replaceSearchParams((params) => {
      params.delete('conversationId');
      clearChatDeleteGroupParam(params);
    });
  }, [replaceSearchParams, setActiveChat, setMobileListVisible]);

  useEffect(() => {
    if (activeChat && !isMobileListVisible) {
      setMobileChatPanelOpen(true);
    }
  }, [activeChat, isMobileListVisible]);

  const handleMobileBack = useCallback(() => setMobileChatPanelOpen(false), []);

  const finalizeMobileChatClose = useCallback(() => {
    setMobileListVisible(true);
    setActiveChat(null);
    replaceSearchParams((params) => {
      params.delete('conversationId');
      clearChatDeleteGroupParam(params);
    });
  }, [replaceSearchParams, setActiveChat, setMobileListVisible]);

  const handleCustomGroupChatCreated = useCallback(
    (chat: Chat) => {
      setActiveChat(chat);
      setMobileListVisible(false);
      setMobileChatPanelOpen(true);
      setShowCreateGroupChatModal(false);
      queryClient.setQueryData(chatKeys.list(), (oldData: Chat[] | undefined) => {
        if (!oldData) return [chat];
        if (oldData.find((c) => c.id === chat.id)) return oldData;
        return [chat, ...oldData];
      });
      replaceSearchParams((params) => {
        params.set('conversationId', chat.id);
        if (activeTab) params.set('tab', activeTab);
        clearChatDeleteGroupParam(params);
      });
    },
    [activeTab, queryClient, replaceSearchParams, setActiveChat, setMobileListVisible],
  );

  return {
    layout,
    activeChat,
    activeTab,
    isMobileListVisible,
    mobileChatPanelOpen,
    showCreateGroupChatModal,
    emptyTitle,
    emptyDescription,
    className,
    handleBackToPrevious,
    handleTabChange,
    handleSelectChat,
    handleBack,
    handleMobileBack,
    finalizeMobileChatClose,
    handleCustomGroupChatCreated,
    setActiveChat,
    setShowCreateGroupChatModal,
  };
}
