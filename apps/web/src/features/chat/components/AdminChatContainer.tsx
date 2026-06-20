'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { readUrlSearchParam } from '@/shared/lib/url-search-params';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';
import { useRouter } from '@/config/navigation';
import { fetchChat } from '../api/chat.api';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore, getDashboardPath } from '@/features/auth/store/auth.store';
import { AdminChatList } from './AdminChatList';
import { ChatWindow } from './ChatWindow';
import { CreateGroupChatModal } from './CreateGroupChatModal';
import { ChatBackButton } from './ChatBackButton';
import { ChatEmptyState } from './ChatEmptyState';
import { MobileChatSlidePanel } from './MobileChatSlidePanel';
import { useChatStore } from '../store/chat.store';
import { useSocket, useChatDetail, chatKeys } from '../hooks';
import type { Chat } from '../types';
import { cn } from '@/shared/lib/utils';
import { ADMIN_PORTAL_MOBILE_BOTTOM_NAV_OFFSET_CLASS } from '@/features/admin-dashboard/admin-portal-layout';

type AdminChatTab = 'students' | 'teachers' | 'groups';

interface AdminChatContainerProps {
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

function AdminChatContent({ emptyTitle, emptyDescription, className }: AdminChatContainerProps) {
  const router = useRouter();
  const { searchParams, urlRevision, replaceAllParams } = useAppSearchUrl();
  const { user } = useAuthStore();
  const { activeChat, setActiveChat, isMobileListVisible, setMobileListVisible, setAccountKey } =
    useChatStore();
  const isInitialMount = useRef(true);

  const replaceSearchParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      replaceAllParams(mutate);
    },
    [replaceAllParams],
  );

  // Isolate chat state per account so Admin selection does not affect Student (and vice versa)
  useEffect(() => {
    const key = user?.id && user?.role ? `${user.id}-${user.role.toLowerCase()}` : null;
    setAccountKey(key);
  }, [user?.id, user?.role, setAccountKey]);

  const tabFromUrl = readUrlSearchParam('tab', searchParams, urlRevision) as AdminChatTab | null;
  const validTabs = useMemo<AdminChatTab[]>(() => ['students', 'teachers', 'groups'], []);
  const initialTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : null;
  const [activeTab, setActiveTab] = useState<AdminChatTab | null>(initialTab);
  const [showCreateGroupChatModal, setShowCreateGroupChatModal] = useState(false);
  const [mobileChatPanelOpen, setMobileChatPanelOpen] = useState(false);

  const conversationIdFromUrl = useMemo(
    () =>
      readUrlSearchParam('conversationId', searchParams, urlRevision) ||
      readUrlSearchParam('chatId', searchParams, urlRevision),
    [searchParams, urlRevision],
  );

  // Get returnTo from query params
  const returnToParam = readUrlSearchParam('returnTo', searchParams, urlRevision);
  const returnTo = returnToParam ? decodeURIComponent(returnToParam) : null;

  // Initialize socket connection
  useSocket();

  // Fetch chat from URL if conversationId is present
  const shouldFetchChat = !!conversationIdFromUrl && isInitialMount.current && !activeChat;
  const { data: chatFromUrl, isLoading: isLoadingChatFromUrl, isError: isChatError } = useChatDetail(
    conversationIdFromUrl || '',
    shouldFetchChat
  );

  // Sync tab with URL
  useEffect(() => {
    const tab = readUrlSearchParam('tab', searchParams, urlRevision) as AdminChatTab | null;
    if (tab && validTabs.includes(tab)) {
      setActiveTab(tab);
    } else if (!tab) {
      setActiveTab(null);
    }
  }, [searchParams, urlRevision, validTabs]);

  // Restore or clear conversation when URL changes (back/forward)
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

  // Handle tab change
  const handleTabChange = (tab: AdminChatTab) => {
    setActiveTab(tab);
    replaceSearchParams((params) => {
      params.set('tab', tab);
      params.delete('conversationId');
    });
    setActiveChat(null);
  };

  // Restore chat from URL on initial mount
  // CRITICAL: Only restore if conversationId is explicitly in URL (user navigated with it)
  // Do NOT auto-select based on unread messages, first chat, or last sender
  useEffect(() => {
    if (!isInitialMount.current) return;
    
    // If no conversationId in URL, ensure no chat is selected (neutral state)
    // This prevents auto-selection when opening chat via FloatingChatWidget
    if (!conversationIdFromUrl) {
      // Explicitly clear activeChat if it was set (e.g., from previous session state)
      if (activeChat) {
        setActiveChat(null);
      }
      isInitialMount.current = false;
      return;
    }
    
    if (conversationIdFromUrl) {
      if (chatFromUrl) {
        // Successfully loaded chat from URL - restore it
        setActiveChat(chatFromUrl);
        setMobileListVisible(false);
        
        // Auto-select the correct tab based on chat type
        if (chatFromUrl.type === 'GROUP' && chatFromUrl.groupId) {
          // Group chat - select groups tab
          if (activeTab !== 'groups') {
            setActiveTab('groups');
            replaceSearchParams((params) => {
              params.set('tab', 'groups');
            });
          }
        } else if (chatFromUrl.type === 'DIRECT') {
          // Direct chat - determine if it's a student or teacher
          const otherParticipant = chatFromUrl.participants.find(p => p.userId !== user?.id);
          if (otherParticipant) {
            const otherUserRole = otherParticipant.user.role;
            if (otherUserRole === 'STUDENT' && activeTab !== 'students') {
              setActiveTab('students');
              replaceSearchParams((params) => {
                params.set('tab', 'students');
              });
            } else if (otherUserRole === 'TEACHER' && activeTab !== 'teachers') {
              setActiveTab('teachers');
              replaceSearchParams((params) => {
                params.set('tab', 'teachers');
              });
            }
          }
        }
        
        isInitialMount.current = false;
      } else if (!isLoadingChatFromUrl && isChatError) {
        // Chat failed to load - clear conversationId from URL and mark as not initial mount
        replaceSearchParams((params) => {
          params.delete('conversationId');
        });
        isInitialMount.current = false;
      }
      // If still loading, wait for the next render
    }
    // Note: If no conversationIdFromUrl, we already handled it above
  }, [conversationIdFromUrl, chatFromUrl, isLoadingChatFromUrl, isChatError, setActiveChat, setMobileListVisible, searchParams, replaceSearchParams, activeTab, user, activeChat]);

  // Sync URL when activeChat changes (but skip on initial mount)
  useEffect(() => {
    if (isInitialMount.current) return;
    
    const conversationIdInUrl = readUrlSearchParam('conversationId', searchParams, urlRevision);
    if (activeChat) {
      if (activeChat.id !== conversationIdInUrl) {
        replaceSearchParams((params) => {
          params.set('conversationId', activeChat.id);
          if (!params.get('tab') && activeTab) {
            params.set('tab', activeTab);
          }
        });
      }
    } else if (conversationIdInUrl) {
      replaceSearchParams((params) => {
        params.delete('conversationId');
      });
    }
  }, [activeChat, activeTab, replaceSearchParams, searchParams, urlRevision]);

  // Handle back to previous page
  const handleBackToPrevious = () => {
    if (returnTo) {
      // Validate returnTo is a valid path (basic security check)
      if (returnTo.startsWith('/') && !returnTo.startsWith('//')) {
        try {
          const testUrl = new URL(returnTo, window.location.origin);
          if (testUrl.origin === window.location.origin) {
            router.push(returnTo);
            return;
          }
        } catch {
          router.push(returnTo);
          return;
        }
      }
    }
    
    // Fallback to dashboard
    if (user?.role) {
      const dashboardPath = getDashboardPath(user.role);
      router.push(dashboardPath);
    } else {
      router.push('/');
    }
  };

  const queryClient = useQueryClient();

  const handleSelectChat = (chat: Chat) => {
    setActiveChat(chat);
    setMobileListVisible(false);
    setMobileChatPanelOpen(true);
    
    // Add/update chat in cache so groupUnreadMap can access it
    queryClient.setQueryData(
      chatKeys.list(),
      (oldData: Chat[] | undefined) => {
        if (!oldData) return [chat];
        
        const existingIndex = oldData.findIndex((c) => c.id === chat.id);
        if (existingIndex >= 0) {
          // Update existing chat
          const updated = [...oldData];
          updated[existingIndex] = chat;
          return updated;
        }
        // Add new chat to the list
        return [chat, ...oldData];
      }
    );
    
    replaceSearchParams((params) => {
      params.set('conversationId', chat.id);
      if (activeTab) {
        params.set('tab', activeTab);
      }
    });
  };

  const handleBack = () => {
    setMobileListVisible(true);
    setActiveChat(null);
    replaceSearchParams((params) => {
      params.delete('conversationId');
    });
  };

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
      params.delete('conversationId');
    });
  }, [replaceSearchParams, setActiveChat, setMobileListVisible]);

  const handleCustomGroupChatCreated = (chat: Chat) => {
    setActiveChat(chat);
    setMobileListVisible(false);
    setMobileChatPanelOpen(true);
    setShowCreateGroupChatModal(false);
    queryClient.setQueryData(chatKeys.list(), (oldData: Chat[] | undefined) => {
      if (!oldData) return [chat];
      const existing = oldData.find((c) => c.id === chat.id);
      if (existing) return oldData;
      return [chat, ...oldData];
    });
    replaceSearchParams((params) => {
      params.set('conversationId', chat.id);
      if (activeTab) params.set('tab', activeTab);
    });
  };

  // Check if we're in full-screen mode (when className includes rounded-none)
  const isFullScreen = className?.includes('rounded-none');
  const containerHeight = isFullScreen
    ? 'min-h-0 flex-1 lg:h-[calc(100vh-200px)]'
    : 'h-[calc(100vh-200px)]';
  const contentHeight = isFullScreen
    ? 'flex-1 min-h-0'
    : 'h-[calc(100%-73px)]';

  return (
    <div
      className={cn(
        containerHeight,
        'flex flex-col overflow-hidden bg-white',
        !isFullScreen && 'rounded-2xl border border-slate-200',
        isFullScreen &&
          'max-lg:max-h-[100dvh] max-lg:min-h-0 max-lg:flex-1 max-lg:overflow-hidden',
        activeChat && isFullScreen && 'max-lg:h-[100dvh]',
        className,
      )}
    >
      {/* Header — hidden on mobile when a conversation is open (ChatWindow has its own header) */}
      <div
        className={cn(
          'flex shrink-0 items-center justify-between border-b border-[rgba(14,14,16,0.07)] bg-white px-3 py-3 sm:px-4',
          activeChat && 'max-lg:hidden',
        )}
      >
        <ChatBackButton
          onClick={handleBackToPrevious}
          aria-label="Back to previous page"
          className="lg:hidden"
        />
        <button
          type="button"
          onClick={handleBackToPrevious}
          className={cn(
            'hidden items-center gap-1.5 rounded-[0.875rem] px-2 py-2 lg:flex',
            'text-[#3b3b40] transition-colors hover:text-[#1010a3]',
            'focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20 focus:ring-offset-2',
          )}
          aria-label="Back to previous page"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span className="text-sm font-medium">Back</span>
        </button>
        <h2 className="text-lg font-bold text-[#3b3b40] sm:text-xl">Chat</h2>
        <button
          type="button"
          onClick={() => setShowCreateGroupChatModal(true)}
          className="rounded-full bg-[#1010a3] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[#1010a3]/90 sm:px-4 sm:text-sm"
        >
          Create Group Chat
        </button>
      </div>

      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row',
          contentHeight,
          isFullScreen && !activeChat && ADMIN_PORTAL_MOBILE_BOTTOM_NAV_OFFSET_CLASS,
        )}
      >
        {/* List panel */}
        <div
          className={cn(
            'flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-white lg:w-80 lg:shrink-0 lg:flex-none lg:border-r lg:border-[rgba(14,14,16,0.07)]',
            !isMobileListVisible && 'hidden lg:flex',
          )}
        >
          <AdminChatList
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onSelectChat={handleSelectChat}
          />
        </div>

        {/* Chat panel — desktop only when browsing; full screen on mobile once a chat is open */}
        <div
          className={cn(
            'hidden min-h-0 flex-1 flex-col overflow-hidden bg-white lg:flex',
          )}
        >
          {activeChat ? (
            <ChatWindow chat={activeChat} onBack={handleBack} onChatUpdated={setActiveChat} />
          ) : (
            <ChatEmptyState
              title={emptyTitle || 'Select a chat'}
              description={
                emptyDescription || 'Choose a conversation from the list to start messaging'
              }
              className="bg-white lg:bg-[#fafafa]"
            />
          )}
        </div>
      </div>

      {activeChat ? (
        <MobileChatSlidePanel
          active={mobileChatPanelOpen}
          onExitComplete={finalizeMobileChatClose}
          className="lg:hidden"
        >
          <ChatWindow
            chat={activeChat}
            onBack={handleMobileBack}
            onChatUpdated={setActiveChat}
          />
        </MobileChatSlidePanel>
      ) : null}

      <CreateGroupChatModal
        open={showCreateGroupChatModal}
        onOpenChange={setShowCreateGroupChatModal}
        onCreated={handleCustomGroupChatCreated}
      />
    </div>
  );
}

export function AdminChatContainer(props: AdminChatContainerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    const isFullScreen = props.className?.includes('rounded-none');
    return (
      <div
        className={cn(
          isFullScreen
            ? 'min-h-0 flex-1 lg:h-[calc(100vh-200px)]'
            : 'h-[calc(100vh-200px)]',
          'overflow-hidden bg-white',
          !isFullScreen && 'rounded-2xl border border-slate-200',
          props.className,
        )}
      >
        <div className="flex h-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#1010a3]" />
        </div>
      </div>
    );
  }

  return <AdminChatContent {...props} />;
}

