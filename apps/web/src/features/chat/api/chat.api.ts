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
 * Admin-only: Fetch all registered users (for add-member picker)
 */
export interface AdminChatAllUser {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
}

export async function fetchAdminAllUsers(search?: string): Promise<AdminChatAllUser[]> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  const query = params.toString();
  const url = query ? `${CHAT_ENDPOINT}/admin/users?${query}` : `${CHAT_ENDPOINT}/admin/users`;
  return api.get<AdminChatAllUser[]>(url);
}

/**
 * Admin-only: Add a member to a group chat (class/teaching group)
 */
export async function addGroupChatMember(
  groupId: string,
  userId: string
): Promise<{ chatId: string; participant: { userId: string; joinedAt: string } }> {
  return api.post<{ chatId: string; participant: { userId: string; joinedAt: string } }>(
    `${CHAT_ENDPOINT}/group/${groupId}/members`,
    { userId }
  );
}

/**
 * Admin-only: Create a custom group chat (standalone, not linked to classes)
 */
export async function createCustomGroupChat(data: {
  name: string;
  participantIds?: string[];
}): Promise<Chat> {
  return api.post<Chat>(`${CHAT_ENDPOINT}/custom-groups`, data);
}

/**
 * Fetch custom group chats the current user belongs to
 */
export async function fetchCustomGroupChats(): Promise<Chat[]> {
  return api.get<Chat[]>(`${CHAT_ENDPOINT}/custom-groups`);
}

/**
 * Admin-only: Add a member to a custom group chat (by chat id)
 */
export async function addCustomGroupChatMember(
  chatId: string,
  userId: string
): Promise<{ chatId: string; participant: { userId: string; joinedAt: string } }> {
  return api.post<{ chatId: string; participant: { userId: string; joinedAt: string } }>(
    `${CHAT_ENDPOINT}/custom-groups/${chatId}/members`,
    { userId }
  );
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
  /** Total message count in the group chat (fallback when unread not available). */
  messageCount?: number;
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

/**
 * Student-only: Fetch admin user info for direct messaging
 */
export interface StudentAdmin {
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

export async function fetchStudentAdmin(): Promise<StudentAdmin | null> {
  return api.get<StudentAdmin | null>(`${CHAT_ENDPOINT}/student/admin`);
}

/**
 * Mark a chat as read
 */
export async function markChatAsRead(chatId: string): Promise<{ success: boolean }> {
  return api.post<{ success: boolean }>(`${CHAT_ENDPOINT}/${chatId}/read`);
}

/**
 * Student-only: Get voice messages sent to teacher (for Recordings section)
 */
export interface VoiceToTeacherRecording {
  id: string;
  fileUrl: string;
  fileName?: string;
  duration: number;
  createdAt: string;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

export async function fetchStudentVoiceToTeacherRecordings(): Promise<VoiceToTeacherRecording[]> {
  return api.get<VoiceToTeacherRecording[]>(`${CHAT_ENDPOINT}/student/voice-to-teacher-recordings`);
}