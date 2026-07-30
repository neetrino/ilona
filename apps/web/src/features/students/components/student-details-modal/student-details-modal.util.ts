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

export type ParsedStudentNote = {
  kind: 'deactivation' | 'activation' | 'general';
  label?: string;
  date?: string;
  body: string;
};

const TAGGED_NOTE_RE = /^\[([^\]]+?)\s+(\d{4}-\d{2}-\d{2})\]\s*([\s\S]*)$/;

/** Split stored student.notes into display entries (double-newline separated). */
export function parseStudentNotes(notes: string): ParsedStudentNote[] {
  return notes
    .split(/\n\n+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const match = chunk.match(TAGGED_NOTE_RE);
      if (!match) {
        return { kind: 'general' as const, body: chunk };
      }
      const label = match[1].trim();
      const date = match[2];
      const body = match[3].trim();
      if (/deactiv|անջատ/i.test(label)) {
        return { kind: 'deactivation' as const, label, date, body };
      }
      if (/activ|միաց/i.test(label)) {
        return { kind: 'activation' as const, label, date, body };
      }
      return { kind: 'general' as const, label, date, body: body || chunk };
    });
}
