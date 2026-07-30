/** Calendar month key `YYYY-MM` (period: month day 1 → next month day 1). */

export function getCurrentEarningsMonth(): string {
  const now = new Date();
  return formatEarningsMonth(now.getFullYear(), now.getMonth() + 1);
}

export function formatEarningsMonth(year: number, month1to12: number): string {
  return `${year}-${String(month1to12).padStart(2, '0')}`;
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

/** Inclusive bounds for SalaryRecord.month (stored as local month start). */
export function earningsMonthDateBounds(monthKey: string): { dateFrom: string; dateTo: string } {
  const key = parseEarningsMonth(monthKey);
  const [y, m] = key.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return {
    dateFrom: `${key}-01`,
    dateTo: `${key}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function formatEarningsPeriodLabel(monthKey: string, locale: string): string {
  const key = parseEarningsMonth(monthKey);
  const [y, m] = key.split('-').map(Number);
  const start = new Date(y, m - 1, 1);
  const endExclusive = new Date(y, m, 1);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  return `${start.toLocaleDateString(locale, opts)} – ${endExclusive.toLocaleDateString(locale, opts)}`;
}

export function formatEarningsMonthLabel(monthKey: string, locale: string): string {
  const key = parseEarningsMonth(monthKey);
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}
