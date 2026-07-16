'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
  fetchAdminStudentRecordings,
  type AdminStudentRecording,
} from '@/features/chat/api/chat.api';
import { chatKeys } from '@/features/chat/hooks/useChat';
import { useIsIPad } from '@/shared/hooks/useIsIPad';
import { useAppSearchUrl } from '@/shared/hooks/useAppSearchUrl';
import { readUrlSearchParam } from '@/shared/lib/url-search-params';
import {
  FILTERS_STORAGE_KEY,
  IPAD_RECORDINGS_PAGE_SIZE,
  RECORDINGS_PAGE_SIZE,
  STUDENT_VOICE_USER_ID_PARAM,
  STUDENT_VOICE_VIEW,
  STUDENT_VOICE_VIEW_PARAM,
} from './admin-recordings.constants';
import {
  directoryStudentGroupKey,
  fetchAllGroups,
  fetchAllStudentsDirectory,
  parseStoredFilters,
  type StudentRecordingRow,
} from './admin-recordings.utils';

export function useAdminRecordingsPage() {
  const tNav = useTranslations('nav');
  const t = useTranslations('recordings');
  const tCommon = useTranslations('common');
  const isIPad = useIsIPad();
  const { searchParams, urlRevision, replaceParams } = useAppSearchUrl();
  const recordingsPageSize = isIPad ? IPAD_RECORDINGS_PAGE_SIZE : RECORDINGS_PAGE_SIZE;
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectedStudentUserIds, setSelectedStudentUserIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);
  const cardsListStartRef = useRef<HTMLDivElement | null>(null);

  const voiceViewFromUrl =
    readUrlSearchParam(STUDENT_VOICE_VIEW_PARAM, searchParams, urlRevision) ===
    STUDENT_VOICE_VIEW
      ? STUDENT_VOICE_VIEW
      : null;
  const studentUserIdFromUrl = readUrlSearchParam(
    STUDENT_VOICE_USER_ID_PARAM,
    searchParams,
    urlRevision,
  );

  // Hydrate filters from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = parseStoredFilters();
    setSelectedGroupIds(stored.groupIds);
    setSelectedStudentUserIds(stored.studentUserIds);
    setSearch(stored.search);
    setDateFrom(stored.dateFrom);
    setDateTo(stored.dateTo);
    setIsHydrated(true);
  }, []);

  // Persist filters
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
        groupIds: Array.from(selectedGroupIds).sort(),
        studentIds: Array.from(selectedStudentUserIds).sort(),
        search,
        dateFrom,
        dateTo,
      }),
    );
  }, [
    isHydrated,
    selectedGroupIds,
    selectedStudentUserIds,
    search,
    dateFrom,
    dateTo,
  ]);

  const { data: allGroups = [], isLoading: isLoadingGroups } = useQuery({
    queryKey: [...chatKeys.all, 'admin', 'recordings-directory', 'groups'],
    queryFn: fetchAllGroups,
    staleTime: 60_000,
  });

  const { data: allStudents = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: [...chatKeys.all, 'admin', 'recordings-directory', 'students'],
    queryFn: fetchAllStudentsDirectory,
    staleTime: 60_000,
  });

  const isLoadingDirectory = isLoadingGroups || isLoadingStudents;

  const studentDirectory = useMemo(
    () =>
      allStudents
        .map((student) => ({
          studentId: student.id,
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

  const selectedStudent = useMemo(() => {
    if (voiceViewFromUrl !== STUDENT_VOICE_VIEW || !studentUserIdFromUrl) {
      return null;
    }
    const fromDirectory = studentDirectory.find(
      (student) => student.userId === studentUserIdFromUrl,
    );
    if (fromDirectory) {
      return {
        studentUserId: fromDirectory.userId,
        studentFullName: fromDirectory.fullName,
        groupName: fromDirectory.groupName,
      };
    }
    return {
      studentUserId: studentUserIdFromUrl,
      studentFullName: '',
      groupName: '',
    };
  }, [voiceViewFromUrl, studentUserIdFromUrl, studentDirectory]);

  const groupOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    allGroups.forEach((group) => {
      map.set(group.id, { id: group.id, name: group.name });
    });
    const hasUngrouped = studentDirectory.some((s) => s.groupId === null);
    if (hasUngrouped) map.set('ungrouped', { id: 'ungrouped', name: t('ungrouped') });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allGroups, studentDirectory, t]);

  const groupMultiOptions = useMemo(
    () => groupOptions.map((g) => ({ id: g.id, label: g.name })),
    [groupOptions],
  );

  const allowedStudentUserIds = useMemo(() => {
    if (selectedGroupIds.size === 0) {
      return new Set(studentDirectory.map((s) => s.userId));
    }
    const next = new Set<string>();
    studentDirectory.forEach((s) => {
      if (selectedGroupIds.has(directoryStudentGroupKey(s.groupId))) {
        next.add(s.userId);
      }
    });
    return next;
  }, [studentDirectory, selectedGroupIds]);

  const studentMultiOptions = useMemo(() => {
    const rows =
      selectedGroupIds.size === 0
        ? studentDirectory
        : studentDirectory.filter((s) =>
            selectedGroupIds.has(directoryStudentGroupKey(s.groupId)),
          );
    return rows.map((s) => ({
      id: s.userId,
      label: `${s.fullName} (${s.groupName})`,
    }));
  }, [studentDirectory, selectedGroupIds]);

  const isAllGroupsSelected =
    groupOptions.length > 0 &&
    selectedGroupIds.size === groupOptions.length &&
    groupOptions.every((g) => selectedGroupIds.has(g.id));

  const isAllStudentsSelected =
    studentMultiOptions.length > 0 &&
    selectedStudentUserIds.size === studentMultiOptions.length &&
    studentMultiOptions.every((s) => selectedStudentUserIds.has(s.id));

  const apiFilters = useMemo(() => {
    const shouldOmitGroupIds =
      groupOptions.length === 0 ||
      selectedGroupIds.size === 0 ||
      isAllGroupsSelected;
    const groupIds = shouldOmitGroupIds
      ? undefined
      : Array.from(selectedGroupIds).sort();

    const shouldOmitStudentIds =
      studentMultiOptions.length === 0 ||
      selectedStudentUserIds.size === 0 ||
      isAllStudentsSelected;
    const studentIds = shouldOmitStudentIds
      ? undefined
      : Array.from(selectedStudentUserIds).sort();

    return {
      ...(groupIds?.length ? { groupIds } : {}),
      ...(studentIds?.length ? { studentIds } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
    };
  }, [
    groupOptions.length,
    selectedGroupIds,
    isAllGroupsSelected,
    studentMultiOptions.length,
    selectedStudentUserIds,
    isAllStudentsSelected,
    search,
  ]);

  const apiFiltersKey = useMemo(
    () =>
      JSON.stringify({
        groupIds: apiFilters.groupIds ?? [],
        studentIds: apiFilters.studentIds ?? [],
        search: apiFilters.search ?? '',
      }),
    [apiFilters],
  );

  const { data: recordings = [], isLoading } = useQuery({
    queryKey: [...chatKeys.all, 'admin', 'student-recordings', apiFiltersKey],
    queryFn: () => fetchAdminStudentRecordings(apiFilters),
    enabled: isHydrated && !isLoadingDirectory,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  // Prune invalid group ids; default to all groups when nothing valid remains (after load or clear).
  useEffect(() => {
    if (!isHydrated || isLoadingDirectory) return;
    setSelectedGroupIds((prev) => {
      const validIds = new Set(groupOptions.map((g) => g.id));
      if (validIds.size === 0) {
        return prev.size === 0 ? prev : new Set();
      }
      const pruned = new Set<string>();
      prev.forEach((id) => {
        if (validIds.has(id)) pruned.add(id);
      });
      const next = pruned.size > 0 ? pruned : validIds;
      if (next.size === prev.size && [...prev].every((id) => next.has(id))) {
        return prev;
      }
      return next;
    });
  }, [isHydrated, isLoadingDirectory, groupOptions, selectedGroupIds]);

  // Keep student selection in sync with allowed set; default to all allowed when empty.
  useEffect(() => {
    if (!isHydrated || isLoadingDirectory) return;
    setSelectedStudentUserIds((prev) => {
      if (allowedStudentUserIds.size === 0) {
        return prev.size === 0 ? prev : new Set();
      }
      const pruned = new Set<string>();
      prev.forEach((uid) => {
        if (allowedStudentUserIds.has(uid)) pruned.add(uid);
      });
      const next =
        pruned.size > 0 ? pruned : new Set(allowedStudentUserIds);
      if (next.size === prev.size && [...prev].every((id) => next.has(id))) {
        return prev;
      }
      return next;
    });
  }, [
    isHydrated,
    isLoadingDirectory,
    allowedStudentUserIds,
    selectedStudentUserIds,
  ]);

  const visibleRecordings = useMemo(() => {
    const studentRows = studentDirectory.filter((student) => {
      if (isAllGroupsSelected || selectedGroupIds.size === 0) {
        return true;
      }
      return selectedGroupIds.has(directoryStudentGroupKey(student.groupId));
    });
    const selectedStudentFilter =
      !isAllStudentsSelected && selectedStudentUserIds.size > 0
        ? selectedStudentUserIds
        : null;
    const fromTs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toTs = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;
    const recordingsByStudent = new Map<string, AdminStudentRecording>();
    const recordingCountsByStudent = new Map<string, number>();

    recordings.forEach((recording) => {
      const ts = new Date(recording.createdAt).getTime();
      if (fromTs !== null && ts < fromTs) return;
      if (toTs !== null && ts > toTs) return;

      const userId = recording.student.userId;
      recordingCountsByStudent.set(
        userId,
        (recordingCountsByStudent.get(userId) ?? 0) + 1,
      );

      const existing = recordingsByStudent.get(userId);
      if (!existing) {
        recordingsByStudent.set(userId, recording);
        return;
      }

      const existingTs = new Date(existing.createdAt).getTime();
      if (ts > existingTs) {
        recordingsByStudent.set(userId, recording);
      }
    });

    const query = search.trim().toLowerCase();
    return studentRows
      .filter((student) => {
        if (
          selectedStudentFilter &&
          !selectedStudentFilter.has(student.userId)
        ) {
          return false;
        }

        const recording = recordingsByStudent.get(student.userId) ?? null;
        if (!query) return true;

        const haystack = [
          student.fullName,
          student.groupName,
          recording?.fileName ?? '',
        ].join(' ');

        return haystack.toLowerCase().includes(query);
      })
      .map<StudentRecordingRow>((student) => ({
        studentUserId: student.userId,
        studentFullName: student.fullName,
        groupId: student.groupId,
        groupName: student.groupName,
        recording: recordingsByStudent.get(student.userId) ?? null,
        recordingCount: recordingCountsByStudent.get(student.userId) ?? 0,
      }))
      .sort((a, b) => a.studentFullName.localeCompare(b.studentFullName));
  }, [
    studentDirectory,
    selectedGroupIds,
    isAllGroupsSelected,
    selectedStudentUserIds,
    isAllStudentsSelected,
    recordings,
    search,
    dateFrom,
    dateTo,
  ]);

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

  const clearAllFilters = () => {
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

  const openStudentHistory = (row: StudentRecordingRow) => {
    replaceParams(
      {
        [STUDENT_VOICE_VIEW_PARAM]: STUDENT_VOICE_VIEW,
        [STUDENT_VOICE_USER_ID_PARAM]: row.studentUserId,
      },
      { mode: 'push' },
    );
  };

  const closeStudentHistory = () => {
    replaceParams(
      {
        [STUDENT_VOICE_VIEW_PARAM]: null,
        [STUDENT_VOICE_USER_ID_PARAM]: null,
      },
      { mode: 'push' },
    );
  };

  return {
    tNav,
    t,
    tCommon,
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
    selectedStudent,
    openStudentHistory,
    closeStudentHistory,
    cardsListStartRef,
    isLoadingDirectory,
    groupMultiOptions,
    studentMultiOptions,
    studentDirectory,
    isLoading,
    visibleRecordings,
    paginatedRecordings,
    safePage,
    totalPages,
    clearAllFilters,
    goToPage,
  };
}

export type AdminRecordingsPageViewProps = ReturnType<typeof useAdminRecordingsPage>;
