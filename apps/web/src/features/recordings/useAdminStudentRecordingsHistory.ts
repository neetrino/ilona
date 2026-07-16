'use client';

import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import {
  fetchAdminStudentRecordings,
  type AdminStudentRecording,
} from '@/features/chat/api/chat.api';
import { chatKeys } from '@/features/chat/hooks/useChat';
import { STUDENT_HISTORY_PAGE_SIZE } from './admin-recordings.constants';
import { groupRecordingsByDay } from './admin-recordings.utils';

export function useAdminStudentRecordingsHistory(
  studentUserId: string | null,
  open: boolean,
) {
  const locale = useLocale();

  const query = useInfiniteQuery({
    queryKey: [
      ...chatKeys.all,
      'admin',
      'student-recordings-history',
      studentUserId,
    ],
    enabled: open && !!studentUserId,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchAdminStudentRecordings({
        studentIds: studentUserId ? [studentUserId] : [],
        skip: pageParam,
        take: STUDENT_HISTORY_PAGE_SIZE,
      }),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < STUDENT_HISTORY_PAGE_SIZE) return undefined;
      return allPages.reduce((sum, page) => sum + page.length, 0);
    },
    staleTime: 60_000,
  });

  const recordings = useMemo<AdminStudentRecording[]>(
    () => query.data?.pages.flat() ?? [],
    [query.data],
  );

  const dayGroups = useMemo(
    () => groupRecordingsByDay(recordings, locale),
    [recordings, locale],
  );

  return {
    ...query,
    recordings,
    dayGroups,
  };
}
