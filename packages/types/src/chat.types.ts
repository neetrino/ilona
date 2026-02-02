// ============================================
// Chat Types
// ============================================

export enum ChatType {
  GROUP = 'GROUP',
  DIRECT = 'DIRECT',
}

export enum MessageType {
  TEXT = 'TEXT',
  VOICE = 'VOICE',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM',
  VOCABULARY = 'VOCABULARY',
}

export interface Chat {
  id: string;
  type: ChatType;
  name?: string | null;
  groupId?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatWithParticipants extends Chat {
  participants: ChatParticipant[];
  _count?: {
    messages: number;
    participants: number;
  };
}

export interface ChatParticipant {
  id: string;
  chatId: string;
  userId: string;
  isAdmin: boolean;
  joinedAt: Date;
  leftAt?: Date | null;
  lastReadAt?: Date | null;
}

export interface ChatParticipantWithUser extends ChatParticipant {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
    role: string;
  };
}

export interface Message {
  id: string;
  chatId: string;
  senderId?: string | null;
  type: MessageType;
  content?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  duration?: number | null; // For voice messages
  metadata?: Record<string, unknown> | null;
  isSystem: boolean;
  isEdited: boolean;
  editedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageWithSender extends Message {
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
    role: string;
  } | null;
}

// ============================================
// Chat List Item (for sidebar)
// ============================================

export interface ChatListItem {
  id: string;
  type: ChatType;
  name: string;
  avatarUrl?: string | null;
  lastMessage?: {
    content?: string;
    type: MessageType;
    createdAt: Date;
    senderName?: string;
  } | null;
  unreadCount: number;
  isOnline?: boolean;
}

// ============================================
// Vocabulary Indicator (Admin view)
// ============================================

export interface VocabularyIndicator {
  lessonId: string;
  groupId: string;
  groupName: string;
  teacherId: string;
  teacherName: string;
  lessonDate: Date;
  vocabularySent: boolean;
  vocabularySentAt?: Date | null;
}

// ============================================
// WebSocket Events
// ============================================

export interface WsMessageEvent {
  type: 'message';
  chatId: string;
  message: MessageWithSender;
}

export interface WsTypingEvent {
  type: 'typing';
  chatId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface WsReadEvent {
  type: 'read';
  chatId: string;
  userId: string;
  messageId: string;
}

export interface WsOnlineEvent {
  type: 'online';
  userId: string;
  isOnline: boolean;
}

export type WsChatEvent = WsMessageEvent | WsTypingEvent | WsReadEvent | WsOnlineEvent;

// ============================================
// DTOs
// ============================================

export interface CreateDirectChatDto {
  participantIds: [string, string]; // Exactly 2 users
}

export interface SendMessageDto {
  chatId: string;
  type: MessageType;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
}

export interface SendVocabularyDto {
  chatId: string;
  lessonId: string;
  type: 'TEXT' | 'VOICE';
  content?: string; // For text vocabulary
  fileUrl?: string; // For voice vocabulary
  duration?: number;
}

export interface EditMessageDto {
  messageId: string;
  content: string;
}


