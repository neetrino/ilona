'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
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

function getStudentFullName(recording: AdminStudentRecording): string {
  return (
    `${recording.student.firstName} ${recording.student.lastName}`.trim() ||
    recording.student.userId
  );
}

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
  const t = useTranslations('nav');
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectedStudentUserIds, setSelectedStudentUserIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedRecordingIds, setSelectedRecordingIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [activeRecordingId, setActiveRecordingId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

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

  const apiFilters = useMemo(() => {
    const groupIds = Array.from(selectedGroupIds).sort();
    const studentIds = Array.from(selectedStudentUserIds).sort();
    return {
      ...(groupIds.length ? { groupIds } : {}),
      ...(studentIds.length ? { studentIds } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
    };
  }, [selectedGroupIds, selectedStudentUserIds, search]);

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
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

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
          groupName: student.group?.name ?? 'Ungrouped',
        }))
        .sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [allStudents],
  );

  const groupOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    allGroups.forEach((group) => {
      map.set(group.id, { id: group.id, name: group.name });
    });
    const hasUngrouped = studentDirectory.some((s) => s.groupId === null);
    if (hasUngrouped) map.set('ungrouped', { id: 'ungrouped', name: 'Ungrouped' });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allGroups, studentDirectory]);

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

  // Prune stale selections when directory loads
  const pruneSelections = useCallback(() => {
    setSelectedGroupIds((prev) => {
      const validIds = new Set(groupOptions.map((g) => g.id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (validIds.has(id)) next.add(id);
      });
      return next;
    });
    setSelectedStudentUserIds((prev) => {
      const valid = new Set(studentDirectory.map((s) => s.userId));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (valid.has(id)) next.add(id);
      });
      return next;
    });
  }, [groupOptions, studentDirectory]);

  useEffect(() => {
    if (!isHydrated || isLoadingDirectory) return;
    pruneSelections();
  }, [isHydrated, isLoadingDirectory, pruneSelections]);

  // Drop student selections that aren't in current group filter
  useEffect(() => {
    if (!isHydrated || isLoadingDirectory) return;
    setSelectedStudentUserIds((prev) => {
      const next = new Set<string>();
      prev.forEach((uid) => {
        if (allowedStudentUserIds.has(uid)) next.add(uid);
      });
      if (next.size === prev.size && [...prev].every((id) => next.has(id))) {
        return prev;
      }
      return next;
    });
  }, [isHydrated, isLoadingDirectory, allowedStudentUserIds]);

  const visibleRecordings = useMemo(() => {
    const query = search.trim().toLowerCase();
    const fromTs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toTs = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;

    return recordings
      .filter((r) => {
        const ts = new Date(r.createdAt).getTime();
        if (fromTs !== null && ts < fromTs) return false;
        if (toTs !== null && ts > toTs) return false;
        if (!query) return true;
        const haystack = [
          getStudentFullName(r),
          r.group.name,
          r.fileName ?? '',
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [recordings, search, dateFrom, dateTo]);

  // Reconcile selected ids with visible rows
  useEffect(() => {
    setSelectedRecordingIds((prev) => {
      if (prev.size === 0) return prev;
      const visibleIds = new Set(visibleRecordings.map((r) => r.id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (visibleIds.has(id)) next.add(id);
      });
      if (next.size === prev.size) return prev;
      return next;
    });
  }, [visibleRecordings]);

  const allVisibleSelected =
    visibleRecordings.length > 0 &&
    visibleRecordings.every((r) => selectedRecordingIds.has(r.id));

  const toggleAll = () => {
    if (allVisibleSelected) {
      setSelectedRecordingIds(new Set());
    } else {
      setSelectedRecordingIds(new Set(visibleRecordings.map((r) => r.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedRecordingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearAllFilters = () => {
    setSelectedGroupIds(new Set());
    setSelectedStudentUserIds(new Set());
    setSearch('');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <DashboardLayout
      title={t('recordings')}
      subtitle="All student voice recordings in a single searchable table"
    >
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <div className="md:col-span-2">
          <MultiSelectChipsDropdown
            label="Group"
            options={groupMultiOptions}
            selectedIds={selectedGroupIds}
            onSelectionChange={setSelectedGroupIds}
            placeholder="All groups"
            searchPlaceholder="Search groups…"
            emptyOptionsHint="No groups"
            noResultsHint="No groups match"
            isLoading={isLoadingDirectory}
          />
        </div>

        <div className="md:col-span-2">
          <MultiSelectChipsDropdown
            label="Student"
            options={studentMultiOptions}
            selectedIds={selectedStudentUserIds}
            onSelectionChange={setSelectedStudentUserIds}
            placeholder={
              selectedGroupIds.size === 0
                ? 'All students'
                : 'Students in selected groups'
            }
            searchPlaceholder="Search students…"
            emptyOptionsHint={
              selectedGroupIds.size === 0
                ? 'No students'
                : 'No students in selected groups'
            }
            noResultsHint="No students match"
            isLoading={isLoadingDirectory}
            maxChipsHeightClassName="max-h-28"
          />
        </div>

        <div>
          <label
            htmlFor="rec-date-from"
            className="block text-sm font-medium text-slate-600 mb-1.5"
          >
            From
          </label>
          <input
            id="rec-date-from"
            type="date"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div>
          <label
            htmlFor="rec-date-to"
            className="block text-sm font-medium text-slate-600 mb-1.5"
          >
            To
          </label>
          <input
            id="rec-date-to"
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
        <div className="flex-1">
          <label
            htmlFor="rec-search"
            className="block text-sm font-medium text-slate-600 mb-1.5"
          >
            Search
          </label>
          <input
            id="rec-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Student, group, or file name…"
            className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <button
          type="button"
          onClick={clearAllFilters}
          className="h-11 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg border border-slate-200 transition-colors"
        >
          Clear all
        </button>
      </div>

      <div className="mb-3 text-sm text-slate-500">
        {visibleRecordings.length} recording
        {visibleRecordings.length !== 1 ? 's' : ''} found
        {selectedRecordingIds.size > 0 && (
          <span className="ml-3 text-slate-700 font-medium">
            ({selectedRecordingIds.size} selected)
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    aria-label="Select all visible recordings"
                    className="w-4 h-4 rounded border-slate-300 cursor-pointer"
                    checked={allVisibleSelected}
                    onChange={toggleAll}
                    disabled={visibleRecordings.length === 0}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Group
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Date &amp; Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Recording
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading || isLoadingDirectory ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`}>
                    <td className="px-4 py-4">
                      <div className="h-4 w-4 bg-slate-100 animate-pulse rounded" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-24 bg-slate-100 animate-pulse rounded" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-32 bg-slate-100 animate-pulse rounded" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-28 bg-slate-100 animate-pulse rounded" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-8 w-48 bg-slate-100 animate-pulse rounded" />
                    </td>
                  </tr>
                ))
              ) : visibleRecordings.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    No recordings found for the selected filters.
                  </td>
                </tr>
              ) : (
                visibleRecordings.map((recording) => {
                  const isActive = activeRecordingId === recording.id;
                  return (
                    <tr
                      key={recording.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-4 py-3 align-middle">
                        <input
                          type="checkbox"
                          aria-label={`Select recording ${recording.id}`}
                          className="w-4 h-4 rounded border-slate-300 cursor-pointer"
                          checked={selectedRecordingIds.has(recording.id)}
                          onChange={() => toggleOne(recording.id)}
                        />
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span className="text-sm text-slate-700">
                          {recording.group.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span className="text-sm font-medium text-slate-800">
                          {getStudentFullName(recording)}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle whitespace-nowrap">
                        <div className="text-sm text-slate-700">
                          {formatDateTime(recording.createdAt)}
                        </div>
                        <div className="text-xs text-slate-400">
                          {formatIsoDay(recording.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {isActive ? (
                          <VoiceMessagePlayer
                            fileUrl={recording.fileUrl}
                            duration={recording.duration}
                            fileName={recording.fileName}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveRecordingId(recording.id)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary border border-primary/20 hover:bg-primary/5 rounded-lg transition-colors"
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
                            Play
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
    </DashboardLayout>
  );
}
