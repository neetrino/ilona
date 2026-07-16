import { api } from '@/shared/lib/api';
import type { Chat } from '../../types';
import { CHAT_ENDPOINT } from './chat-api.constants';
import type {
  AdminChatAllUser,
  AdminChatGroup,
  AdminChatUser,
  AdminStudentRecording,
  AdminStudentRecordingsFilters,
} from './chat-api.types';

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

export async function fetchAdminAllUsers(search?: string): Promise<AdminChatAllUser[]> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  const query = params.toString();
  const url = query ? `${CHAT_ENDPOINT}/admin/users?${query}` : `${CHAT_ENDPOINT}/admin/users`;
  return api.get<AdminChatAllUser[]>(url);
}

/** Admin-only: Add a member to a group chat (class/teaching group) */
export async function addGroupChatMember(
  groupId: string,
  userId: string,
): Promise<{ chatId: string; participant: { userId: string; joinedAt: string } }> {
  return api.post<{ chatId: string; participant: { userId: string; joinedAt: string } }>(
    `${CHAT_ENDPOINT}/group/${groupId}/members`,
    { userId },
  );
}

/** Admin-only: Create a custom group chat (standalone, not linked to classes) */
export async function createCustomGroupChat(data: {
  name: string;
  participantIds?: string[];
}): Promise<Chat> {
  return api.post<Chat>(`${CHAT_ENDPOINT}/custom-groups`, data);
}

/** Admin-only: Add a member to a custom group chat (by chat id) */
export async function addCustomGroupChatMember(
  chatId: string,
  userId: string,
): Promise<{ chatId: string; participant: { userId: string; joinedAt: string } }> {
  return api.post<{ chatId: string; participant: { userId: string; joinedAt: string } }>(
    `${CHAT_ENDPOINT}/custom-groups/${chatId}/members`,
    { userId },
  );
}

/** Admin-only: Delete a custom group chat (standalone, not linked to classes) */
export async function deleteCustomGroupChat(chatId: string): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`${CHAT_ENDPOINT}/custom-groups/${chatId}`);
}

/** Admin-only: Get all student voice recordings for Recordings section */
export async function fetchAdminStudentRecordings(
  filters?: AdminStudentRecordingsFilters,
): Promise<AdminStudentRecording[]> {
  const params = new URLSearchParams();
  if (filters?.groupIds?.length) {
    filters.groupIds.forEach((id) => params.append('groupIds', id));
  } else if (filters?.groupId) {
    params.append('groupId', filters.groupId);
  }
  if (filters?.studentIds?.length) {
    filters.studentIds.forEach((id) => params.append('studentIds', id));
  } else if (filters?.studentUserId) {
    params.append('studentUserId', filters.studentUserId);
  }
  if (filters?.search) params.append('search', filters.search);
  if (typeof filters?.skip === 'number' && Number.isFinite(filters.skip)) {
    params.append('skip', String(Math.max(0, Math.floor(filters.skip))));
  }
  if (typeof filters?.take === 'number' && Number.isFinite(filters.take)) {
    params.append('take', String(Math.max(1, Math.floor(filters.take))));
  }

  const query = params.toString();
  const url = query
    ? `${CHAT_ENDPOINT}/admin/student-recordings?${query}`
    : `${CHAT_ENDPOINT}/admin/student-recordings`;

  return api.get<AdminStudentRecording[]>(url);
}
