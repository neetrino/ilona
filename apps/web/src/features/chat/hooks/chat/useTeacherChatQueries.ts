'use client';

import { useQuery } from '@tanstack/react-query';
import {
  fetchTeacherGroups,
  fetchTeacherStudents,
  fetchTeacherAdmin,
} from '../../api/chat.api';
import { chatKeys } from './chat-query-keys';

export function useTeacherGroups(search?: string) {
  return useQuery({
    queryKey: chatKeys.teacherGroups(search),
    queryFn: () => fetchTeacherGroups(search),
    staleTime: 0,
  });
}

export function useTeacherStudents(search?: string) {
  return useQuery({
    queryKey: chatKeys.teacherStudents(search),
    queryFn: () => fetchTeacherStudents(search),
    staleTime: 60 * 1000,
  });
}

export function useTeacherAdmin() {
  return useQuery({
    queryKey: chatKeys.teacherAdmin(),
    queryFn: () => fetchTeacherAdmin(),
    staleTime: 60 * 1000,
  });
}
