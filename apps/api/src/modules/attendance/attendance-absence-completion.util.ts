/**
 * True when every student in the lesson group has a saved attendance record.
 * Empty groups are never considered complete.
 */
export function isLessonAbsenceChecklistComplete(
  groupStudentIds: readonly string[],
  attendanceStudentIds: readonly string[],
): boolean {
  if (groupStudentIds.length === 0) {
    return false;
  }

  const markedStudentIds = new Set(attendanceStudentIds);
  return groupStudentIds.every((studentId) => markedStudentIds.has(studentId));
}
