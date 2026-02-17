import { api } from '@/shared/lib/api';
import type {
  Teacher,
  TeachersResponse,
  TeacherFilters,
  CreateTeacherDto,
  UpdateTeacherDto,
  TeacherStatistics,
} from '../types';

const TEACHERS_ENDPOINT = '/teachers';

/**
 * Fetch all teachers with optional filters
 */
export async function fetchTeachers(filters?: TeacherFilters): Promise<TeachersResponse> {
  const params = new URLSearchParams();
  
  if (filters?.skip !== undefined) params.append('skip', String(filters.skip));
  if (filters?.take !== undefined) params.append('take', String(filters.take));
  if (filters?.search) params.append('search', filters.search);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.sortBy) params.append('sortBy', filters.sortBy);
  if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

  const query = params.toString();
  const url = query ? `${TEACHERS_ENDPOINT}?${query}` : TEACHERS_ENDPOINT;
  
  return api.get<TeachersResponse>(url);
}

/**
 * Fetch a single teacher by ID
 */
export async function fetchTeacher(id: string): Promise<Teacher> {
  return api.get<Teacher>(`${TEACHERS_ENDPOINT}/${id}`);
}

/**
 * Fetch teacher statistics
 */
export async function fetchTeacherStatistics(
  id: string,
  dateFrom?: string,
  dateTo?: string
): Promise<TeacherStatistics> {
  const params = new URLSearchParams();
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);

  const query = params.toString();
  const url = query
    ? `${TEACHERS_ENDPOINT}/${id}/statistics?${query}`
    : `${TEACHERS_ENDPOINT}/${id}/statistics`;

  return api.get<TeacherStatistics>(url);
}

/**
 * Create a new teacher
 */
export async function createTeacher(data: CreateTeacherDto): Promise<Teacher> {
  return api.post<Teacher>(TEACHERS_ENDPOINT, data);
}

/**
 * Update an existing teacher
 */
export async function updateTeacher(id: string, data: UpdateTeacherDto): Promise<Teacher> {
  return api.put<Teacher>(`${TEACHERS_ENDPOINT}/${id}`, data);
}

/**
 * Delete a teacher
 */
export async function deleteTeacher(id: string): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`${TEACHERS_ENDPOINT}/${id}`);
}

/**
 * Delete multiple teachers
 */
export async function deleteTeachers(ids: string[]): Promise<{ success: boolean; deletedCount: number }> {
  return api.delete<{ success: boolean; deletedCount: number }>(`${TEACHERS_ENDPOINT}/bulk`, {
    body: JSON.stringify({ ids }),
  });
}

/**
 * Fetch teacher obligation details
 */
export interface ObligationItem {
  key: string;
  label: string;
  done: boolean;
  completedCount: number;
  totalCount: number;
  doneAt?: string;
}

export interface TeacherObligationDetails {
  total: number;
  completed: number;
  items: ObligationItem[];
}

export async function fetchTeacherObligation(teacherId: string): Promise<TeacherObligationDetails> {
  return api.get<TeacherObligationDetails>(`${TEACHERS_ENDPOINT}/${teacherId}/obligation`);
}