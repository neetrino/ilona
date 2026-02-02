'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { ChatList, ChatWindow, Chat, useChatStore } from '@/features/chat';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { api } from '@/shared/lib/api';
import { cn } from '@/shared/lib/utils';

export default function StudentChatPage() {
  const { user } = useAuthStore();
  const {
    chats: _chats,
    activeChat,
    setChats,
    setActiveChat,
    setMessages,
    addMessage,
    setLoading,
  } = useChatStore();
  const [showChatList, setShowChatList] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);
      try {
        const data = await api.get<Chat[]>('/chat');
        setChats(data || []);
      } catch {
        // Mock data for student
        setChats([
          {
            id: 'group-1',
            type: 'GROUP',
            name: 'English B2 - Main',
            participants: [
              { userId: '1', user: { id: '1', firstName: 'Sarah', lastName: 'Jenkins', role: 'TEACHER' }, unreadCount: 0 },
              { userId: user?.id || '2', user: { id: user?.id || '2', firstName: user?.firstName || 'You', lastName: user?.lastName || '', role: 'STUDENT' }, unreadCount: 0 },
            ],
            lastMessage: {
              id: 'm1', chatId: 'group-1', senderId: '1', type: 'VOCABULARY',
              content: '📚 Today\'s Vocabulary...', isEdited: false,
              createdAt: new Date(Date.now() - 1800000).toISOString(),
              updatedAt: new Date(Date.now() - 1800000).toISOString(),
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, [setChats, setLoading, user]);

  useEffect(() => {
    if (!activeChat) return;
    setMessages([
      {
        id: 'msg-1', chatId: activeChat.id, senderId: '1',
        sender: { id: '1', firstName: 'Sarah', lastName: 'Jenkins', role: 'TEACHER' },
        type: 'VOCABULARY',
        content: '📚 Today\'s Vocabulary:\n\n1. Accomplish - to achieve or complete successfully\n2. Determine - to decide or establish',
        isEdited: false, createdAt: new Date(Date.now() - 1800000).toISOString(), updatedAt: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: 'msg-2', chatId: activeChat.id, senderId: user?.id || '2',
        sender: { id: user?.id || '2', firstName: user?.firstName || 'You', lastName: user?.lastName || '', role: 'STUDENT' },
        type: 'TEXT', content: 'Thank you, teacher! I will practice these.',
        isEdited: false, createdAt: new Date(Date.now() - 1200000).toISOString(), updatedAt: new Date(Date.now() - 1200000).toISOString(),
      },
    ]);
  }, [activeChat, setMessages, user]);

  const handleSelectChat = (chat: Chat) => {
    setActiveChat(chat);
    setShowChatList(false);
  };

  const handleSendMessage = async (content: string) => {
    if (!activeChat || !content.trim()) return;
    const tempMessage = {
      id: `temp-${Date.now()}`, chatId: activeChat.id, senderId: user?.id || '2',
      sender: { id: user?.id || '2', firstName: user?.firstName || 'You', lastName: user?.lastName || '', role: 'STUDENT' },
      type: 'TEXT' as const, content, isEdited: false,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    addMessage(tempMessage);
  };

  return (
    <DashboardLayout title="My Chats" subtitle="Stay connected with your teachers and classmates.">
      <div className="h-[calc(100vh-200px)] bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex h-full">
          <div className={cn('w-full lg:w-80 border-r border-slate-200 flex-shrink-0', !showChatList && 'hidden lg:block')}>
            <ChatList onSelectChat={handleSelectChat} />
          </div>
          <div className={cn('flex-1 flex flex-col', showChatList && !activeChat && 'hidden lg:flex')}>
            {activeChat ? (
              <ChatWindow chat={activeChat} onSendMessage={handleSendMessage} onBack={() => { setShowChatList(true); setActiveChat(null); }} />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-slate-50">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-200 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">Select a chat</h3>
                  <p className="text-sm text-slate-500">Choose a conversation to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

