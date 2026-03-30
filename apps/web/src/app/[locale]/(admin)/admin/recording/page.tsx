'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { VoiceMessagePlayer } from '@/features/chat/components/VoiceMessagePlayer';
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
console.log("test")

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
const GROUP_STORAGE_KEY = 'admin-recordings:selected-group';
const STUDENT_STORAGE_KEY = 'admin-recordings:selected-student';
const NO_GROUP_SELECTED = '';
const NO_STUDENT_SELECTED = '';
const ALL_STUDENTS_VALUE = 'all';

function isFullStudent(item: TeacherAssignedItem): item is Student {
  return 'user' in item;
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

export default function AdminRecordingPage() {
  const t = useTranslations('nav');
  const [selectedGroupId, setSelectedGroupId] = useState<string>(NO_GROUP_SELECTED);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(NO_STUDENT_SELECTED);
  const [studentSearch, setStudentSearch] = useState('');
  const [isSelectionHydrated, setIsSelectionHydrated] = useState(false);

  const apiFilters = useMemo(() => ({
    groupId: selectedGroupId || undefined,
    studentUserId:
      selectedGroupId && selectedStudentId && selectedStudentId !== ALL_STUDENTS_VALUE
        ? selectedStudentId
        : undefined,
  }), [selectedGroupId, selectedStudentId]);

  const { data: recordings = [], isLoading } = useQuery({
    queryKey: [...chatKeys.all, 'admin', 'student-recordings', apiFilters],
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

  const studentOptions = useMemo(() => {
    if (!selectedGroupId) return [];

    const byGroup = studentDirectory.filter((student) => {
        if (selectedGroupId === 'ungrouped') return student.groupId === null;
        return student.groupId === selectedGroupId;
      });

    return byGroup.map((student) => ({
      userId: student.userId,
      name: student.fullName,
    }));
  }, [studentDirectory, selectedGroupId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedGroup = localStorage.getItem(GROUP_STORAGE_KEY);
    const storedStudent = localStorage.getItem(STUDENT_STORAGE_KEY);

    if (storedGroup) {
      setSelectedGroupId(storedGroup);
      setSelectedStudentId(storedStudent || ALL_STUDENTS_VALUE);
    } else {
      setSelectedGroupId(NO_GROUP_SELECTED);
      setSelectedStudentId(NO_STUDENT_SELECTED);
    }
    setIsSelectionHydrated(true);
  }, []);

  useEffect(() => {
    if (!isSelectionHydrated || isLoadingDirectory) return;

    if (selectedGroupId && !groupOptions.some((group) => group.id === selectedGroupId)) {
      setSelectedGroupId(NO_GROUP_SELECTED);
      setSelectedStudentId(NO_STUDENT_SELECTED);
      return;
    }

    if (!selectedGroupId) {
      if (selectedStudentId !== NO_STUDENT_SELECTED) {
        setSelectedStudentId(NO_STUDENT_SELECTED);
      }
      return;
    }

    if (selectedStudentId === NO_STUDENT_SELECTED) {
      setSelectedStudentId(ALL_STUDENTS_VALUE);
      return;
    }

    if (selectedStudentId !== ALL_STUDENTS_VALUE) {
      const stillAvailable = studentOptions.some((student) => student.userId === selectedStudentId);
      if (!stillAvailable) {
        setSelectedStudentId(ALL_STUDENTS_VALUE);
      }
    }
  }, [isSelectionHydrated, isLoadingDirectory, selectedGroupId, selectedStudentId, groupOptions, studentOptions]);

  useEffect(() => {
    if (!isSelectionHydrated || typeof window === 'undefined') return;

    if (!selectedGroupId) {
      localStorage.removeItem(GROUP_STORAGE_KEY);
      localStorage.removeItem(STUDENT_STORAGE_KEY);
      return;
    }

    localStorage.setItem(GROUP_STORAGE_KEY, selectedGroupId);
    if (selectedStudentId && selectedStudentId !== NO_STUDENT_SELECTED) {
      localStorage.setItem(STUDENT_STORAGE_KEY, selectedStudentId);
    } else {
      localStorage.removeItem(STUDENT_STORAGE_KEY);
    }
  }, [isSelectionHydrated, selectedGroupId, selectedStudentId]);

  useEffect(() => {
    if (!selectedGroupId || selectedStudentId === ALL_STUDENTS_VALUE) return;
    const stillAvailable = studentOptions.some((student) => student.userId === selectedStudentId);
    if (!stillAvailable) {
      setSelectedStudentId(ALL_STUDENTS_VALUE);
    }
  }, [selectedGroupId, selectedStudentId, studentOptions]);

  const visibleRecordings = useMemo(() => {
    const byStudent = !selectedGroupId || selectedStudentId === ALL_STUDENTS_VALUE
      ? recordings
      : recordings.filter((recording) => recording.student.userId === selectedStudentId);

    const query = studentSearch.trim().toLowerCase();
    if (!query) return byStudent;

    return byStudent.filter((recording) => getStudentFullName(recording).toLowerCase().includes(query));
  }, [recordings, selectedGroupId, selectedStudentId, studentSearch]);

  const recordingsByStudent = useMemo(() => {
    const map = new Map<string, AdminStudentRecording[]>();
    visibleRecordings.forEach((recording) => {
      const current = map.get(recording.student.userId) ?? [];
      current.push(recording);
      map.set(recording.student.userId, current);
    });
    return map;
  }, [visibleRecordings]);

  const visibleGroupSections = useMemo(() => {
    const groups = !selectedGroupId
      ? groupOptions
      : groupOptions.filter((group) => group.id === selectedGroupId);

    const searchQuery = studentSearch.trim().toLowerCase();

    return groups.map((group) => {
      const students = studentDirectory
        .filter((student) => {
          const belongsToGroup = group.id === 'ungrouped'
            ? student.groupId === null
            : student.groupId === group.id;
          if (!belongsToGroup) return false;
          if (
            selectedGroupId &&
            selectedStudentId &&
            selectedStudentId !== ALL_STUDENTS_VALUE &&
            student.userId !== selectedStudentId
          ) return false;
          if (searchQuery && !student.fullName.toLowerCase().includes(searchQuery)) return false;
          return true;
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
  }, [groupOptions, studentDirectory, selectedGroupId, selectedStudentId, studentSearch, recordingsByStudent]);

  const resetFilters = () => {
    setSelectedGroupId(NO_GROUP_SELECTED);
    setSelectedStudentId(NO_STUDENT_SELECTED);
    setStudentSearch('');
  };

  return (
    <DashboardLayout
      title={t('recordings')}
      subtitle="All student voice recordings in one place, grouped by class"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Group/Class</label>
          <select
            value={selectedGroupId}
            onChange={(event) => {
              const nextGroupId = event.target.value;
              setSelectedGroupId(nextGroupId);
              setSelectedStudentId(nextGroupId ? ALL_STUDENTS_VALUE : NO_STUDENT_SELECTED);
            }}
            className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">All groups</option>
            {groupOptions.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Student</label>
          <select
            value={selectedStudentId}
            onChange={(event) => setSelectedStudentId(event.target.value)}
            disabled={!selectedGroupId}
            className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            {!selectedGroupId ? (
              <option value="">Select group first</option>
            ) : (
              <option value={ALL_STUDENTS_VALUE}>All students</option>
            )}
            {studentOptions.map((student) => (
              <option key={student.userId} value={student.userId}>
                {student.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Search student</label>
          <input
            value={studentSearch}
            onChange={(event) => setStudentSearch(event.target.value)}
            placeholder="Type student name..."
            className="w-full h-11 px-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={resetFilters}
            className="h-11 w-full md:w-auto px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg border border-slate-200 transition-colors"
          >
            Reset filters
          </button>
        </div>
      </div>

      <div className="mb-6 text-sm text-slate-500">
        {visibleRecordings.length} recording{visibleRecordings.length !== 1 ? 's' : ''} found across {visibleGroupSections.length} group{visibleGroupSections.length !== 1 ? 's' : ''}
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
                          {student.recordings.length} recording{student.recordings.length !== 1 ? 's' : ''}
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
                                <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Submitted</p>
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
