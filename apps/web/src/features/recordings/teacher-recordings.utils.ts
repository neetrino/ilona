import type { AdminStudentRecording } from '@/features/chat/api/chat.api';
import { fetchMyAssignedStudents } from '@/features/students/api/students.api';
import {
  isOnboardingItem,
  type Student,
  type TeacherAssignedItem,
} from '@/features/students/types';
import { DIRECTORY_PAGE_SIZE } from './admin-recordings.constants';

export { formatDateTime, formatIsoDay } from './admin-recordings.utils';

export function getStudentFullName(recording: AdminStudentRecording): string {
  return (
    `${recording.student.firstName} ${recording.student.lastName}`.trim() ||
    recording.student.userId
  );
}

function isFullStudent(item: TeacherAssignedItem): item is Student {
  return !isOnboardingItem(item);
}

export async function fetchAllAssignedStudentsDirectory(): Promise<Student[]> {
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
