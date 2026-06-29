import {
  addDays,
  isValid,
  parse,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import {
  DATE_PICKER_POPOVER_ATTR,
  ISO_DATE_RE,
  MANUAL_DATE_FORMATS,
} from './date-picker-input.constants';

export function isDatePickerEventTarget(target: Node): boolean {
  if (target instanceof Element && target.closest(`[${DATE_PICKER_POPOVER_ATTR}]`)) {
    return true;
  }
  return false;
}

export function resolvePortalContainer(root: HTMLDivElement | null): HTMLElement {
  if (!root) return document.body;
  const dialog = root.closest('[role="dialog"]');
  return (dialog as HTMLElement | null) ?? document.body;
}

export function parseValue(value?: string): Date | null {
  if (!value) return null;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function createCalendarDays(monthDate: Date): Date[] {
  const firstDay = startOfMonth(monthDate);
  const calendarStart = startOfWeek(firstDay, { weekStartsOn: 1 });
  return Array.from({ length: 42 }, (_, index) => addDays(calendarStart, index));
}

export function toDateString(value?: string | number | readonly string[]): string {
  if (!value || Array.isArray(value)) return '';
  return String(value);
}

export function parseManualDate(text: string): Date | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  for (const dateFormat of MANUAL_DATE_FORMATS) {
    const parsed = parse(trimmed, dateFormat, new Date());
    if (isValid(parsed)) return parsed;
  }

  const iso = parseISO(trimmed);
  return Number.isNaN(iso.getTime()) ? null : iso;
}

export function isDesktopViewport(): boolean {
  return window.innerWidth >= 1367;
}

export function getYearBounds(
  min?: string | number | readonly string[],
  max?: string | number | readonly string[],
) {
  const currentYear = new Date().getFullYear();
  const minStr = toDateString(min);
  const maxStr = toDateString(max);
  const minYear =
    minStr && ISO_DATE_RE.test(minStr) ? parseISO(minStr).getFullYear() : currentYear - 120;
  const maxYear =
    maxStr && ISO_DATE_RE.test(maxStr) ? parseISO(maxStr).getFullYear() : currentYear + 10;
  return { minYear, maxYear };
}

export function buildYearList(minYear: number, maxYear: number): number[] {
  const years: number[] = [];
  for (let year = maxYear; year >= minYear; year -= 1) {
    years.push(year);
  }
  return years;
}
