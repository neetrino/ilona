/** Earnings period helpers: inclusive `YYYY-MM-DD` from/to range. */

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function toYmd(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function parseYmd(value: string | null | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

export function getDefaultEarningsRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { from: toYmd(from), to: toYmd(to) };
}

/** @deprecated Prefer earningsFrom/earningsTo range. Kept for month-only helpers. */
export function getCurrentEarningsMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
}

export function formatEarningsMonth(year: number, month1to12: number): string {
  return `${year}-${pad2(month1to12)}`;
}

export function parseEarningsMonth(value: string | null | undefined): string {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const [y, m] = value.split('-').map(Number);
    if (m >= 1 && m <= 12) return formatEarningsMonth(y, m);
  }
  return getCurrentEarningsMonth();
}

export function shiftEarningsMonth(monthKey: string, delta: number): string {
  const [y, m] = parseEarningsMonth(monthKey).split('-').map(Number);
  const date = new Date(y, m - 1 + delta, 1);
  return formatEarningsMonth(date.getFullYear(), date.getMonth() + 1);
}

export function shiftEarningsRange(
  from: string,
  to: string,
  deltaMonths: number,
): { from: string; to: string } {
  const fromDate = parseYmd(from) ?? new Date();
  const toDate = parseYmd(to) ?? new Date();
  const nextFrom = new Date(fromDate.getFullYear(), fromDate.getMonth() + deltaMonths, fromDate.getDate());
  const nextTo = new Date(toDate.getFullYear(), toDate.getMonth() + deltaMonths, toDate.getDate());
  return { from: toYmd(nextFrom), to: toYmd(nextTo) };
}

/**
 * Map UI range to SalaryRecord.month bounds (month stored as day-1).
 * If `to` is the 1st of a month after `from`, treat `to` as exclusive end
 * (e.g. Jul 1 → Aug 1 includes only July).
 */
export function earningsRangeToApiBounds(from: string, to: string): { dateFrom: string; dateTo: string } {
  const fromDate = parseYmd(from);
  const toDate = parseYmd(to);
  if (!fromDate || !toDate) {
    const fallback = getDefaultEarningsRange();
    return earningsRangeToApiBounds(fallback.from, fallback.to);
  }

  let start = fromDate;
  let end = toDate;
  if (end.getTime() < start.getTime()) {
    const tmp = start;
    start = end;
    end = tmp;
  }

  const monthStartFrom = new Date(start.getFullYear(), start.getMonth(), 1);
  let monthEndInclusive: Date;

  if (end.getDate() === 1 && end.getTime() > start.getTime()) {
    monthEndInclusive = new Date(end.getFullYear(), end.getMonth(), 0);
  } else {
    monthEndInclusive = new Date(end.getFullYear(), end.getMonth() + 1, 0);
  }

  return {
    dateFrom: toYmd(monthStartFrom),
    dateTo: toYmd(monthEndInclusive),
  };
}

export function normalizeEarningsRange(
  from: string | null | undefined,
  to: string | null | undefined,
): { from: string; to: string } {
  const defaults = getDefaultEarningsRange();
  const fromDate = parseYmd(from) ?? parseYmd(defaults.from)!;
  const toDate = parseYmd(to) ?? parseYmd(defaults.to)!;
  if (toDate.getTime() < fromDate.getTime()) {
    return { from: toYmd(toDate), to: toYmd(fromDate) };
  }
  return { from: toYmd(fromDate), to: toYmd(toDate) };
}

export function formatEarningsPeriodLabel(from: string, to: string, locale: string): string {
  const fromDate = parseYmd(from);
  const toDate = parseYmd(to);
  if (!fromDate || !toDate) return '—';
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  return `${fromDate.toLocaleDateString(locale, opts)} – ${toDate.toLocaleDateString(locale, opts)}`;
}

export function formatEarningsRangeTitle(from: string, to: string, locale: string): string {
  const fromDate = parseYmd(from);
  const toDate = parseYmd(to);
  if (!fromDate || !toDate) return '—';

  const sameMonth =
    fromDate.getFullYear() === toDate.getFullYear() &&
    fromDate.getMonth() === toDate.getMonth() &&
    fromDate.getDate() === 1 &&
    (toDate.getDate() === 1
      ? false
      : toDate.getDate() === new Date(toDate.getFullYear(), toDate.getMonth() + 1, 0).getDate());

  // Jul 1 → Aug 1 (exclusive end) → "July 2026"
  if (
    fromDate.getDate() === 1 &&
    toDate.getDate() === 1 &&
    (toDate.getFullYear() !== fromDate.getFullYear() || toDate.getMonth() !== fromDate.getMonth())
  ) {
    const spanMonths =
      (toDate.getFullYear() - fromDate.getFullYear()) * 12 +
      (toDate.getMonth() - fromDate.getMonth());
    if (spanMonths === 1) {
      return fromDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    }
  }

  if (sameMonth) {
    return fromDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  }

  return formatEarningsPeriodLabel(from, to, locale);
}

/** @deprecated Use formatEarningsRangeTitle with from/to. */
export function formatEarningsMonthLabel(monthKey: string, locale: string): string {
  const key = parseEarningsMonth(monthKey);
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

/** @deprecated Use earningsRangeToApiBounds. */
export function earningsMonthDateBounds(monthKey: string): { dateFrom: string; dateTo: string } {
  const key = parseEarningsMonth(monthKey);
  const [y, m] = key.split('-').map(Number);
  const from = `${key}-01`;
  const to = toYmd(new Date(y, m, 1));
  return earningsRangeToApiBounds(from, to);
}
