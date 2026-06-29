import { getAppDateLocaleTag } from '@/shared/lib/utils';
import type { StudentLifecycleStatus } from '../../types';

export function formatDisplayDate(value: string | null | undefined, locale: string): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(getAppDateLocaleTag(locale), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateOfBirth(value: string | null | undefined, locale: string): string {
  if (!value?.trim()) return '—';

  const trimmed = value.trim();
  let day: number;
  let monthIndex: number;
  let year: number;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [yearStr, monthStr, dayStr] = trimmed.split('-');
    year = Number(yearStr);
    monthIndex = Number(monthStr) - 1;
    day = Number(dayStr);
  } else {
    const d = new Date(trimmed);
    if (Number.isNaN(d.getTime())) return '—';
    day = d.getDate();
    monthIndex = d.getMonth();
    year = d.getFullYear();
  }

  const month = new Date(Date.UTC(year, monthIndex, day)).toLocaleDateString(
    getAppDateLocaleTag(locale),
    { month: 'short', timeZone: 'UTC' },
  );

  return `${day} ${month} ${year}`;
}

export function formatLifecycle(status: StudentLifecycleStatus | undefined): string {
  if (!status) return '—';
  const labels: Record<StudentLifecycleStatus, string> = {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    UNGROUPED: 'Ungrouped',
    NEW: 'New',
    RISK: 'At risk',
    HIGH_RISK: 'High risk',
  };
  return labels[status] ?? status;
}
