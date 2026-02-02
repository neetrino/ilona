import { api } from '@/shared/lib/api';
import type {
  Group,
  GroupsResponse,
  GroupFilters,
  CreateGroupDto,
  UpdateGroupDto,
} from '../types';

const GROUPS_ENDPOINT = '/groups';

/**
 * Fetch all groups with optional filters
 */
export async function fetchGroups(filters?: GroupFilters): Promise<GroupsResponse> {
  const params = new URLSearchParams();
  
  if (filters?.skip !== undefined) params.append('skip', String(filters.skip));
  if (filters?.take !== undefined) params.append('take', String(filters.take));
  if (filters?.search) params.append('search', filters.search);
  if (filters?.centerId) params.append('centerId', filters.centerId);
  if (filters?.teacherId) params.append('teacherId', filters.teacherId);
  if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
  if (filters?.level) params.append('level', filters.level);

  const query = params.toString();
  const url = query ? `${GROUPS_ENDPOINT}?${query}` : GROUPS_ENDPOINT;
  
  return api.get<GroupsResponse>(url);
}

/**
 * Fetch a single group by ID
 */
export async function fetchGroup(id: string): Promise<Group> {
  return api.get<Group>(`${GROUPS_ENDPOINT}/${id}`);
}

/**
 * Create a new group
 */
export async function createGroup(data: CreateGroupDto): Promise<Group> {
  return api.post<Group>(GROUPS_ENDPOINT, data);
}

/**
 * Update an existing group
 */
export async function updateGroup(id: string, data: UpdateGroupDto): Promise<Group> {
  return api.put<Group>(`${GROUPS_ENDPOINT}/${id}`, data);
}

/**
 * Delete a group
 */
export async function deleteGroup(id: string): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`${GROUPS_ENDPOINT}/${id}`);
}

/**
 * Toggle group active status
 */
export async function toggleGroupActive(id: string): Promise<Group> {
  return api.patch<Group>(`${GROUPS_ENDPOINT}/${id}/toggle-active`, {});
}

/**
 * Assign teacher to group
 */
export async function assignTeacher(groupId: string, teacherId: string): Promise<Group> {
  return api.patch<Group>(`${GROUPS_ENDPOINT}/${groupId}/assign-teacher`, { teacherId });
}

/**
 * Add student to group
 */
export async function addStudentToGroup(groupId: string, studentId: string): Promise<{ success: boolean }> {
  return api.post<{ success: boolean }>(`${GROUPS_ENDPOINT}/${groupId}/students`, { studentId });
}

/**
 * Remove student from group
 */
export async function removeStudentFromGroup(groupId: string, studentId: string): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`${GROUPS_ENDPOINT}/${groupId}/students/${studentId}`);
}
