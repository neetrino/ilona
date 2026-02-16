'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAuthStore, getDashboardPath } from '@/features/auth/store/auth.store';
import { ChatList } from './ChatList';
import { StudentChatList } from './StudentChatList';
import { TeacherChatList } from './TeacherChatList';
import { ChatWindow } from './ChatWindow';
import { useChatStore } from '../store/chat.store';
import { useSocket, useChats, useCreateDirectChat } from '../hooks';
import { useMyTeachers } from '@/features/students/hooks/useStudents';
import { fetchChat } from '../api/chat.api';
import type { Chat } from '../types';
import { cn } from '@/shared/lib/utils';

interface ChatContainerProps {
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

function ChatContent({ emptyTitle, emptyDescription, className }: ChatContainerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const { activeChat, setActiveChat, isMobileListVisible, setMobileListVisible } = useChatStore();
  const { data: chats = [], isLoading: isLoadingChats } = useChats();
  const createDirectChat = useCreateDirectChat();
  const { data: teachers = [], isLoading: isLoadingTeachers } = useMyTeachers(user?.role === 'STUDENT');
  const isInitialMount = useRef(true);
  const isStudent = user?.role === 'STUDENT';
  const isTeacher = user?.role === 'TEACHER';

  // Get returnTo from query params
  const returnToParam = searchParams.get('returnTo');
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

  // Get conversationId from URL (support both chatId and conversationId for backward compatibility)
  const conversationIdFromUrl = searchParams.get('conversationId') || searchParams.get('chatId');

  // Restore chat from URL on initial mount when chats are loaded
  useEffect(() => {
    if (isLoadingChats || !isInitialMount.current) return;
    
    // For students, also wait for teachers to load if we need to handle teacherId param
    const typeFromUrl = searchParams.get('type');
    const teacherIdFromUrl = searchParams.get('teacherId');
    if (isStudent && typeFromUrl === 'dm' && teacherIdFromUrl && isLoadingTeachers) {
      return;
    }
    
    const chatIdFromUrl = conversationIdFromUrl;
    
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
          const params = new URLSearchParams(searchParams.toString());
          params.delete('type');
          params.delete('teacherId');
          params.set('chatId', existingChat.id);
          router.replace(`${pathname}?${params.toString()}`);
        } else {
          // Create new chat
          createDirectChat.mutate(teacher.userId, {
            onSuccess: (newChat) => {
              setActiveChat(newChat);
              setMobileListVisible(false);
              // Update URL to use chatId
              const params = new URLSearchParams(searchParams.toString());
              params.delete('type');
              params.delete('teacherId');
              params.set('chatId', newChat.id);
              router.replace(`${pathname}?${params.toString()}`);
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
              const params = new URLSearchParams(searchParams.toString());
              params.delete('chatId');
              params.delete('conversationId');
              router.replace(`${pathname}?${params.toString()}`);
            });
        } else {
          // For students, remove chatId if not found
          const params = new URLSearchParams(searchParams.toString());
          params.delete('chatId');
          params.delete('conversationId');
          router.replace(`${pathname}?${params.toString()}`);
        }
      }
      isInitialMount.current = false;
    } else if (!chatIdFromUrl && !teacherIdFromUrl) {
      isInitialMount.current = false;
    }
  }, [chats, isLoadingChats, isLoadingTeachers, teachers, searchParams, setActiveChat, setMobileListVisible, router, pathname, isStudent, createDirectChat, conversationIdFromUrl]);

  // Sync URL when activeChat changes (but skip on initial mount)
  useEffect(() => {
    if (isInitialMount.current) return;
    
    const chatIdFromUrl = conversationIdFromUrl;
    if (activeChat) {
      if (activeChat.id !== chatIdFromUrl) {
        const params = new URLSearchParams(searchParams.toString());
        params.set('conversationId', activeChat.id);
        params.delete('chatId'); // Remove old chatId param for consistency
        router.replace(`${pathname}?${params.toString()}`);
      }
    } else if (chatIdFromUrl) {
      // activeChat is null but URL has conversationId/chatId - remove it
      const params = new URLSearchParams(searchParams.toString());
      params.delete('chatId');
      params.delete('conversationId');
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [activeChat, searchParams, router, pathname, conversationIdFromUrl]);

  const handleSelectChat = (chat: Chat) => {
    setActiveChat(chat);
    setMobileListVisible(false);
    // Update URL immediately - remove type and teacherId params if present
    const params = new URLSearchParams(searchParams.toString());
    params.delete('type');
    params.delete('teacherId');
    params.set('conversationId', chat.id);
    params.delete('chatId'); // Remove old chatId param for consistency
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleBack = () => {
    setMobileListVisible(true);
    setActiveChat(null);
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete('chatId');
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
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
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
        {/* Chat List */}
        <div
          className={cn(
            'w-full lg:w-80 border-r border-slate-200 flex-shrink-0',
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

export function ChatContainer(props: ChatContainerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("h-[calc(100vh-200px)] bg-white rounded-2xl border border-slate-200 overflow-hidden", props.className)}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return <ChatContent {...props} />;
}
