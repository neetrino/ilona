'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createTeacherNote,
  deleteTeacherNote,
  fetchTeacherNotes,
} from './api';
import type { TeacherNote } from './types';

export const teacherNoteKeys = {
  all: ['teacher-notes'] as const,
  mine: () => [...teacherNoteKeys.all, 'me'] as const,
};

export function useMyTeacherNotes() {
  return useQuery<TeacherNote[]>({
    queryKey: teacherNoteKeys.mine(),
    queryFn: fetchTeacherNotes,
    staleTime: 60_000,
  });
}

export function useCreateTeacherNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => createTeacherNote(content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teacherNoteKeys.mine() });
    },
  });
}

export function useDeleteTeacherNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTeacherNote(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teacherNoteKeys.mine() });
    },
  });
}
