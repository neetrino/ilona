'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { ChatList, ChatWindow, Chat, useChatStore } from '@/features/chat';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { api } from '@/shared/lib/api';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui';

export default function TeacherChatPage() {
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
        // Mock data for teacher
        setChats([
          {
            id: 'group-1',
            type: 'GROUP',
            name: 'English B2 - Main',
            participants: [
              { userId: user?.id || '1', user: { id: user?.id || '1', firstName: 'Sarah', lastName: 'Jenkins', role: 'TEACHER' }, unreadCount: 0 },
              { userId: '2', user: { id: '2', firstName: 'Anna', lastName: 'K.', role: 'STUDENT' }, unreadCount: 0 },
            ],
            lastMessage: {
              id: 'm1', chatId: 'group-1', senderId: '2', type: 'TEXT',
              content: 'Thank you for the vocabulary!', isEdited: false,
              createdAt: new Date(Date.now() - 3600000).toISOString(),
              updatedAt: new Date(Date.now() - 3600000).toISOString(),
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
        id: 'msg-1', chatId: activeChat.id, senderId: user?.id || '1',
        sender: { id: user?.id || '1', firstName: 'Sarah', lastName: 'Jenkins', role: 'TEACHER' },
        type: 'VOCABULARY',
        content: '📚 Today\'s Vocabulary:\n\n1. Accomplish - to achieve\n2. Determine - to decide',
        isEdited: false, createdAt: new Date(Date.now() - 7200000).toISOString(), updatedAt: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 'msg-2', chatId: activeChat.id, senderId: '2',
        sender: { id: '2', firstName: 'Anna', lastName: 'K.', role: 'STUDENT' },
        type: 'TEXT', content: 'Thank you for the vocabulary!',
        isEdited: false, createdAt: new Date(Date.now() - 3600000).toISOString(), updatedAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ]);
  }, [activeChat, setMessages, user]);

  const handleSelectChat = (chat: Chat) => {
    setActiveChat(chat);
    setShowChatList(false);
  };

  const handleSendMessage = async (content: string, type: string = 'TEXT') => {
    if (!activeChat || !content.trim()) return;
    const tempMessage = {
      id: `temp-${Date.now()}`, chatId: activeChat.id, senderId: user?.id || '1',
      sender: { id: user?.id || '1', firstName: user?.firstName || 'You', lastName: user?.lastName || '', role: 'TEACHER' },
      type: type as 'TEXT', content, isEdited: false,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    addMessage(tempMessage);
  };

  const handleSendVocabulary = () => {
    if (!activeChat) return;
    handleSendMessage('📚 Today\'s Vocabulary:\n\nAdd your vocabulary words here...', 'VOCABULARY');
  };

  return (
    <DashboardLayout title="Group Chats" subtitle="Communicate with your students and send vocabulary.">
      <div className="h-[calc(100vh-200px)] bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex h-full">
          <div className={cn('w-full lg:w-80 border-r border-slate-200 flex-shrink-0', !showChatList && 'hidden lg:block')}>
            <ChatList onSelectChat={handleSelectChat} />
          </div>
          <div className={cn('flex-1 flex flex-col relative', showChatList && !activeChat && 'hidden lg:flex')}>
            {activeChat ? (
              <>
                <ChatWindow chat={activeChat} onSendMessage={handleSendMessage} onBack={() => { setShowChatList(true); setActiveChat(null); }} />
                <div className="absolute bottom-24 right-8">
                  <Button onClick={handleSendVocabulary} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Send Vocabulary
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-slate-50">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-200 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">Select a group chat</h3>
                  <p className="text-sm text-slate-500">Choose a group to send messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

