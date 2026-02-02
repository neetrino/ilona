'use client';

import { cn } from '@/shared/lib/utils';
import { Chat, useChatStore } from '../store/chat.store';
import { useAuthStore } from '@/features/auth/store/auth.store';

interface ChatListProps {
  onSelectChat: (chat: Chat) => void;
}

export function ChatList({ onSelectChat }: ChatListProps) {
  const { chats, activeChat, onlineUsers } = useChatStore();
  const { user } = useAuthStore();

  const getChatName = (chat: Chat) => {
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

  const getChatAvatar = (chat: Chat) => {
    if (chat.type === 'GROUP') {
      return chat.name?.[0]?.toUpperCase() || 'G';
    }
    const otherParticipant = chat.participants.find(
      (p) => p.userId !== user?.id
    );
    if (otherParticipant) {
      return `${otherParticipant.user.firstName[0]}${otherParticipant.user.lastName[0]}`;
    }
    return 'U';
  };

  const isOnline = (chat: Chat) => {
    if (chat.type === 'GROUP') return false;
    const otherParticipant = chat.participants.find(
      (p) => p.userId !== user?.id
    );
    return otherParticipant ? onlineUsers.includes(otherParticipant.userId) : false;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getUnreadCount = (chat: Chat) => {
    const participant = chat.participants.find((p) => p.userId === user?.id);
    return participant?.unreadCount || 0;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-slate-200">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="search"
            placeholder="Search chats..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-sm">
            No chats yet
          </div>
        ) : (
          chats.map((chat) => {
            const unread = getUnreadCount(chat);
            return (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat)}
                className={cn(
                  'w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left border-b border-slate-100',
                  activeChat?.id === chat.id && 'bg-blue-50 hover:bg-blue-50'
                )}
              >
                {/* Avatar */}
                <div className="relative">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold',
                      chat.type === 'GROUP' ? 'bg-blue-500' : 'bg-slate-400'
                    )}
                  >
                    {getChatAvatar(chat)}
                  </div>
                  {isOnline(chat) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-800 truncate">
                      {getChatName(chat)}
                    </span>
                    {chat.lastMessage && (
                      <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
                        {formatTime(chat.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500 truncate">
                      {chat.lastMessage?.content || 'No messages yet'}
                    </p>
                    {unread > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full flex-shrink-0">
                        {unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}


