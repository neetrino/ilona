'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { ChatList, ChatWindow, Chat, useChatStore } from '@/features/chat';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { api } from '@/shared/lib/api';
import { cn } from '@/shared/lib/utils';

export default function AdminChatPage() {
  const { user } = useAuthStore();
  const {
    chats: _chats,
    activeChat,
    messages: _messages,
    isLoading: _isLoading,
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
        // Mock data for demo
        setChats([
          {
            id: 'chat-1',
            type: 'GROUP',
            name: 'English B2 - Main',
            participants: [
              {
                userId: user?.id || '1',
                user: { id: user?.id || '1', firstName: user?.firstName || 'You', lastName: user?.lastName || '', role: 'ADMIN' },
                unreadCount: 0,
              },
              { userId: '2', user: { id: '2', firstName: 'Anna', lastName: 'Kowalski', role: 'STUDENT' }, unreadCount: 0 },
            ],
            lastMessage: {
              id: 'msg-1', chatId: 'chat-1', senderId: '2', type: 'TEXT',
              content: 'Thank you for the vocabulary list!', isEdited: false,
              createdAt: new Date(Date.now() - 3600000).toISOString(),
              updatedAt: new Date(Date.now() - 3600000).toISOString(),
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'chat-2',
            type: 'DIRECT',
            participants: [
              { userId: user?.id || '1', user: { id: user?.id || '1', firstName: user?.firstName || 'You', lastName: user?.lastName || '', role: 'ADMIN' }, unreadCount: 0 },
              { userId: '4', user: { id: '4', firstName: 'Sarah', lastName: 'Jenkins', role: 'TEACHER' }, unreadCount: 2 },
            ],
            lastMessage: {
              id: 'msg-2', chatId: 'chat-2', senderId: '4', type: 'TEXT',
              content: 'Can we discuss the schedule for next week?', isEdited: false,
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
    // Mock messages
    if (activeChat.id === 'chat-1') {
      setMessages([
        {
          id: 'msg-a1', chatId: 'chat-1', senderId: user?.id || '1',
          sender: { id: user?.id || '1', firstName: user?.firstName || 'You', lastName: user?.lastName || '', role: 'ADMIN' },
          type: 'TEXT', content: 'Welcome to the group chat!', isEdited: false,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          updatedAt: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: 'msg-a2', chatId: 'chat-1', senderId: '2',
          sender: { id: '2', firstName: 'Anna', lastName: 'Kowalski', role: 'STUDENT' },
          type: 'TEXT', content: 'Thank you for the vocabulary list!', isEdited: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ]);
    } else {
      setMessages([]);
    }
  }, [activeChat, setMessages, user]);

  const handleSelectChat = (chat: Chat) => {
    setActiveChat(chat);
    setShowChatList(false);
  };

  const handleSendMessage = async (content: string, type: string = 'TEXT') => {
    if (!activeChat || !content.trim()) return;
    const tempMessage = {
      id: `temp-${Date.now()}`, chatId: activeChat.id, senderId: user?.id || '1',
      sender: { id: user?.id || '1', firstName: user?.firstName || 'You', lastName: user?.lastName || '', role: user?.role || 'ADMIN' },
      type: type as 'TEXT', content, isEdited: false,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    addMessage(tempMessage);
    try {
      await api.post(`/chat/${activeChat.id}/messages`, { chatId: activeChat.id, type, content });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <DashboardLayout title="Chat" subtitle="Communicate with teachers and students.">
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
                  <p className="text-sm text-slate-500">Choose a conversation from the list</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

