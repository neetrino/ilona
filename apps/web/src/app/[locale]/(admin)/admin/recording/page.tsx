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
  return `${recording.student.firstName} ${recording.student.lastName}`.trim() || recording.student.userId;
}

function formatSubmittedAt(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const DIRECTORY_PAGE_SIZE = 100;
const FILTERS_STORAGE_KEY = 'admin-recordings:filters-v2';
const LEGACY_GROUP_KEY = 'admin-recordings:selected-group';
const LEGACY_STUDENT_KEY = 'admin-recordings:selected-student';
const LEGACY_ALL_STUDENTS = 'all';

function isFullStudent(item: TeacherAssignedItem): item is Student {
  return 'user' in item;
}

/** Matches group multi-select ids (`ungrouped` for students without a group). */
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

function parseStoredFilters(): { groupIds: Set<string>; studentUserIds: Set<string> } {
  if (typeof window === 'undefined') {
    return { groupIds: new Set(), studentUserIds: new Set() };
  }

  try {
    const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { groupIds?: string[]; studentIds?: string[] };
      return {
        groupIds: new Set(Array.isArray(parsed.groupIds) ? parsed.groupIds : []),
        studentUserIds: new Set(Array.isArray(parsed.studentIds) ? parsed.studentIds : []),
      };
    }
  } catch {
    /* fall through to legacy */
  }

  const legacyGroup = localStorage.getItem(LEGACY_GROUP_KEY);
  const legacyStudent = localStorage.getItem(LEGACY_STUDENT_KEY);
  if (legacyGroup) {
    const groupIds = new Set([legacyGroup]);
    const studentUserIds = new Set<string>();
    if (
      legacyStudent &&
      legacyStudent !== LEGACY_ALL_STUDENTS &&
      legacyStudent !== ''
    ) {
      studentUserIds.add(legacyStudent);
    }
    return { groupIds, studentUserIds };
  }

  return { groupIds: new Set(), studentUserIds: new Set() };
}

