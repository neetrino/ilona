'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchStudentAdmin } from '../../api/chat.api';
import { chatKeys } from './chat-query-keys';

export function useStudentAdmin() {
  return useQuery({
    queryKey: chatKeys.studentAdmin(),
    queryFn: () => fetchStudentAdmin(),
    staleTime: 60 * 1000,
  });
}
