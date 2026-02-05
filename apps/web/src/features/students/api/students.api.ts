import { api } from '@/shared/lib/api';
import type {
  Student,
  StudentsResponse,
  StudentFilters,
  CreateStudentDto,
  UpdateStudentDto,
  StudentStatistics,
  StudentDashboard,
} from '../types';

const STUDENTS_ENDPOINT = '/students';

/**
 * Fetch all students with optional filters
 */
export async function fetchStudents(filters?: StudentFilters): Promise<StudentsResponse> {
  const params = new URLSearchParams();
  
  if (filters?.skip !== undefined) params.append('skip', String(filters.skip));
  if (filters?.take !== undefined) params.append('take', String(filters.take));
  if (filters?.search) params.append('search', filters.search);
  if (filters?.groupId) params.append('groupId', filters.groupId);
  if (filters?.status) params.append('status', filters.status);

  const query = params.toString();
  const url = query ? `${STUDENTS_ENDPOINT}?${query}` : STUDENTS_ENDPOINT;
  
  return api.get<StudentsResponse>(url);
}

/**
 * Fetch a single student by ID
 */
export async function fetchStudent(id: string): Promise<Student> {
  return api.get<Student>(`${STUDENTS_ENDPOINT}/${id}`);
}

/**
 * Fetch student statistics
 */
export async function fetchStudentStatistics(id: string): Promise<StudentStatistics> {
  return api.get<StudentStatistics>(`${STUDENTS_ENDPOINT}/${id}/statistics`);
}

/**
 * Create a new student
 */
export async function createStudent(data: CreateStudentDto): Promise<Student> {
  return api.post<Student>(STUDENTS_ENDPOINT, data);
}

/**
 * Update an existing student
 */
export async function updateStudent(id: string, data: UpdateStudentDto): Promise<Student> {
  return api.put<Student>(`${STUDENTS_ENDPOINT}/${id}`, data);
}

/**
 * Change student's group
 */
export async function changeStudentGroup(id: string, groupId: string | null): Promise<Student> {
  return api.patch<Student>(`${STUDENTS_ENDPOINT}/${id}/group`, { groupId });
}

/**
 * Delete a student
 */
export async function deleteStudent(id: string): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`${STUDENTS_ENDPOINT}/${id}`);
}

/**
 * Fetch student's own dashboard (for logged-in student)
 */
export async function fetchMyDashboard(): Promise<StudentDashboard> {
  return api.get<StudentDashboard>(`${STUDENTS_ENDPOINT}/me/dashboard`);
}

/**
 * Fetch students assigned to the currently logged-in teacher
 */
export async function fetchMyAssignedStudents(filters?: StudentFilters): Promise<StudentsResponse> {
  const params = new URLSearchParams();
  
  if (filters?.skip !== undefined) params.append('skip', String(filters.skip));
  if (filters?.take !== undefined) params.append('take', String(filters.take));
  if (filters?.search) params.append('search', filters.search);
  if (filters?.status) params.append('status', filters.status);

  const query = params.toString();
  const url = query ? `${STUDENTS_ENDPOINT}/me/assigned?${query}` : `${STUDENTS_ENDPOINT}/me/assigned`;
  
  return api.get<StudentsResponse>(url);
}