export default function AdminRecordingPage() {
  const t = useTranslations('nav');
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(() => new Set());
  const [selectedStudentUserIds, setSelectedStudentUserIds] = useState<Set<string>>(() => new Set());
  const [studentSearch, setStudentSearch] = useState('');
  const [isSelectionHydrated, setIsSelectionHydrated] = useState(false);

  const apiFilters = useMemo(() => {
    const groupIds = Array.from(selectedGroupIds).sort();
    const studentIds = Array.from(selectedStudentUserIds).sort();
    return {
      ...(groupIds.length ? { groupIds } : {}),
      ...(studentIds.length ? { studentIds } : {}),
    };
  }, [selectedGroupIds, selectedStudentUserIds]);

  const apiFiltersKey = useMemo(
    () => JSON.stringify({ groupIds: apiFilters.groupIds ?? [], studentIds: apiFilters.studentIds ?? [] }),
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

  const studentDirectory = useMemo(() => {
    return allStudents
      .map((student) => ({
        studentId: student.id,
        userId: student.userId,
        fullName: `${student.user.firstName} ${student.user.lastName}`.trim() || student.userId,
        groupId: student.group?.id ?? null,
        groupName: student.group?.name ?? 'Ungrouped',
      }))
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [allStudents]);

  const groupOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();

    allGroups.forEach((group) => {
      map.set(group.id, { id: group.id, name: group.name });
    });

    const hasUngrouped = studentDirectory.some((student) => student.groupId === null);
    if (hasUngrouped) {
      map.set('ungrouped', { id: 'ungrouped', name: 'Ungrouped' });
    }

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allGroups, studentDirectory]);

  const groupMultiOptions = useMemo(
    () => groupOptions.map((g) => ({ id: g.id, label: g.name })),
    [groupOptions],
  );

  /** User ids allowed in the Student dropdown: all students, or only those in selected group(s). */
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const { groupIds, studentUserIds } = parseStoredFilters();
    setSelectedGroupIds(groupIds);
    setSelectedStudentUserIds(studentUserIds);
    setIsSelectionHydrated(true);
  }, []);

  const pruneSelections = useCallback(() => {
    setSelectedGroupIds((prev) => {
      const next = new Set<string>();
      const validIds = new Set(groupOptions.map((g) => g.id));
      prev.forEach((id) => {
        if (validIds.has(id)) next.add(id);
      });
      return next;
    });
    setSelectedStudentUserIds((prev) => {
      const next = new Set<string>();
      const valid = new Set(studentDirectory.map((s) => s.userId));
      prev.forEach((id) => {
        if (valid.has(id)) next.add(id);
      });
      return next;
    });
  }, [groupOptions, studentDirectory]);

  useEffect(() => {
    if (!isSelectionHydrated || isLoadingDirectory) return;
    pruneSelections();
  }, [isSelectionHydrated, isLoadingDirectory, pruneSelections]);

  /** Drop student selections that are not in the current group-filtered roster (updates when groups change). */
  useEffect(() => {
    if (!isSelectionHydrated || isLoadingDirectory) return;
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
  }, [isSelectionHydrated, isLoadingDirectory, allowedStudentUserIds]);

  useEffect(() => {
    if (!isSelectionHydrated || typeof window === 'undefined') return;

    if (selectedGroupIds.size === 0 && selectedStudentUserIds.size === 0) {
      localStorage.removeItem(FILTERS_STORAGE_KEY);
      localStorage.removeItem(LEGACY_GROUP_KEY);
      localStorage.removeItem(LEGACY_STUDENT_KEY);
      return;
    }

    localStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify({
        groupIds: Array.from(selectedGroupIds).sort(),
        studentIds: Array.from(selectedStudentUserIds).sort(),
      }),
    );
    localStorage.removeItem(LEGACY_GROUP_KEY);
    localStorage.removeItem(LEGACY_STUDENT_KEY);
  }, [isSelectionHydrated, selectedGroupIds, selectedStudentUserIds]);

  const visibleRecordings = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    if (!query) return recordings;

    return recordings.filter((recording) =>
      getStudentFullName(recording).toLowerCase().includes(query),
    );
  }, [recordings, studentSearch]);

  const recordingsByStudent = useMemo(() => {
    const map = new Map<string, AdminStudentRecording[]>();
    visibleRecordings.forEach((recording) => {
      const current = map.get(recording.student.userId) ?? [];
      current.push(recording);
      map.set(recording.student.userId, current);
    });
    return map;
  }, [visibleRecordings]);

  const groupsForSections = useMemo(() => {
    const wanted = new Set<string>();
    selectedGroupIds.forEach((id) => wanted.add(id));
    if (selectedStudentUserIds.size > 0) {
      studentDirectory
        .filter((s) => selectedStudentUserIds.has(s.userId))
        .forEach((s) => wanted.add(directoryStudentGroupKey(s.groupId)));
    }
    if (wanted.size === 0) {
      return groupOptions;
    }
    return groupOptions.filter((g) => wanted.has(g.id));
  }, [groupOptions, studentDirectory, selectedGroupIds, selectedStudentUserIds]);

  const visibleGroupSections = useMemo(() => {
    const searchQuery = studentSearch.trim().toLowerCase();
    const groupFilterActive = selectedGroupIds.size > 0;
    const studentFilterActive = selectedStudentUserIds.size > 0;

    return groupsForSections.map((group) => {
      const students = studentDirectory
        .filter((student) => {
          const belongsToGroup =
            group.id === 'ungrouped' ? student.groupId === null : student.groupId === group.id;
          if (!belongsToGroup) return false;
          if (searchQuery && !student.fullName.toLowerCase().includes(searchQuery)) return false;

          const studentGroupKey = directoryStudentGroupKey(student.groupId);

          if (!groupFilterActive && !studentFilterActive) {
            return true;
          }
          if (groupFilterActive && studentFilterActive) {
            return (
              selectedGroupIds.has(studentGroupKey) || selectedStudentUserIds.has(student.userId)
            );
          }
          if (groupFilterActive) {
            return selectedGroupIds.has(studentGroupKey);
          }
          return selectedStudentUserIds.has(student.userId);
        })
        .sort((a, b) => a.fullName.localeCompare(b.fullName))
        .map((student) => ({
          ...student,
          recordings: (recordingsByStudent.get(student.userId) ?? [])
            .slice()
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        }));

      return {
        id: group.id,
        name: group.name,
        students,
      };
    });
  }, [
    groupsForSections,
    studentDirectory,
    selectedGroupIds,
    selectedStudentUserIds,
    studentSearch,
    recordingsByStudent,
  ]);

  const clearAllFilters = () => {
    setSelectedGroupIds(new Set());
    setSelectedStudentUserIds(new Set());
    setStudentSearch('');
  };

  return (
    <DashboardLayout
      title={t('recordings')}
      subtitle="All student voice recordings in one place, grouped by class"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="md:col-span-1">
          <MultiSelectChipsDropdown
            label="Group/Class"
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

        <div className="md:col-span-1">
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
              selectedGroupIds.size === 0 ? 'No students' : 'No students in selected groups'
            }
            noResultsHint="No students match"
            isLoading={isLoadingDirectory}
            maxChipsHeightClassName="max-h-28"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Search student</label>
          <input
            value={studentSearch}
            onChange={(event) => setStudentSearch(event.target.value)}
            placeholder="Filter list by name…"
            className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={clearAllFilters}
            className="h-11 w-full md:w-auto px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg border border-slate-200 transition-colors"
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="mb-6 text-sm text-slate-500">
        {visibleRecordings.length} recording{visibleRecordings.length !== 1 ? 's' : ''} found across{' '}
        {visibleGroupSections.length} group{visibleGroupSections.length !== 1 ? 's' : ''}
      </div>

      {isLoading || isLoadingDirectory ? (
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-24 bg-white border border-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : visibleGroupSections.length === 0 ? (
        <div className="py-10 text-center border border-slate-200 rounded-xl bg-white text-slate-500">
          No groups found for selected filters.
        </div>
      ) : (
        <div className="space-y-6">
          {visibleGroupSections.map((group) => (
            <section key={group.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-800">{group.name}</h3>
                <span className="text-xs font-medium text-slate-500">
                  {group.students.length} student{group.students.length !== 1 ? 's' : ''}
                </span>
              </div>

              {group.students.length === 0 ? (
                <div className="px-4 py-5 text-sm text-slate-500">No students in this group.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {group.students.map((student) => (
                    <div key={student.userId} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-slate-800">{student.fullName}</p>
                        <span className="text-xs text-slate-500">
                          {student.recordings.length} recording
                          {student.recordings.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {student.recordings.length === 0 ? (
                        <div className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-lg px-3 py-2">
                          No recordings yet.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {student.recordings.map((recording) => (
                            <div
                              key={recording.id}
                              className="grid grid-cols-1 lg:grid-cols-[220px_200px_1fr] gap-3 items-center rounded-lg border border-slate-100 p-3"
                            >
                              <div>
                                <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                                  Submitted
                                </p>
                                <p className="text-sm text-slate-700">{formatSubmittedAt(recording.createdAt)}</p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Group</p>
                                <p className="text-sm text-slate-700">{group.name}</p>
                              </div>
                              <div>
                                <VoiceMessagePlayer
                                  fileUrl={recording.fileUrl}
                                  duration={recording.duration}
                                  fileName={recording.fileName}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
