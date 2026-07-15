'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { fetchTeacherStudentRecordings } from '@/features/chat/api/chat.api';
import { chatKeys } from '@/features/chat/hooks/useChat';
import { useMyGroups } from '@/features/groups/hooks/useGroups';
import { useIsIPad } from '@/shared/hooks/useIsIPad';
import {
  FILTERS_STORAGE_KEY,
  IPAD_RECORDINGS_PAGE_SIZE,
  RECORDINGS_PAGE_SIZE,
} from './teacher-recordings.constants';
import {
  fetchAllAssignedStudentsDirectory,
  getStudentFullName,
} from './teacher-recordings.utils';

export function useTeacherRecordingsPage() {
  const t = useTranslations('recordings');
  const isIPad = useIsIPad();
  const recordingsPageSize = isIPad ? IPAD_RECORDINGS_PAGE_SIZE : RECORDINGS_PAGE_SIZE;
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(() => new Set());
  const [selectedStudentUserIds, setSelectedStudentUserIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const [selectedRecordingIds, setSelectedRecordingIds] = useState<Set<string>>(() => new Set());
  const [activeRecordingId, setActiveRecordingId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const cardsListStartRef = useRef<HTMLDivElement | null>(null);

  const { data: myGroups = [], isLoading: isLoadingGroups } = useMyGroups();

  const { data: recordings = [], isLoading } = useQuery({
    queryKey: [...chatKeys.all, 'teacher', 'student-recordings'],
    queryFn: () => fetchTeacherStudentRecordings(),
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  const { data: allStudents = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: [...chatKeys.all, 'teacher', 'recordings-directory', 'students'],
    queryFn: fetchAllAssignedStudentsDirectory,
    staleTime: 60_000,
  });

  const isLoadingDirectory = isLoadingGroups || isLoadingStudents;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (!raw) {
      setIsHydrated(true);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as {
        groupIds?: string[];
        studentIds?: string[];
        search?: string;
        dateFrom?: string;
        dateTo?: string;
      };
      setSelectedGroupIds(new Set(parsed.groupIds ?? []));
      setSelectedStudentUserIds(new Set(parsed.studentIds ?? []));
      setSearch(parsed.search ?? '');
      setDateFrom(parsed.dateFrom ?? '');
      setDateTo(parsed.dateTo ?? '');
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;
    const noFilters =
      selectedGroupIds.size === 0 &&
      selectedStudentUserIds.size === 0 &&
      !search &&
      !dateFrom &&
      !dateTo;
    if (noFilters) {
      localStorage.removeItem(FILTERS_STORAGE_KEY);
      return;
    }
    localStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify({
        groupIds: Array.from(selectedGroupIds),
        studentIds: Array.from(selectedStudentUserIds),
        search,
        dateFrom,
        dateTo,
      }),
    );
  }, [isHydrated, selectedGroupIds, selectedStudentUserIds, search, dateFrom, dateTo]);

  const studentDirectory = useMemo(
    () =>
      allStudents
        .map((student) => ({
          userId: student.userId,
          fullName:
            `${student.user.firstName} ${student.user.lastName}`.trim() ||
            student.userId,
          groupId: student.group?.id ?? null,
          groupName: student.group?.name ?? t('ungrouped'),
        }))
        .sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [allStudents, t],
  );

  const groupOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();

    myGroups.forEach((group) => {
      map.set(group.id, { id: group.id, name: group.name });
    });

    const hasUngrouped = studentDirectory.some((student) => student.groupId === null);
    if (hasUngrouped) {
      map.set('ungrouped', { id: 'ungrouped', name: t('ungrouped') });
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [myGroups, studentDirectory, t]);

  const groupMultiOptions = useMemo(
    () => groupOptions.map((group) => ({ id: group.id, label: group.name })),
    [groupOptions],
  );

  const studentMultiOptions = useMemo(() => {
    const rows =
      selectedGroupIds.size === 0
        ? studentDirectory
        : studentDirectory.filter((s) =>
            selectedGroupIds.has(s.groupId ?? 'ungrouped'),
          );
    return rows.map((s) => ({
      id: s.userId,
      label: `${s.fullName} (${s.groupName})`,
    }));
  }, [studentDirectory, selectedGroupIds]);

  const visibleRecordings = useMemo(() => {
    const query = search.trim().toLowerCase();
    const fromTs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toTs = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;

    return recordings
      .filter((recording) => {
        const recordingGroupId = recording.group.id ?? 'ungrouped';
        if (
          selectedGroupIds.size > 0 &&
          !selectedGroupIds.has(recordingGroupId)
        ) {
          return false;
        }
        if (
          selectedStudentUserIds.size > 0 &&
          !selectedStudentUserIds.has(recording.student.userId)
        ) {
          return false;
        }
        const ts = new Date(recording.createdAt).getTime();
        if (fromTs !== null && ts < fromTs) return false;
        if (toTs !== null && ts > toTs) return false;
        if (!query) return true;
        const haystack = [
          getStudentFullName(recording),
          recording.group.name,
          recording.fileName ?? '',
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [recordings, selectedGroupIds, selectedStudentUserIds, search, dateFrom, dateTo]);

  useEffect(() => {
    setPage(0);
  }, [selectedGroupIds, selectedStudentUserIds, search, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(visibleRecordings.length / recordingsPageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paginatedRecordings = useMemo(
    () =>
      visibleRecordings.slice(
        safePage * recordingsPageSize,
        safePage * recordingsPageSize + recordingsPageSize,
      ),
    [safePage, visibleRecordings, recordingsPageSize],
  );

  useEffect(() => {
    setSelectedRecordingIds((prev) => {
      if (prev.size === 0) return prev;
      const visibleIds = new Set(visibleRecordings.map((r) => r.id));
      const next = new Set<string>();
      prev.forEach((id) => visibleIds.has(id) && next.add(id));
      return next.size === prev.size ? prev : next;
    });
  }, [visibleRecordings]);

  const allVisibleSelected =
    visibleRecordings.length > 0 &&
    visibleRecordings.every((r) => selectedRecordingIds.has(r.id));

  const toggleAll = () => {
    if (allVisibleSelected) {
      setSelectedRecordingIds(new Set());
      return;
    }
    setSelectedRecordingIds(new Set(visibleRecordings.map((r) => r.id)));
  };

  const toggleOne = (id: string) => {
    setSelectedRecordingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const resetFilters = () => {
    setSelectedGroupIds(new Set());
    setSelectedStudentUserIds(new Set());
    setSearch('');
    setDateFrom('');
    setDateTo('');
  };

  const goToPage = (nextPage: number) => {
    setPage(nextPage);
    requestAnimationFrame(() => {
      cardsListStartRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  return {
    t,
    isIPad,
    selectedGroupIds,
    setSelectedGroupIds,
    selectedStudentUserIds,
    setSelectedStudentUserIds,
    search,
    setSearch,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    selectedRecordingIds,
    activeRecordingId,
    setActiveRecordingId,
    cardsListStartRef,
    isLoading,
    isLoadingDirectory,
    groupMultiOptions,
    studentMultiOptions,
    visibleRecordings,
    paginatedRecordings,
    allVisibleSelected,
    toggleAll,
    toggleOne,
    resetFilters,
    goToPage,
    safePage,
    totalPages,
  };
}
