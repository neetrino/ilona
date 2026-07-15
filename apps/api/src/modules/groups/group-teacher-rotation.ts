/**
 * Lesson-by-lesson teacher rotation for groups with two assigned teachers.
 *
 * Occurrences are ordered chronologically (0, 1, 2, …):
 * - Even index → Teacher 1 (`teacherId`) unless `secondTeacherStartsFirstWeek`
 * - Odd index → Teacher 2 (`secondTeacherId`)
 * - Then alternates every lesson
 *
 * Note: `secondTeacherStartsFirstWeek` is the persisted field name; it means
 * Teacher 2 takes the first lesson (index 0). By default Teacher 1 starts.
 */

export function resolveRotatingTeacherId(params: {
  lessonIndex: number;
  teacherId: string;
  secondTeacherId: string;
  /** When true, Teacher 2 teaches lesson index 0. */
  secondTeacherStartsFirstWeek?: boolean;
}): string {
  const teacher1Lesson = params.lessonIndex % 2 === 0;
  const useTeacher1 = params.secondTeacherStartsFirstWeek
    ? !teacher1Lesson
    : teacher1Lesson;
  return useTeacher1 ? params.teacherId : params.secondTeacherId;
}

export function groupTeacherIds(group: {
  teacherId: string | null;
  secondTeacherId: string | null;
}): string[] {
  const ids: string[] = [];
  if (group.teacherId) ids.push(group.teacherId);
  if (group.secondTeacherId && group.secondTeacherId !== group.teacherId) {
    ids.push(group.secondTeacherId);
  }
  return ids;
}

export function isGroupTeacher(
  teacherId: string,
  group: { teacherId: string | null; secondTeacherId: string | null },
): boolean {
  return group.teacherId === teacherId || group.secondTeacherId === teacherId;
}
