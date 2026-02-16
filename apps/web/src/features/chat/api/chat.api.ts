import { api } from '@/shared/lib/api';
import type { Chat, Message, MessagesResponse } from '../types';

const CHAT_ENDPOINT = '/chat';

/**
 * Fetch all user's chats
 */
export async function fetchChats(): Promise<Chat[]> {
  return api.get<Chat[]>(CHAT_ENDPOINT);
}

/**
 * Fetch a single chat by ID
 */
export async function fetchChat(chatId: string): Promise<Chat> {
  return api.get<Chat>(`${CHAT_ENDPOINT}/${chatId}`);
}

/**
 * Fetch messages for a chat with pagination
 */
export async function fetchMessages(
  chatId: string,
  cursor?: string,
  take = 50
): Promise<MessagesResponse> {
  const params = new URLSearchParams();
  if (cursor) params.append('cursor', cursor);
  params.append('take', String(take));

  const query = params.toString();
  return api.get<MessagesResponse>(`${CHAT_ENDPOINT}/${chatId}/messages?${query}`);
}

/**
 * Create a direct chat
 */
export async function createDirectChat(participantId: string): Promise<Chat> {
  return api.post<Chat>(CHAT_ENDPOINT, {
    participantIds: [participantId],
  });
}

/**
 * Send a message via HTTP (fallback)
 */
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
  }
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

/**
 * Get group chat
 */
export async function fetchGroupChat(groupId: string): Promise<Chat> {
  return api.get<Chat>(`${CHAT_ENDPOINT}/group/${groupId}`);
}

/**
 * Admin-only: Fetch students list for chat
 */
export interface AdminChatUser {
  id: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
}

/**
 * Admin-only: Fetch groups list for chat
 */
export interface AdminChatGroup {
  id: string;
  name: string;
  center?: {
    id: string;
    name: string;
  } | null;
}

export async function fetchAdminStudents(search?: string): Promise<AdminChatUser[]> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  const query = params.toString();
  const url = query ? `${CHAT_ENDPOINT}/admin/students?${query}` : `${CHAT_ENDPOINT}/admin/students`;
  return api.get<AdminChatUser[]>(url);
}

export async function fetchAdminTeachers(search?: string): Promise<AdminChatUser[]> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  const query = params.toString();
  const url = query ? `${CHAT_ENDPOINT}/admin/teachers?${query}` : `${CHAT_ENDPOINT}/admin/teachers`;
  return api.get<AdminChatUser[]>(url);
}

export async function fetchAdminGroups(search?: string): Promise<AdminChatGroup[]> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  const query = params.toString();
  const url = query ? `${CHAT_ENDPOINT}/admin/groups?${query}` : `${CHAT_ENDPOINT}/admin/groups`;
  return api.get<AdminChatGroup[]>(url);
}

/**
 * Teacher-only: Fetch teacher's assigned groups
 */
export interface TeacherGroup {
  id: string;
  name: string;
  level?: string | null;
  center?: {
    id: string;
    name: string;
  } | null;
  chatId: string | null;
  lastMessage?: {
    id: string;
    type?: string;
    content: string | null;
    fileName?: string | null;
    createdAt: string;
    sender: {
      id: string;
      firstName: string;
      lastName: string;
    };
  } | null;
  unreadCount: number;
  updatedAt: string;
}

export async function fetchTeacherGroups(search?: string): Promise<TeacherGroup[]> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  const query = params.toString();
  const url = query ? `${CHAT_ENDPOINT}/teacher/groups?${query}` : `${CHAT_ENDPOINT}/teacher/groups`;
  return api.get<TeacherGroup[]>(url);
}

/**
 * Teacher-only: Fetch teacher's assigned students
 */
export interface TeacherStudent {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  chatId: string | null;
  lastMessage?: {
    id: string;
    type?: string;
    content: string | null;
    fileName?: string | null;
    createdAt: string;
    sender: {
      id: string;
      firstName: string;
      lastName: string;
    };
  } | null;
  unreadCount: number;
  updatedAt: string;
}

export async function fetchTeacherStudents(search?: string): Promise<TeacherStudent[]> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  const query = params.toString();
  const url = query ? `${CHAT_ENDPOINT}/teacher/students?${query}` : `${CHAT_ENDPOINT}/teacher/students`;
  return api.get<TeacherStudent[]>(url);
}

/**
 * Teacher-only: Fetch admin user info for direct messaging
 */
export interface TeacherAdmin {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  avatarUrl?: string | null;
  chatId: string | null;
  lastMessage?: {
    id: string;
    type?: string;
    content: string | null;
    fileName?: string | null;
    createdAt: string;
    sender: {
      id: string;
      firstName: string;
      lastName: string;
    };
  } | null;
  unreadCount: number;
  updatedAt: string | null;
}

export async function fetchTeacherAdmin(): Promise<TeacherAdmin | null> {
  return api.get<TeacherAdmin | null>(`${CHAT_ENDPOINT}/teacher/admin`);
}