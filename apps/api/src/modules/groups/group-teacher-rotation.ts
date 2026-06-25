/**
 * Weekly teacher rotation for groups with two assigned teachers.
 * Week 0 (anchor week) → teacherId; week 1 → secondTeacherId; alternates thereafter.
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

export function weekIndexSinceAnchor(lessonDate: Date, anchorDateYmd: string): number {
  const anchor = startOfIsoWeek(parseYmd(anchorDateYmd));
  const lessonWeek = startOfIsoWeek(lessonDate);
  const diffMs = lessonWeek.getTime() - anchor.getTime();
  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
}

export function resolveRotatingTeacherId(params: {
  lessonDate: Date;
  teacherId: string;
  secondTeacherId: string;
  rotationAnchorDateYmd: string;
}): string {
  const weekIndex = weekIndexSinceAnchor(params.lessonDate, params.rotationAnchorDateYmd);
  return weekIndex % 2 === 0 ? params.teacherId : params.secondTeacherId;
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
