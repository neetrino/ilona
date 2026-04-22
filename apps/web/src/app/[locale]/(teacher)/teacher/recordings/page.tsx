'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { VoiceMessagePlayer } from '@/features/chat/components/VoiceMessagePlayer';
import { MultiSelectChipsDropdown } from '@/shared/components/ui/multi-select-chips-dropdown';
import {
  fetchTeacherStudentRecordings,
  type AdminStudentRecording,
} from '@/features/chat/api/chat.api';
import { chatKeys } from '@/features/chat/hooks/useChat';
import { fetchMyAssignedStudents } from '@/features/students/api/students.api';
import { useMyGroups } from '@/features/groups/hooks/useGroups';
import {
  isOnboardingItem,
  type Student,
  type TeacherAssignedItem,
} from '@/features/students/types';

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
const FILTERS_STORAGE_KEY = 'teacher-recordings:filters-v1';

function isFullStudent(item: TeacherAssignedItem): item is Student {
  return !isOnboardingItem(item);
}

async function fetchAllAssignedStudentsDirectory(): Promise<Student[]> {
  const students: Student[] = [];
  let skip = 0;

  for (;;) {
    const page = await fetchMyAssignedStudents({ skip, take: DIRECTORY_PAGE_SIZE });
    const fullStudents = page.items.filter(isFullStudent);
    students.push(...fullStudents);
    skip += page.items.length;
    if (skip >= page.total || page.items.length === 0) break;
  }

  return students;
}

export default function TeacherRecordingsPage() {
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
          groupName: student.group?.name ?? 'Ungrouped',
        }))
        .sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [allStudents],
  );

  const groupOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();

    myGroups.forEach((group) => {
      map.set(group.id, { id: group.id, name: group.name });
    });

    const hasUngrouped = studentDirectory.some((student) => student.groupId === null);
    if (hasUngrouped) {
      map.set('ungrouped', { id: 'ungrouped', name: 'Ungrouped' });
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [myGroups, studentDirectory]);

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

  return (
    <DashboardLayout
      title={t('recordings')}
      subtitle="All student voice recordings in a single searchable table"
    >
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <div className="md:col-span-2">
          <MultiSelectChipsDropdown
            label="Group"
            options={groupMultiOptions}
            selectedIds={selectedGroupIds}
            onSelectionChange={setSelectedGroupIds}
            placeholder="All groups"
            searchPlaceholder="Search groups..."
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
            placeholder="All students"
            searchPlaceholder="Search students..."
            emptyOptionsHint="No students"
            noResultsHint="No students match"
            isLoading={isLoadingDirectory}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">
            From
          </label>
          <input
            type="date"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(event) => setDateFrom(event.target.value)}
            className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">
            To
          </label>
          <input
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(event) => setDateTo(event.target.value)}
            className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-600 mb-1.5">
            Search
          </label>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Student, group, or file name..."
            className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <button
          type="button"
          onClick={resetFilters}
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
                    <td className="px-4 py-4"><div className="h-4 w-4 bg-slate-100 animate-pulse rounded" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-24 bg-slate-100 animate-pulse rounded" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-32 bg-slate-100 animate-pulse rounded" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-28 bg-slate-100 animate-pulse rounded" /></td>
                    <td className="px-4 py-4"><div className="h-8 w-48 bg-slate-100 animate-pulse rounded" /></td>
                  </tr>
                ))
              ) : visibleRecordings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                    No recordings found for the selected filters.
                  </td>
                </tr>
              ) : (
                visibleRecordings.map((recording) => {
                  const isActive = activeRecordingId === recording.id;
                  return (
                    <tr key={recording.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 align-middle">
                        <input
                          type="checkbox"
                          aria-label={`Select recording ${recording.id}`}
                          className="w-4 h-4 rounded border-slate-300 cursor-pointer"
                          checked={selectedRecordingIds.has(recording.id)}
                          onChange={() => toggleOne(recording.id)}
                        />
                      </td>
                      <td className="px-4 py-3 align-middle text-sm text-slate-700">
                        {recording.group.name}
                      </td>
                      <td className="px-4 py-3 align-middle text-sm font-medium text-slate-800">
                        {getStudentFullName(recording)}
                      </td>
                      <td className="px-4 py-3 align-middle whitespace-nowrap">
                        <div className="text-sm text-slate-700">{formatDateTime(recording.createdAt)}</div>
                        <div className="text-xs text-slate-400">{formatIsoDay(recording.createdAt)}</div>
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
