'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/shared/lib/utils';
import { Chat, Message, useChatStore } from '../store/chat.store';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { Button } from '@/shared/components/ui';

interface ChatWindowProps {
  chat: Chat;
  onSendMessage: (content: string, type?: string) => void;
  onBack?: () => void;
}

export function ChatWindow({ chat, onSendMessage, onBack }: ChatWindowProps) {
  const { messages, typingUsers, onlineUsers } = useChatStore();
  const { user } = useAuthStore();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    onSendMessage(newMessage.trim());
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getChatName = () => {
    if (chat.name) return chat.name;
    if (chat.type === 'DIRECT') {
      const otherParticipant = chat.participants.find(
        (p) => p.userId !== user?.id
      );
      if (otherParticipant) {
        return `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`;
      }
    }
    return 'Chat';
  };

  const getOtherParticipant = () => {
    if (chat.type === 'DIRECT') {
      return chat.participants.find((p) => p.userId !== user?.id);
    }
    return null;
  };

  const isOtherOnline = () => {
    const other = getOtherParticipant();
    return other ? onlineUsers.includes(other.userId) : false;
  };

  const typingInChat = typingUsers[chat.id] || [];
  const othersTyping = typingInChat.filter((id) => id !== user?.id);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  let currentDate = '';

  messages.forEach((msg) => {
    const msgDate = new Date(msg.createdAt).toDateString();
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groupedMessages.push({ date: msg.createdAt, messages: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-200 bg-white">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100 lg:hidden"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold',
            chat.type === 'GROUP' ? 'bg-blue-500' : 'bg-slate-400'
          )}
        >
          {chat.name?.[0] || getChatName()[0]}
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-slate-800">{getChatName()}</h2>
          <p className="text-sm text-slate-500">
            {chat.type === 'GROUP'
              ? `${chat.participants.length} members`
              : isOtherOnline()
              ? 'Online'
              : 'Offline'}
          </p>
        </div>
        <button className="p-2 rounded-lg hover:bg-slate-100">
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
        {groupedMessages.map((group, groupIndex) => (
          <div key={groupIndex}>
            {/* Date separator */}
            <div className="flex items-center justify-center mb-4">
              <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs text-slate-500">
                {formatDate(group.date)}
              </span>
            </div>

            {/* Messages */}
            <div className="space-y-3">
              {group.messages.map((message) => {
                const isOwn = message.senderId === user?.id;
                return (
                  <div
                    key={message.id}
                    className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[70%] rounded-2xl px-4 py-2',
                        isOwn
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md'
                      )}
                    >
                      {/* Sender name for group chats */}
                      {!isOwn && chat.type === 'GROUP' && message.sender && (
                        <p className="text-xs font-medium text-blue-600 mb-1">
                          {message.sender.firstName} {message.sender.lastName}
                        </p>
                      )}

                      {/* Message content */}
                      {message.type === 'VOCABULARY' ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs opacity-80">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            Vocabulary
                          </div>
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}

                      {/* Time & edited */}
                      <div
                        className={cn(
                          'flex items-center gap-1 mt-1 text-xs',
                          isOwn ? 'text-blue-200' : 'text-slate-400'
                        )}
                      >
                        <span>{formatTime(message.createdAt)}</span>
                        {message.isEdited && <span>• edited</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {othersTyping.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="flex items-end gap-3">
          <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}


