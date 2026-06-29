import { normalizeGroupSchedulePayload } from '@/features/groups/group-schedule-utils';
import type { Group, GroupScheduleEntry } from '@/features/groups/types';
import type { CenterDetails, CenterDetailTeacher } from '../../types';

export function userName(u: { firstName: string | null; lastName: string | null } | null): string {
  if (!u) return '—';
  return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || '—';
}

export function teacherName(t: CenterDetailTeacher | null): string {
  return userName(t?.user ?? null);
}

export function normalizeSchedule(rawSchedule: unknown): GroupScheduleEntry[] {
  let raw = rawSchedule;
  if (typeof rawSchedule === 'string') {
    try {
      raw = JSON.parse(rawSchedule) as unknown;
    } catch {
      return [];
    }
  }
  const entries = normalizeGroupSchedulePayload(raw).weeklySlots;
  if (entries.length === 0) return [];

  return entries
    .map((entry) => {
      if (entry.dayOfWeek >= 1 && entry.dayOfWeek <= 7) {
        return { ...entry, dayOfWeek: entry.dayOfWeek % 7 };
      }
      return entry;
    })
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))
    .filter(
      (entry, index, arr) =>
        index === 0 ||
        entry.dayOfWeek !== arr[index - 1]?.dayOfWeek ||
        entry.startTime !== arr[index - 1]?.startTime ||
        entry.endTime !== arr[index - 1]?.endTime,
    );
}

function mapTeacherToGroupTeacher(teacher: CenterDetailTeacher | null): Group['teacher'] {
  if (!teacher?.user?.id || !teacher.user.firstName || !teacher.user.lastName || !teacher.user.email) {
    return null;
  }

  return {
    id: teacher.id,
    user: {
      id: teacher.user.id,
      firstName: teacher.user.firstName,
      lastName: teacher.user.lastName,
      email: teacher.user.email,
      avatarUrl: teacher.user.avatarUrl ?? undefined,
    },
  };
}

export function mapCenterGroupToScheduleGroup(
  data: CenterDetails,
  group: CenterDetails['groups'][number],
): Group {
  return {
    id: group.id,
    name: group.name,
    maxStudents: group._count?.students ?? group.students.length,
    isActive: true,
    centerId: data.center.id,
    schedule: normalizeSchedule(group.schedule),
    center: { id: data.center.id, name: data.center.name },
    teacher: mapTeacherToGroupTeacher(group.teacher),
    secondTeacher: mapTeacherToGroupTeacher(group.secondTeacher),
    _count: { students: group._count?.students ?? group.students.length, lessons: group._count?.lessons ?? 0 },
    students: group.students.map((s) => ({
      id: s.id,
      user: {
        firstName: s.user?.firstName ?? '—',
        lastName: s.user?.lastName ?? '',
      },
    })),
    createdAt: data.center.createdAt,
    updatedAt: data.center.updatedAt,
  };
}
