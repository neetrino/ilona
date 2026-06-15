import type { Teacher } from '@/features/teachers';
import type { Center } from '@ilona/types';

/**
 * Unique centers/branches for a teacher from explicit assignments (centers, centerLinks)
 * and from groups when no explicit data exists.
 */
export function getTeacherCenters(teacher: Teacher): Center[] {
  const byId = new Map<string, { id: string; name: string }>();

  const add = (c: { id: string; name: string } | undefined) => {
    if (c?.id) {
      byId.set(c.id, { id: c.id, name: c.name });
    }
  };

  for (const c of teacher.centers ?? []) {
    add(c);
  }
  for (const link of teacher.centerLinks ?? []) {
    add(link.center);
  }

  if (byId.size > 0) {
    return Array.from(byId.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    ) as Center[];
  }

  return Array.from(
    new Map(
      (teacher.groups || [])
        .filter((group) => group.center)
        .map((group) => [group.center!.id, group.center!])
    ).values()
  )
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => ({ id: c.id, name: c.name })) as Center[];
}

/**
 * Count unique teachers by stable teacher.id (not name or center assignment).
 */
export function countUniqueTeachers(teachers: Teacher[]): number {
  const ids = new Set<string>();
  for (const teacher of teachers) {
    if (teacher?.id) {
      ids.add(teacher.id);
    }
  }
  return ids.size;
}

/**
 * Filter teachers by branch IDs
 */
export function filterTeachersByBranches(
  teachers: Teacher[],
  selectedBranchIds: Set<string>
): Teacher[] {
  if (selectedBranchIds.size === 0) {
    return teachers;
  }

  return teachers.filter((teacher) => {
    const teacherCenters = getTeacherCenters(teacher);
    const teacherCenterIds = new Set(teacherCenters.map(c => c.id));
    return Array.from(selectedBranchIds).some(branchId => 
      teacherCenterIds.has(branchId)
    );
  });
}

/**
 * Group teachers by center for tabs and strip counts: each teacher appears under every
 * branch they are assigned to (not only a single "primary" center).
 */
export function groupTeachersByCenter(
  teachers: Teacher[],
  centers: Center[]
): Record<string, Teacher[]> {
  const grouped: Record<string, Teacher[]> = {};

  centers.forEach((center) => {
    grouped[center.id] = [];
  });

  grouped['unassigned'] = [];

  teachers.forEach((teacher) => {
    const teacherCenters = getTeacherCenters(teacher);

    if (teacherCenters.length === 0) {
      grouped['unassigned'].push(teacher);
      return;
    }

    let matchedVisibleCenter = false;
    for (const tc of teacherCenters) {
      if (grouped[tc.id]) {
        grouped[tc.id].push(teacher);
        matchedVisibleCenter = true;
      }
    }

    if (!matchedVisibleCenter) {
      grouped['unassigned'].push(teacher);
    }
  });

  return grouped;
}

/**
 * Format hourly rate as currency
 */
export function formatHourlyRate(rate: number | string | null | undefined): string {
  const numericRate = typeof rate === 'string' ? parseFloat(rate) : Number(rate || 0);
  const formattedNumber = new Intl.NumberFormat('hy-AM', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number.isNaN(numericRate) ? 0 : numericRate);
  return `${formattedNumber} ֏`;
}

/** Format lesson rate as `12,000 ֏` (dram sign after number). */
export function formatLessonRate(rate: number | string | null | undefined): string {
  const numericRate = typeof rate === 'string' ? parseFloat(rate) : Number(rate || 0);
  const formattedNumber = new Intl.NumberFormat('hy-AM', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number.isNaN(numericRate) ? 0 : numericRate);
  return `${formattedNumber} ֏`;
}

