'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createStudentNote, deleteStudentNote, fetchStudentNotes } from './api';
import type { StudentNote } from './types';

export const studentNoteKeys = {
  all: ['student-notes'] as const,
  mine: () => [...studentNoteKeys.all, 'me'] as const,
};

export function useMyStudentNotes() {
  return useQuery<StudentNote[]>({
    queryKey: studentNoteKeys.mine(),
    queryFn: fetchStudentNotes,
    staleTime: 60_000,
  });
}

export function useCreateStudentNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => createStudentNote(content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentNoteKeys.mine() });
    },
  });
}

export function useDeleteStudentNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStudentNote(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentNoteKeys.mine() });
    },
  });
}
