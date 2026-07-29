'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { readUrlSearchParam } from '@/shared/lib/url-search-params';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';
import { useRouter } from '@/config/navigation';
import { fetchChat } from '../../api/chat.api';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore, getDashboardPath } from '@/features/auth/store/auth.store';
import { useChatStore } from '../../store/chat.store';
import {
  useSocket,
  useChatDetail,
  useChats,
  chatKeys,
  clearChatUnreadInCache,
  useEscapeToLeaveChatConversation,
} from '../../hooks';
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
import {
  chatMatchesConversationParam,
  clearConversationSearchParams,
  findChatByConversationSlug,
  readConversationParam,
  setConversationSearchParam,
} from '../../lib/chat-conversation-url';

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
  const { data: chats = [], isLoading: isLoadingChats } = useChats();
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

  const conversationFromUrl = useMemo(
    () =>
      readConversationParam((key) => readUrlSearchParam(key, searchParams, urlRevision)),
    [searchParams, urlRevision],
  );

  const legacyConversationId =
    conversationFromUrl?.kind === 'id' ? conversationFromUrl.value : null;

  const returnToParam = readUrlSearchParam('returnTo', searchParams, urlRevision);
  const returnTo = returnToParam ? decodeURIComponent(returnToParam) : null;

  useSocket();

  const shouldFetchChat =
    Boolean(legacyConversationId) && isInitialMount.current && !activeChat;
  const { data: chatFromUrl, isLoading: isLoadingChatFromUrl, isError: isChatError } = useChatDetail(
    legacyConversationId || '',
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

  const activeChatId = activeChat?.id ?? null;

  // URL → store only. Handlers update the URL; a reverse sync effect caused an infinite loop.
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
        clearChatDeleteGroupParam(params);
      });
      return;
    }

    let cancelled = false;
    fetchChat(conversationFromUrl.value)
      .then((chat) => {
        if (cancelled) return;
        setActiveChat(chat);
        setMobileListVisible(false);
        // Migrate legacy id URL → human-readable conversation slug
        replaceSearchParams((params) => {
          setConversationSearchParam(params, chat, user?.id, chats);
          clearChatDeleteGroupParam(params);
        });
      })
      .catch(() => {
        if (cancelled) return;
        replaceSearchParams((params) => {
          clearConversationSearchParams(params);
          clearChatDeleteGroupParam(params);
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

  const handleTabChange = useCallback(
    (tab: AdminChatTab) => {
      setActiveTab(tab);
      replaceSearchParams((params) => {
        params.set('tab', tab);
        clearConversationSearchParams(params);
        clearChatDeleteGroupParam(params);
      });
      setActiveChat(null);
    },
    [replaceSearchParams, setActiveChat],
  );

  useEffect(() => {
    if (!isInitialMount.current) return;

    if (!conversationFromUrl) {
      if (activeChat) setActiveChat(null);
      isInitialMount.current = false;
      return;
    }

    if (conversationFromUrl.kind === 'slug') {
      if (isLoadingChats) return;
      const matched = findChatByConversationSlug(chats, conversationFromUrl.value, user?.id);
      if (matched) {
        setActiveChat(matched);
        setMobileListVisible(false);
        if (matched.type === 'GROUP' && matched.groupId && activeTab !== 'groups') {
          setActiveTab('groups');
          replaceSearchParams((params) => params.set('tab', 'groups'));
        } else if (matched.type === 'DIRECT') {
          const otherParticipant = matched.participants.find((p) => p.userId !== user?.id);
          if (otherParticipant?.user.role === 'STUDENT' && activeTab !== 'students') {
            setActiveTab('students');
            replaceSearchParams((params) => params.set('tab', 'students'));
          } else if (otherParticipant?.user.role === 'TEACHER' && activeTab !== 'teachers') {
            setActiveTab('teachers');
            replaceSearchParams((params) => params.set('tab', 'teachers'));
          }
        }
      } else {
        replaceSearchParams((params) => {
          clearConversationSearchParams(params);
          clearChatDeleteGroupParam(params);
        });
      }
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

      replaceSearchParams((params) => {
        setConversationSearchParam(params, chatFromUrl, user?.id, chats);
      });

      isInitialMount.current = false;
    } else if (!isLoadingChatFromUrl && isChatError) {
      replaceSearchParams((params) => {
        clearConversationSearchParams(params);
        clearChatDeleteGroupParam(params);
      });
      isInitialMount.current = false;
    }
  }, [
    conversationFromUrl,
    chatFromUrl,
    isLoadingChatFromUrl,
    isChatError,
    isLoadingChats,
    chats,
    setActiveChat,
    setMobileListVisible,
    replaceSearchParams,
    activeTab,
    user,
    activeChat,
  ]);

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
      useChatStore.getState().setMemberDmReturnChat(null);
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

      const peers =
        (queryClient.getQueryData(chatKeys.list()) as Chat[] | undefined) ?? chats;

      replaceSearchParams((params) => {
        setConversationSearchParam(params, chat, user?.id, peers);
        if (activeTab) params.set('tab', activeTab);
        if (params.get('deleteGroup') !== chat.id) {
          clearChatDeleteGroupParam(params);
        }
      });
    },
    [activeTab, chats, queryClient, replaceSearchParams, setActiveChat, setMobileListVisible, user?.id],
  );

  const handleBack = useCallback(() => {
    setMobileListVisible(true);
    setActiveChat(null);
    replaceSearchParams((params) => {
      clearConversationSearchParams(params);
      clearChatDeleteGroupParam(params);
    });
  }, [replaceSearchParams, setActiveChat, setMobileListVisible]);

  useEscapeToLeaveChatConversation(Boolean(activeChat), handleBack);

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
      clearConversationSearchParams(params);
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
      const peers =
        (queryClient.getQueryData(chatKeys.list()) as Chat[] | undefined) ?? chats;
      replaceSearchParams((params) => {
        setConversationSearchParam(params, chat, user?.id, peers);
        if (activeTab) params.set('tab', activeTab);
        clearChatDeleteGroupParam(params);
      });
    },
    [activeTab, chats, queryClient, replaceSearchParams, setActiveChat, setMobileListVisible, user?.id],
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
