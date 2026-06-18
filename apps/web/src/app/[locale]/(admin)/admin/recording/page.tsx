'use client';

import { portalPageStackClass } from '@/shared/lib/portal-theme';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { DatePickerInput } from '@/shared/components/ui';
import { VoiceMessagePlayer } from '@/features/chat/components/VoiceMessagePlayer';
import { MultiSelectChipsDropdown } from '@/shared/components/ui/multi-select-chips-dropdown';
import { fetchGroups } from '@/features/groups/api/groups.api';
import { fetchStudents } from '@/features/students/api/students.api';
import {
  fetchAdminStudentRecordings,
  type AdminStudentRecording,
} from '@/features/chat/api/chat.api';
import { chatKeys } from '@/features/chat/hooks/useChat';
import type { Group } from '@/features/groups/types';
import type { Student, TeacherAssignedItem } from '@/features/students/types';
import { useIsIPad } from '@/shared/hooks/useIsIPad';

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatIsoDay(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

const DIRECTORY_PAGE_SIZE = 100;
const RECORDINGS_PAGE_SIZE = 5;
const IPAD_RECORDINGS_PAGE_SIZE = 10;
const FILTERS_STORAGE_KEY = 'admin-recordings:filters-v3';
const LEGACY_FILTERS_KEY = 'admin-recordings:filters-v2';
const LEGACY_GROUP_KEY = 'admin-recordings:selected-group';
const LEGACY_STUDENT_KEY = 'admin-recordings:selected-student';

function isFullStudent(item: TeacherAssignedItem): item is Student {
  return 'user' in item;
}

function directoryStudentGroupKey(groupId: string | null): string {
  return groupId === null ? 'ungrouped' : groupId;
}

async function fetchAllGroups(): Promise<Group[]> {
  const groups: Group[] = [];
  let skip = 0;
  for (;;) {
    const page = await fetchGroups({ skip, take: DIRECTORY_PAGE_SIZE });
    groups.push(...page.items);
    skip += page.items.length;
    if (skip >= page.total || page.items.length === 0) break;
  }
  return groups;
}

async function fetchAllStudentsDirectory(): Promise<Student[]> {
  const students: Student[] = [];
  let skip = 0;
  for (;;) {
    const page = await fetchStudents({ skip, take: DIRECTORY_PAGE_SIZE });
    const fullStudents = page.items.filter(isFullStudent);
    students.push(...fullStudents);
    skip += page.items.length;
    if (skip >= page.total || page.items.length === 0) break;
  }
  return students;
}

interface StoredFilters {
  groupIds: Set<string>;
  studentUserIds: Set<string>;
  search: string;
  dateFrom: string;
  dateTo: string;
}

interface StudentRecordingRow {
  studentUserId: string;
  studentFullName: string;
  groupId: string | null;
  groupName: string;
  recording: AdminStudentRecording | null;
}

function parseStoredFilters(): StoredFilters {
  const empty: StoredFilters = {
    groupIds: new Set(),
    studentUserIds: new Set(),
    search: '',
    dateFrom: '',
    dateTo: '',
  };
  if (typeof window === 'undefined') return empty;

  try {
    const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as {
        groupIds?: string[];
        studentIds?: string[];
        search?: string;
        dateFrom?: string;
        dateTo?: string;
      };
      return {
        groupIds: new Set(Array.isArray(parsed.groupIds) ? parsed.groupIds : []),
        studentUserIds: new Set(
          Array.isArray(parsed.studentIds) ? parsed.studentIds : [],
        ),
        search: typeof parsed.search === 'string' ? parsed.search : '',
        dateFrom: typeof parsed.dateFrom === 'string' ? parsed.dateFrom : '',
        dateTo: typeof parsed.dateTo === 'string' ? parsed.dateTo : '',
      };
    }
  } catch {
    /* fall through to legacy */
  }

  // Legacy fallbacks
  try {
    const legacyV2 = localStorage.getItem(LEGACY_FILTERS_KEY);
    if (legacyV2) {
      const parsed = JSON.parse(legacyV2) as {
        groupIds?: string[];
        studentIds?: string[];
      };
      return {
        ...empty,
        groupIds: new Set(Array.isArray(parsed.groupIds) ? parsed.groupIds : []),
        studentUserIds: new Set(
          Array.isArray(parsed.studentIds) ? parsed.studentIds : [],
        ),
      };
    }
  } catch {
    /* ignore */
  }

  const legacyGroup = localStorage.getItem(LEGACY_GROUP_KEY);
  const legacyStudent = localStorage.getItem(LEGACY_STUDENT_KEY);
  if (legacyGroup) {
    return {
      ...empty,
      groupIds: new Set([legacyGroup]),
      studentUserIds:
        legacyStudent && legacyStudent !== 'all' && legacyStudent !== ''
          ? new Set([legacyStudent])
          : new Set(),
    };
  }

  return empty;
}

