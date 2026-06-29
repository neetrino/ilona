export type PeriodPreset = 'day' | 'week' | 'month' | 'custom';

export function toIsoStartOfDay(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function toIsoEndOfDay(date: Date): string {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

export function toInputDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function capitalizeLabel(value: string, locale: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toLocaleUpperCase(locale) + trimmed.slice(1);
}

export function computeRange(preset: PeriodPreset): { from: Date; to: Date } {
  const now = new Date();
  if (preset === 'day') {
    return { from: now, to: now };
  }
  if (preset === 'week') {
    const monday = new Date(now);
    const day = (monday.getDay() + 6) % 7;
    monday.setDate(monday.getDate() - day);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { from: monday, to: sunday };
  }
  if (preset === 'month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from, to };
  }
  return { from: now, to: now };
}

export function getMonthString(salary: { month: number; year: number }): string {
  if (salary.year != null && salary.month != null) {
    return `${salary.year}-${String(salary.month).padStart(2, '0')}`;
  }
  return '';
}

export function formatMonthFromSalary(
  salary: { month: number; year: number },
  locale: string,
  unknownLabel: string,
): string {
  if (salary.month != null && salary.year != null) {
    const date = new Date(salary.year, salary.month - 1);
    return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  }
  return unknownLabel;
}
