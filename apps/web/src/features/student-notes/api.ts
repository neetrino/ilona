import { api } from '@/shared/lib/api';
import type { StudentNote } from './types';

const ENDPOINT = '/student-notes/me';

export async function fetchStudentNotes(): Promise<StudentNote[]> {
  return api.get<StudentNote[]>(ENDPOINT);
}

export async function createStudentNote(content: string): Promise<StudentNote> {
  return api.post<StudentNote>(ENDPOINT, { content });
}

export async function deleteStudentNote(id: string): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`${ENDPOINT}/${id}`);
}
