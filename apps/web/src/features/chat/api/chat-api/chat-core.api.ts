import { api } from '@/shared/lib/api';
import type { Chat, Message, MessagesResponse } from '../../types';
import { CHAT_ENDPOINT } from './chat-api.constants';

/** Fetch all user's chats */
export async function fetchChats(): Promise<Chat[]> {
  return api.get<Chat[]>(CHAT_ENDPOINT);
}

/** Fetch a single chat by ID */
export async function fetchChat(chatId: string): Promise<Chat> {
  return api.get<Chat>(`${CHAT_ENDPOINT}/${chatId}`);
}

/** Fetch messages for a chat with pagination */
export async function fetchMessages(
  chatId: string,
  cursor?: string,
  take = 50,
): Promise<MessagesResponse> {
  const params = new URLSearchParams();
  if (cursor) params.append('cursor', cursor);
  params.append('take', String(take));

  const query = params.toString();
  return api.get<MessagesResponse>(`${CHAT_ENDPOINT}/${chatId}/messages?${query}`);
}

/** Create a direct chat */
export async function createDirectChat(participantId: string): Promise<Chat> {
  return api.post<Chat>(CHAT_ENDPOINT, {
    participantIds: [participantId],
  });
}

/** Send a message via HTTP (fallback) */
export async function sendMessageHttp(
  chatId: string,
  content: string,
  type = 'TEXT',
  options?: {
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    duration?: number;
    metadata?: Record<string, unknown>;
  },
): Promise<Message> {
  return api.post<Message>(`${CHAT_ENDPOINT}/messages`, {
    chatId,
    content,
    type,
    fileUrl: options?.fileUrl,
    fileName: options?.fileName,
    fileSize: options?.fileSize,
    duration: options?.duration,
    metadata: options?.metadata,
  });
}

/** Get group chat */
export async function fetchGroupChat(groupId: string): Promise<Chat> {
  return api.get<Chat>(`${CHAT_ENDPOINT}/group/${groupId}`);
}

/** Fetch custom group chats the current user belongs to */
export async function fetchCustomGroupChats(): Promise<Chat[]> {
  return api.get<Chat[]>(`${CHAT_ENDPOINT}/custom-groups`);
}

/** Mark a chat as read */
export async function markChatAsRead(chatId: string): Promise<{ success: boolean }> {
  return api.post<{ success: boolean }>(`${CHAT_ENDPOINT}/${chatId}/read`);
}
