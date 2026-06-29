import { fetchGroups } from '@/features/groups/api/groups.api';
import { fetchStudents } from '@/features/students/api/students.api';
import type { AdminStudentRecording } from '@/features/chat/api/chat.api';
import type { Group } from '@/features/groups/types';
import type { Student, TeacherAssignedItem } from '@/features/students/types';
import {
  DIRECTORY_PAGE_SIZE,
  FILTERS_STORAGE_KEY,
  LEGACY_FILTERS_KEY,
  LEGACY_GROUP_KEY,
  LEGACY_STUDENT_KEY,
} from './admin-recordings.constants';

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatIsoDay(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

export function isFullStudent(item: TeacherAssignedItem): item is Student {
  return 'user' in item;
}

export function directoryStudentGroupKey(groupId: string | null): string {
  return groupId === null ? 'ungrouped' : groupId;
}

export async function fetchAllGroups(): Promise<Group[]> {
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

export async function fetchAllStudentsDirectory(): Promise<Student[]> {
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

export interface StoredFilters {
  groupIds: Set<string>;
  studentUserIds: Set<string>;
  search: string;
  dateFrom: string;
  dateTo: string;
}

export interface StudentRecordingRow {
  studentUserId: string;
  studentFullName: string;
  groupId: string | null;
  groupName: string;
  recording: AdminStudentRecording | null;
}

export function parseStoredFilters(): StoredFilters {
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
