'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAuthStore, getDashboardPath } from '@/features/auth/store/auth.store';
import { AdminChatList } from './AdminChatList';
import { ChatWindow } from './ChatWindow';
import { useChatStore } from '../store/chat.store';
import { useSocket, useChatDetail } from '../hooks';
import type { Chat } from '../types';
import { cn } from '@/shared/lib/utils';

type AdminChatTab = 'students' | 'teachers' | 'groups';

interface AdminChatContainerProps {
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

function AdminChatContent({ emptyTitle, emptyDescription, className }: AdminChatContainerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const { activeChat, setActiveChat, isMobileListVisible, setMobileListVisible } = useChatStore();
  const isInitialMount = useRef(true);

  // Get tab from URL, no default - user must select a tab
  const tabFromUrl = searchParams.get('tab') as AdminChatTab | null;
  const validTabs: AdminChatTab[] = ['students', 'teachers', 'groups'];
  const initialTab = (tabFromUrl && validTabs.includes(tabFromUrl)) ? tabFromUrl : null;
  const [activeTab, setActiveTab] = useState<AdminChatTab | null>(initialTab);

  // Get conversationId from URL (support both chatId and conversationId for backward compatibility)
  const conversationIdFromUrl = searchParams.get('conversationId') || searchParams.get('chatId');

  // Get returnTo from query params
  const returnToParam = searchParams.get('returnTo');
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
    const tabFromUrl = searchParams.get('tab') as AdminChatTab | null;
    if (tabFromUrl && validTabs.includes(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    } else if (!tabFromUrl && activeTab !== null) {
      // If URL has no tab but state has one, clear it
      setActiveTab(null);
    }
  }, [searchParams, activeTab, validTabs]);

  // Handle tab change
  const handleTabChange = (tab: AdminChatTab) => {
    setActiveTab(tab);
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    // Clear conversationId when switching tabs
    params.delete('conversationId');
    router.replace(`${pathname}?${params.toString()}`);
    // Clear active chat when switching tabs
    setActiveChat(null);
  };

  // Restore chat from URL on initial mount
  useEffect(() => {
    if (!isInitialMount.current) return;
    
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
            const params = new URLSearchParams(searchParams.toString());
            params.set('tab', 'groups');
            router.replace(`${pathname}?${params.toString()}`);
          }
        } else if (chatFromUrl.type === 'DIRECT') {
          // Direct chat - determine if it's a student or teacher
          const otherParticipant = chatFromUrl.participants.find(p => p.userId !== user?.id);
          if (otherParticipant) {
            const otherUserRole = otherParticipant.user.role;
            if (otherUserRole === 'STUDENT' && activeTab !== 'students') {
              setActiveTab('students');
              const params = new URLSearchParams(searchParams.toString());
              params.set('tab', 'students');
              router.replace(`${pathname}?${params.toString()}`);
            } else if (otherUserRole === 'TEACHER' && activeTab !== 'teachers') {
              setActiveTab('teachers');
              const params = new URLSearchParams(searchParams.toString());
              params.set('tab', 'teachers');
              router.replace(`${pathname}?${params.toString()}`);
            }
          }
        }
        
        isInitialMount.current = false;
      } else if (!isLoadingChatFromUrl && isChatError) {
        // Chat failed to load - clear conversationId from URL and mark as not initial mount
        const params = new URLSearchParams(searchParams.toString());
        params.delete('conversationId');
        router.replace(`${pathname}?${params.toString()}`);
        isInitialMount.current = false;
      }
      // If still loading, wait for the next render
    } else {
      // No conversationId in URL, just mark as not initial mount
      isInitialMount.current = false;
    }
  }, [conversationIdFromUrl, chatFromUrl, isLoadingChatFromUrl, isChatError, setActiveChat, setMobileListVisible, searchParams, router, pathname, activeTab, user]);

  // Sync URL when activeChat changes (but skip on initial mount)
  useEffect(() => {
    if (isInitialMount.current) return;
    
    const conversationIdFromUrl = searchParams.get('conversationId');
    if (activeChat) {
      if (activeChat.id !== conversationIdFromUrl) {
        const params = new URLSearchParams(searchParams.toString());
        params.set('conversationId', activeChat.id);
        // Ensure tab is set if we have one
        if (!params.get('tab') && activeTab) {
          params.set('tab', activeTab);
        }
        router.replace(`${pathname}?${params.toString()}`);
      }
    } else if (conversationIdFromUrl) {
      // activeChat is null but URL has conversationId - remove it
      const params = new URLSearchParams(searchParams.toString());
      params.delete('conversationId');
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [activeChat, searchParams, router, pathname, activeTab]);

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

  const handleSelectChat = (chat: Chat) => {
    setActiveChat(chat);
    setMobileListVisible(false);
    // Update URL immediately
    const params = new URLSearchParams(searchParams.toString());
    params.set('conversationId', chat.id);
    if (activeTab) {
      params.set('tab', activeTab);
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleBack = () => {
    setMobileListVisible(true);
    setActiveChat(null);
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete('conversationId');
    router.replace(`${pathname}?${params.toString()}`);
  };

  // Check if we're in full-screen mode (when className includes rounded-none)
  const isFullScreen = className?.includes('rounded-none');
  const containerHeight = isFullScreen ? 'h-screen' : 'h-[calc(100vh-200px)]';
  const contentHeight = isFullScreen ? 'h-[calc(100vh-73px)]' : 'h-[calc(100%-73px)]';

  return (
    <div className={cn(containerHeight, "bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col", className)}>
      {/* Back Button Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white flex-shrink-0">
        <button
          onClick={handleBackToPrevious}
          className={cn(
            'flex items-center gap-2 px-4 py-2',
            'text-slate-700 hover:text-slate-900',
            'hover:bg-slate-100 rounded-lg',
            'transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          )}
          aria-label="Back to previous page"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span className="font-medium">Back</span>
        </button>
        <h2 className="text-lg font-semibold text-slate-800">Chat</h2>
        <div className="w-20" /> {/* Spacer for centering */}
      </div>

      <div className={cn("flex flex-1 overflow-hidden", contentHeight)}>
        {/* Admin Chat List with Tabs */}
        <div
          className={cn(
            'w-full lg:w-80 border-r border-slate-200 flex-shrink-0',
            !isMobileListVisible && 'hidden lg:block'
          )}
        >
          <AdminChatList 
            activeTab={activeTab} 
            onTabChange={handleTabChange}
            onSelectChat={handleSelectChat}
          />
        </div>

        {/* Chat Window */}
        <div
          className={cn(
            'flex-1 flex flex-col',
            isMobileListVisible && !activeChat && 'hidden lg:flex'
          )}
        >
          {activeChat ? (
            <ChatWindow chat={activeChat} onBack={handleBack} />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-200 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-1">
                  {emptyTitle || 'Select a chat'}
                </h3>
                <p className="text-sm text-slate-500">
                  {emptyDescription || 'Choose a conversation from the list to start messaging'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminChatContainer(props: AdminChatContainerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("h-[calc(100vh-200px)] bg-white rounded-2xl border border-slate-200 overflow-hidden", props.className)}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  return <AdminChatContent {...props} />;
}

