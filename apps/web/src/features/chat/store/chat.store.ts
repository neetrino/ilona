import { create } from 'zustand';

export interface ChatUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  sender?: ChatUser;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE' | 'VIDEO' | 'VOCABULARY';
  content?: string;
  fileUrl?: string;
  fileName?: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Chat {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name?: string;
  groupId?: string;
  participants: Array<{
    userId: string;
    user: ChatUser;
    unreadCount: number;
  }>;
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}

interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Message[];
  isLoading: boolean;
  isConnected: boolean;
  onlineUsers: string[];
  typingUsers: Record<string, string[]>; // chatId -> userIds

  setChats: (chats: Chat[]) => void;
  setActiveChat: (chat: Chat | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (messageId: string) => void;
  setLoading: (loading: boolean) => void;
  setConnected: (connected: boolean) => void;
  setOnlineUsers: (users: string[]) => void;
  addTypingUser: (chatId: string, userId: string) => void;
  removeTypingUser: (chatId: string, userId: string) => void;
  updateLastMessage: (chatId: string, message: Message) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  activeChat: null,
  messages: [],
  isLoading: false,
  isConnected: false,
  onlineUsers: [],
  typingUsers: {},

  setChats: (chats) => set({ chats }),
  
  setActiveChat: (chat) => set({ activeChat: chat, messages: [] }),
  
  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateMessage: (messageId, updates) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, ...updates } : m
      ),
    })),

  deleteMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId),
    })),

  setLoading: (isLoading) => set({ isLoading }),
  
  setConnected: (isConnected) => set({ isConnected }),
  
  setOnlineUsers: (onlineUsers) => set({ onlineUsers }),

  addTypingUser: (chatId, userId) =>
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [chatId]: [...(state.typingUsers[chatId] || []), userId].filter(
          (id, i, arr) => arr.indexOf(id) === i
        ),
      },
    })),

  removeTypingUser: (chatId, userId) =>
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [chatId]: (state.typingUsers[chatId] || []).filter((id) => id !== userId),
      },
    })),

  updateLastMessage: (chatId, message) =>
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === chatId ? { ...chat, lastMessage: message } : chat
      ),
    })),
}));


