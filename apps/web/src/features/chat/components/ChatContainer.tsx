'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { readUrlSearchParam } from '@/shared/lib/url-search-params';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';
import { useRouter } from '@/config/navigation';
import { useAuthStore, getDashboardPath } from '@/features/auth/store/auth.store';
import { ChatList } from './ChatList';
import { StudentChatList } from './StudentChatList';
import { TeacherChatList } from './TeacherChatList';
import { ChatWindow } from './ChatWindow';
import { MobileChatSlidePanel } from './MobileChatSlidePanel';
import { ChatBackButton } from './ChatBackButton';
import { useChatStore } from '../store/chat.store';
import { useSocket, useChats, useCreateDirectChat } from '../hooks';
import { useMyTeachers } from '@/features/students/hooks/useStudents';
import { fetchChat } from '../api/chat.api';
import type { Chat } from '../types';
import { cn } from '@/shared/lib/utils';
import { getChatThemeForRole } from '../lib/chat-theme';

interface ChatContainerProps {
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

function ChatContent({ emptyTitle, emptyDescription, className }: ChatContainerProps) {
  const router = useRouter();
  const { searchParams, urlRevision, replaceAllParams } = useAppSearchUrl();
  const { user } = useAuthStore();
  const { activeChat, setActiveChat, isMobileListVisible, setMobileListVisible, setAccountKey } =
    useChatStore();
  const { data: chats = [], isLoading: isLoadingChats } = useChats();

  // Isolate chat state per account so one role/account does not affect another (e.g. Admin vs Student)
  useEffect(() => {
    const key =
      user?.id && user?.role ? `${user.id}-${user.role.toLowerCase()}` : null;
    setAccountKey(key);
  }, [user?.id, user?.role, setAccountKey]);
  const createDirectChat = useCreateDirectChat();
  const { data: teachers = [], isLoading: isLoadingTeachers } = useMyTeachers(user?.role === 'STUDENT');
  const isInitialMount = useRef(true);
  const [mobileChatPanelOpen, setMobileChatPanelOpen] = useState(false);

  const replaceSearchParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      replaceAllParams(mutate);
    },
    [replaceAllParams],
  );

  const isStudent = user?.role === 'STUDENT';
  const isTeacher = user?.role === 'TEACHER';
  const ui = getChatThemeForRole(user?.role);

  // Get returnTo from query params
  const returnToParam = readUrlSearchParam('returnTo', searchParams, urlRevision);
  const returnTo = returnToParam ? decodeURIComponent(returnToParam) : null;

  // Handle back to previous page
  const handleBackToPrevious = () => {
    if (returnTo) {
      // Validate returnTo is a valid path (basic security check)
      // returnTo should be a pathname starting with / (relative to origin)
      if (returnTo.startsWith('/') && !returnTo.startsWith('//')) {
        // Basic validation: ensure it's not trying to navigate to external sites
        try {
          // Try to construct a URL to validate
          const testUrl = new URL(returnTo, window.location.origin);
          // Only allow same-origin navigation
          if (testUrl.origin === window.location.origin) {
            router.push(returnTo);
            return;
          }
        } catch {
          // If URL construction fails, it might be a relative path, try it anyway
          // but only if it starts with / (same-origin relative path)
          router.push(returnTo);
          return;
        }
      }
    }
    
    // Fallback to dashboard if no returnTo or invalid returnTo
    if (user?.role) {
      const dashboardPath = getDashboardPath(user.role);
      router.push(dashboardPath);
    } else {
      router.push('/');
    }
  };

  // Initialize socket connection
  useSocket();

  const conversationIdFromUrl = useMemo(
    () =>
      readUrlSearchParam('conversationId', searchParams, urlRevision) ||
      readUrlSearchParam('chatId', searchParams, urlRevision),
    [searchParams, urlRevision],
  );

  // Restore or clear conversation when URL changes (back/forward)
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

  // Restore chat from URL on initial mount when chats are loaded
  // CRITICAL: Only restore if conversationId is explicitly in URL (user navigated with it)
  // Do NOT auto-select based on unread messages, first chat, or last sender
  useEffect(() => {
    if (isLoadingChats || !isInitialMount.current) return;
    
    // For students, also wait for teachers to load if we need to handle teacherId param
    const typeFromUrl = readUrlSearchParam('type', searchParams);
    const teacherIdFromUrl = readUrlSearchParam('teacherId', searchParams);
    if (isStudent && typeFromUrl === 'dm' && teacherIdFromUrl && isLoadingTeachers) {
      return;
    }
    
    const chatIdFromUrl = conversationIdFromUrl;
    
    // If no chatId in URL, ensure no chat is selected (neutral state)
    // This prevents auto-selection when opening chat via FloatingChatWidget
    if (!chatIdFromUrl && !teacherIdFromUrl) {
      // Explicitly clear activeChat if it was set (e.g., from previous session state)
      if (activeChat) {
        setActiveChat(null);
      }
      isInitialMount.current = false;
      return;
    }
    
    // Handle teacherId param for student DM
    if (isStudent && typeFromUrl === 'dm' && teacherIdFromUrl && teachers.length > 0) {
      const teacher = teachers.find((t) => t.userId === teacherIdFromUrl);
      if (teacher) {
        // Check if chat already exists
        const existingChat = chats.find((chat) => {
          if (chat.type !== 'DIRECT') return false;
          return chat.participants.some((p) => p.userId === teacher.userId);
        });

        if (existingChat) {
          setActiveChat(existingChat);
          setMobileListVisible(false);
          // Update URL to use chatId
          replaceSearchParams((params) => {
            params.delete('type');
            params.delete('teacherId');
            params.set('chatId', existingChat.id);
          });
        } else {
          // Create new chat
          createDirectChat.mutate(teacher.userId, {
            onSuccess: (newChat) => {
              setActiveChat(newChat);
              setMobileListVisible(false);
              // Update URL to use chatId
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
      } else {
        // Chat not found in list, try to fetch it directly (for teachers, chat might exist but not be in groups/students lists yet)
        if (isTeacher || !isStudent) {
          // Try to fetch the chat directly
          fetchChat(chatIdFromUrl)
            .then((chat) => {
              setActiveChat(chat);
              setMobileListVisible(false);
            })
            .catch(() => {
              // Chat doesn't exist or user doesn't have access, remove from URL
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
      }
      isInitialMount.current = false;
    }
    // Note: If no chatIdFromUrl and no teacherIdFromUrl, we already handled it above
  }, [chats, isLoadingChats, isLoadingTeachers, teachers, searchParams, setActiveChat, setMobileListVisible, replaceSearchParams, isTeacher, isStudent, createDirectChat, conversationIdFromUrl, activeChat]);

  // Sync URL when activeChat changes (but skip on initial mount)
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

  const handleSelectChat = (chat: Chat) => {
    setActiveChat(chat);
    setMobileListVisible(false);
    setMobileChatPanelOpen(true);
    // Update URL immediately - remove type and teacherId params if present
    replaceSearchParams((params) => {
      params.delete('type');
      params.delete('teacherId');
      params.set('conversationId', chat.id);
      params.delete('chatId');
    });
  };

  const handleBack = () => {
    setMobileListVisible(true);
    setActiveChat(null);
    replaceSearchParams((params) => {
      params.delete('chatId');
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
      params.delete('chatId');
      params.delete('conversationId');
    });
  }, [replaceSearchParams, setActiveChat, setMobileListVisible]);

  // Check if we're in full-screen mode (when className includes rounded-none)
  const isFullScreen = className?.includes('rounded-none');
  const containerHeight = isFullScreen ? 'h-screen' : 'h-[calc(100vh-200px)]';
  const contentHeight = isFullScreen ? 'h-[calc(100vh-73px)]' : 'h-[calc(100%-73px)]';

  return (
    <div className={cn(containerHeight, ui.shell, 'overflow-hidden flex flex-col', className)}>
      {/* Back Button Header — hidden on mobile when a conversation is open */}
      <div
        className={cn(
          'flex flex-shrink-0 items-center justify-between border-b p-4',
          ui.border,
          ui.headerBg,
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
            'hidden items-center gap-2 px-4 py-2 transition-colors lg:flex',
            ui.backBtn,
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
          <span className="font-medium">Back</span>
        </button>
        <h2 className={cn('text-xl font-bold', ui.title)}>Chat</h2>
        <div className="w-20" /> {/* Spacer for centering */}
      </div>

      <div className={cn('flex min-h-0 flex-1 overflow-hidden', contentHeight)}>
        {/* Chat List */}
        <div
          className={cn(
            'w-full lg:w-80 border-r flex-shrink-0',
            ui.border,
            !isMobileListVisible && 'hidden lg:block'
          )}
        >
          {isStudent ? (
            <StudentChatList onSelectChat={handleSelectChat} />
          ) : isTeacher ? (
            <TeacherChatList onSelectChat={handleSelectChat} />
          ) : (
            <ChatList onSelectChat={handleSelectChat} />
          )}
        </div>

        {/* Chat Window — desktop */}
        <div className="hidden min-h-0 flex-1 flex-col overflow-hidden lg:flex">
          {activeChat ? (
            <ChatWindow chat={activeChat} onBack={handleBack} />
          ) : (
            <div className={cn('flex flex-1 items-center justify-center', ui.messagesBg)}>
              <div className="text-center">
                <div
                  className={cn(
                    'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full',
                    ui.emptyIcon,
                  )}
                >
                  <svg
                    className="h-8 w-8"
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
                <h3 className={cn('mb-1 text-lg font-semibold', ui.title)}>
                  {emptyTitle || 'Select a chat'}
                </h3>
                <p className={cn('text-sm', ui.muted)}>
                  {emptyDescription || 'Choose a conversation from the list to start messaging'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {activeChat ? (
        <MobileChatSlidePanel
          active={mobileChatPanelOpen}
          onExitComplete={finalizeMobileChatClose}
          className="lg:hidden"
        >
          <ChatWindow chat={activeChat} onBack={handleMobileBack} />
        </MobileChatSlidePanel>
      ) : null}
    </div>
  );
}

export function ChatContainer(props: ChatContainerProps) {
  const [mounted, setMounted] = useState(false);
  const { user } = useAuthStore();
  const loadingUi = getChatThemeForRole(user?.role);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn('h-[calc(100vh-200px)] overflow-hidden', loadingUi.shell, props.className)}
      >
        <div className="flex h-full items-center justify-center">
          <div className={cn('h-8 w-8 animate-spin rounded-full', loadingUi.spinner)} />
        </div>
      </div>
    );
  }

  return <ChatContent {...props} />;
}
