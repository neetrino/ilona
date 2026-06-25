/**
 * Weekly teacher rotation for groups with two assigned teachers.
 *
 * Anchor: ISO week (Mon–Sun) that contains the schedule start date (`dateFrom`).
 * - That week → Teacher 1 (`teacherId`)
 * - Next ISO week → Teacher 2 (`secondTeacherId`)
 * - Then alternates every ISO week
 */

function parseYmd(ymd: string): Date {
  const d = new Date(`${ymd}T00:00:00`);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Monday 00:00 local for the ISO week containing `date`. */
export function startOfIsoWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

/** 0-based ISO week index since the schedule start week. */
export function weekIndexSinceScheduleStart(lessonDate: Date, scheduleStartDateYmd: string): number {
  const anchor = startOfIsoWeek(parseYmd(scheduleStartDateYmd));
  const lessonWeek = startOfIsoWeek(lessonDate);
  const diffMs = lessonWeek.getTime() - anchor.getTime();
  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
}

export function resolveRotatingTeacherId(params: {
  lessonDate: Date;
  teacherId: string;
  secondTeacherId: string;
  scheduleStartDateYmd: string;
}): string {
  const weekIndex = weekIndexSinceScheduleStart(params.lessonDate, params.scheduleStartDateYmd);
  return weekIndex % 2 === 0 ? params.teacherId : params.secondTeacherId;
}

/** @deprecated Use weekIndexSinceScheduleStart */
export function weekIndexSinceAnchor(lessonDate: Date, anchorDateYmd: string): number {
  return weekIndexSinceScheduleStart(lessonDate, anchorDateYmd);
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