export default function AdminRecordingPage() {
  const tNav = useTranslations('nav');
  const t = useTranslations('recordings');
  const tCommon = useTranslations('common');
  const isIPad = useIsIPad();
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
  const [activeRecordingId, setActiveRecordingId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const cardsListStartRef = useRef<HTMLDivElement | null>(null);

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

    recordings.forEach((recording) => {
      const ts = new Date(recording.createdAt).getTime();
      if (fromTs !== null && ts < fromTs) return;
      if (toTs !== null && ts > toTs) return;

      const existing = recordingsByStudent.get(recording.student.userId);
      if (!existing) {
        recordingsByStudent.set(recording.student.userId, recording);
        return;
      }

      const existingTs = new Date(existing.createdAt).getTime();
      if (ts > existingTs) {
        recordingsByStudent.set(recording.student.userId, recording);
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

  const rangeStart = visibleRecordings.length === 0 ? 0 : safePage * recordingsPageSize + 1;
  const rangeEnd = Math.min((safePage + 1) * recordingsPageSize, visibleRecordings.length);

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

  return (
    <DashboardLayout
      title={tNav('recordings')}
      subtitle={tNav('adminRecordingsSubtitle')}
    >
      <div className={portalPageStackClass}>
      {/* Filters */}
      <div className="mb-2 grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(min(100%,11rem),1fr))]">
        <div className="md:col-span-2">
          <MultiSelectChipsDropdown
            label={tCommon('group')}
            options={groupMultiOptions}
            selectedIds={selectedGroupIds}
            onSelectionChange={setSelectedGroupIds}
            showSelectedChipsOnlyWhenOpen
            hideSelectedLabelsInTrigger
            placeholder={t('allGroups')}
            searchPlaceholder={t('searchGroups')}
            emptyOptionsHint={t('noGroups')}
            noResultsHint={t('noGroupsMatch')}
            isLoading={isLoadingDirectory}
            maxChipsHeightClassName="max-h-28"
          />
        </div>

        <div className="md:col-span-2">
          <MultiSelectChipsDropdown
            label={tCommon('searchTypeStudent')}
            options={studentMultiOptions}
            selectedIds={selectedStudentUserIds}
            onSelectionChange={setSelectedStudentUserIds}
            showSelectedChipsOnlyWhenOpen
            hideSelectedLabelsInTrigger
            placeholder={
              selectedGroupIds.size === 0 ? t('allStudents') : t('studentsInSelectedGroups')
            }
            searchPlaceholder={t('searchStudents')}
            emptyOptionsHint={
              selectedGroupIds.size === 0 ? t('noStudents') : t('noStudentsInGroups')
            }
            noResultsHint={t('noStudentsMatch')}
            isLoading={isLoadingDirectory}
            maxChipsHeightClassName="max-h-28"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:contents">
          <div>
            <label
              htmlFor="rec-date-from"
              className="block text-sm font-medium text-[#3b3b40] mb-1.5"
            >
              {tCommon('from')}
            </label>
            <DatePickerInput
              id="rec-date-from"
              value={dateFrom}
              max={dateTo || undefined}
              onValueChange={setDateFrom}
              className="w-full h-11 px-3 bg-white border border-[rgba(14,14,16,0.07)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20 focus:border-[#1010a3]"
            />
          </div>

          <div>
            <label
              htmlFor="rec-date-to"
              className="block text-sm font-medium text-[#3b3b40] mb-1.5"
            >
              {tCommon('to')}
            </label>
            <DatePickerInput
              id="rec-date-to"
              value={dateTo}
              min={dateFrom || undefined}
              onValueChange={setDateTo}
              className="w-full h-11 px-3 bg-white border border-[rgba(14,14,16,0.07)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20 focus:border-[#1010a3]"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
        <div className="flex-1">
          <label
            htmlFor="rec-search"
            className="block text-sm font-medium text-[#3b3b40] mb-1.5"
          >
            {tCommon('search')}
          </label>
          <input
            id="rec-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full h-11 px-3 bg-white border border-[rgba(14,14,16,0.07)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1010a3]/20 focus:border-[#1010a3]"
          />
        </div>
        <button
          type="button"
          onClick={clearAllFilters}
          className="h-11 px-4 bg-[#f6f6f7] hover:bg-[#f6f6f7] text-[#3b3b40] text-sm font-medium rounded-lg border border-[rgba(14,14,16,0.07)] transition-colors"
        >
          {t('clearAll')}
        </button>
      </div>

      <div className="mb-3 text-sm text-[#8b8b90]">
        {t('studentsShown', { count: visibleRecordings.length })}
      </div>

      {/* Mobile cards */}
      <div ref={cardsListStartRef} />
      <div
        className={`${
          isIPad ? 'grid grid-cols-2 gap-3' : 'space-y-3'
        } ${isIPad ? '' : 'sm:hidden'}`}
      >
        {isLoading || isLoadingDirectory ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={`mobile-skeleton-${idx}`}
              className="rounded-2xl border border-[rgba(14,14,16,0.08)] bg-white p-4"
            >
              <div className="h-5 w-32 animate-pulse rounded bg-[#f6f6f7]" />
              <div className="mt-2 h-4 w-40 animate-pulse rounded bg-[#f6f6f7]" />
              <div className="mt-3 h-4 w-28 animate-pulse rounded bg-[#f6f6f7]" />
              <div className="mt-4 h-9 w-32 animate-pulse rounded-lg bg-[#f6f6f7]" />
            </div>
          ))
        ) : visibleRecordings.length === 0 ? (
          <div className="rounded-2xl border border-[rgba(14,14,16,0.08)] bg-white px-4 py-10 text-center text-sm text-[#8b8b90]">
            {studentDirectory.length === 0
              ? t('noStudentsInDirectory')
              : t('noStudentsForFilters')}
          </div>
        ) : (
          paginatedRecordings.map((row) => {
            const recording = row.recording;
            const recordingId = recording?.id ?? null;
            const isActive =
              recordingId !== null && activeRecordingId === recordingId;
            return (
              <article
                key={`mobile-${row.studentUserId}`}
                className="rounded-2xl border border-[rgba(14,14,16,0.08)] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(14,14,16,0.03)]"
              >
                <div className="min-w-0">
                  <p className="truncate text-[1.35rem] font-semibold leading-tight tracking-[-0.01em] text-[#1f2937]">
                    {row.groupName}
                  </p>
                  <p className="mt-1 truncate text-[1rem] text-[#3b3b40]">
                    {row.studentFullName}
                  </p>
                  <div className="mt-2 flex items-start gap-2 text-[#8b8b90]">
                    <svg
                      className="mt-[2px] h-4 w-4 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z"
                      />
                    </svg>
                    <div className="text-[1.05rem] leading-snug">
                      <p>{t('dateTime')}</p>
                      <p className="text-[#3b3b40]">
                        {recording ? formatDateTime(recording.createdAt) : '-'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  {!recording ? (
                    <span className="inline-flex items-center rounded-xl border border-amber-300 px-3 py-1.5 text-sm font-medium text-amber-700">
                      {t('noVoiceRecorded')}
                    </span>
                  ) : isActive ? (
                    <div className="w-full">
                      <VoiceMessagePlayer
                        fileUrl={recording.fileUrl}
                        duration={recording.duration}
                        fileName={recording.fileName}
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveRecordingId(recording.id)}
                      className="inline-flex items-center gap-2 rounded-lg border border-[#1010a3]/20 px-3 py-1.5 text-sm font-medium text-[#1010a3] transition-colors hover:bg-[#1010a3]/5"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {t('play')}
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Desktop table */}
      <div
        className={`hidden overflow-hidden rounded-xl border border-[rgba(14,14,16,0.07)] bg-white ${
          isIPad ? '' : 'sm:block'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#fafafa] border-b border-[rgba(14,14,16,0.07)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#8b8b90]">
                  {tCommon('group')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#8b8b90]">
                  {tCommon('searchTypeStudent')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#8b8b90]">
                  {t('dateTime')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#8b8b90]">
                  {t('recording')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(14,14,16,0.07)]">
              {isLoading || isLoadingDirectory ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`}>
                    <td className="px-4 py-4">
                      <div className="h-4 w-24 bg-[#f6f6f7] animate-pulse rounded" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-32 bg-[#f6f6f7] animate-pulse rounded" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-28 bg-[#f6f6f7] animate-pulse rounded" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-8 w-48 bg-[#f6f6f7] animate-pulse rounded" />
                    </td>
                  </tr>
                ))
              ) : visibleRecordings.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-sm text-[#8b8b90]"
                  >
                    {studentDirectory.length === 0
                      ? t('noStudentsInDirectory')
                      : t('noStudentsForFilters')}
                  </td>
                </tr>
              ) : (
                paginatedRecordings.map((row) => {
                  const recording = row.recording;
                  const recordingId = recording?.id ?? null;
                  const isActive =
                    recordingId !== null && activeRecordingId === recordingId;
                  return (
                    <tr
                      key={row.studentUserId}
                      className="hover:bg-[#fafafa]/60 transition-colors"
                    >
                      <td className="px-4 py-3 align-middle">
                        <span className="text-sm text-[#3b3b40]">
                          {row.groupName}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span className="text-sm font-medium text-[#3b3b40]">
                          {row.studentFullName}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle whitespace-nowrap">
                        {recording ? (
                          <>
                            <div className="text-sm text-[#3b3b40]">
                              {formatDateTime(recording.createdAt)}
                            </div>
                            <div className="text-xs text-[#8b8b90]">
                              {formatIsoDay(recording.createdAt)}
                            </div>
                          </>
                        ) : (
                          <span className="text-sm text-[#8b8b90]">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {!recording ? (
                          <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                            {t('noVoiceRecorded')}
                          </span>
                        ) : isActive ? (
                          <VoiceMessagePlayer
                            fileUrl={recording.fileUrl}
                            duration={recording.duration}
                            fileName={recording.fileName}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveRecordingId(recording.id)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#1010a3] border border-[#1010a3]/20 hover:bg-[#1010a3]/5 rounded-lg transition-colors"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {t('play')}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {visibleRecordings.length > 0 && (
        <div className={`mt-4 flex items-center text-sm text-[#8b8b90] ${isIPad ? 'justify-start gap-4' : 'justify-between lg:justify-start lg:gap-4'}`}>
          <span>
            Showing {rangeStart}-{rangeEnd} of {visibleRecordings.length}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                safePage === 0
                  ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
                  : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]'
              }`}
              disabled={safePage === 0}
              onClick={() => goToPage(Math.max(0, safePage - 1))}
              aria-label="Previous page"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-[#1010a3] px-3 text-sm font-semibold text-white">
              {safePage + 1}
            </span>
            <button
              type="button"
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                safePage >= totalPages - 1
                  ? 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]'
                  : 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]'
              }`}
              disabled={safePage >= totalPages - 1}
              onClick={() => goToPage(Math.min(totalPages - 1, safePage + 1))}
              aria-label="Next page"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}
