export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE' | 'VIDEO';
export type ChatType = 'DIRECT' | 'GROUP';

export interface ChatUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: string;
  status?: string;
}

export interface ChatParticipant {
  id?: string;
  chatId?: string;
  userId: string;
  user: ChatUser;
  isAdmin?: boolean;
  lastReadAt?: string;
  unreadCount?: number;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  sender?: ChatUser;
  type: MessageType;
  content: string | null;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  isEdited: boolean;
  editedAt?: string;
  isSystem?: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  navigation?: {
    conversationId: string;
    groupId: string;
    messageId: string;
  };
}

export interface Chat {
  id: string;
  type: ChatType;
  name?: string;
  groupId?: string;
  group?: {
    id: string;
    name: string;
    level?: string;
    center?: {
      id: string;
      name: string;
    };
  };
  participants: ChatParticipant[];
  lastMessage?: Message | null;
  lastMessageAt?: string; // Timestamp of last message for sorting
  unreadCount?: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MessagesResponse {
  items: Message[];
  hasMore: boolean;
  nextCursor: string | null;
}

// Socket Events
export interface SocketEvents {
  // Connection
  'connection:success': {
    userId: string;
    chats: { id: string; onlineUsers: string[] }[];
  };

  // Messages
  'message:new': Message;
  'message:edited': Message;
  'message:deleted': { messageId: string; chatId: string };

  // Typing
  'typing:start': { chatId: string; userId: string };
  'typing:stop': { chatId: string; userId: string };

  // Read status
  'chat:read': { chatId: string; userId: string; readAt: string };

  // Online status
  'user:online': { chatId: string; userId: string };
  'user:offline': { chatId: string; userId: string };
}

// Send events
export interface SendMessagePayload {
  chatId: string;
  content: string;
  type?: MessageType;
  metadata?: Record<string, unknown>;
}

export interface EditMessagePayload {
  messageId: string;
  content: string;
}

export interface DeleteMessagePayload {
  messageId: string;
}

export interface VocabularyPayload {
  chatId: string;
  words: string[];
}
