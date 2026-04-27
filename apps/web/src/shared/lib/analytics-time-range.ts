/**
 * Time filter helpers for analytics. Uses the browser's local timezone for
 * start/end of calendar day, week, and custom ranges, then serializes to ISO
 * for API calls (aligns with how lesson/billing times are compared on the server).
 */

export type TimeFilterMode = 'day' | 'week' | 'date';

export type RevenueGranularity = 'day' | 'week' | 'custom';

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function toYmd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseYmd(ymd: string): { y: number; m: number; d: number } {
  const [y, m, d] = ymd.split('-').map((x) => parseInt(x, 10));
  return { y, m, d };
}

function startOfLocalDay(ymd: string): Date {
  const { y, m, d } = parseYmd(ymd);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function endOfLocalDay(ymd: string): Date {
  const { y, m, d } = parseYmd(ymd);
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}

function addLocalDays(anchor: Date, delta: number): Date {
  const x = new Date(anchor);
  x.setDate(x.getDate() + delta);
  return x;
}

/**
 * Monday 00:00:00.000 to Sunday 23:59:59.999 in local time for the week that contains `anchor`.
 */
function localWeekRange(anchor: Date): { from: Date; to: Date } {
  const d = (anchor.getDay() + 6) % 7; // 0 = Mon, … 6 = Sun
  const monday = addLocalDays(anchor, -d);
  monday.setHours(0, 0, 0, 0);
  const sunday = addLocalDays(monday, 6);
  sunday.setHours(23, 59, 59, 999);
  return { from: monday, to: sunday };
}

function diffLocalDays(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b.getTime() - a.getTime()) / 864e5) + 1;
}

export type TimeRangeResult = {
  dateFrom: string;
  dateTo: string;
  revenueGranularity: RevenueGranularity;
  /** Inclusive number of local calendar days in [from, to] (for display). */
  daySpan: number;
};

/**
 * @param dayYmd - Calendar day in `YYYY-MM-DD` (day mode).
 * @param weekAnchorYmd - Any day inside the week (week mode).
 * @param customFromYmd / customToYmd - Inclusive (date mode / custom range). Swapped if from > to.
 */
export function buildTimeRange(
  mode: TimeFilterMode,
  opts: {
    dayYmd: string;
    weekAnchorYmd: string;
    customFromYmd: string;
    customToYmd: string;
  }
): TimeRangeResult {
  if (mode === 'day') {
    const from = startOfLocalDay(opts.dayYmd);
    const to = endOfLocalDay(opts.dayYmd);
    return {
      dateFrom: from.toISOString(),
      dateTo: to.toISOString(),
      revenueGranularity: 'day',
      daySpan: 1,
    };
  }
  if (mode === 'week') {
    const a = startOfLocalDay(opts.weekAnchorYmd);
    const { from, to } = localWeekRange(a);
    return {
      dateFrom: from.toISOString(),
      dateTo: to.toISOString(),
      revenueGranularity: 'week',
      daySpan: 7,
    };
  }
  const a0 = startOfLocalDay(opts.customFromYmd);
  const b0 = endOfLocalDay(opts.customToYmd);
  const minDay = a0.getTime() <= b0.getTime() ? a0 : b0;
  const maxDay = a0.getTime() <= b0.getTime() ? b0 : a0;
  const fromY = toYmd(minDay);
  const toY = toYmd(
    new Date(
      maxDay.getFullYear(),
      maxDay.getMonth(),
      maxDay.getDate(),
      0,
      0,
      0,
      0,
    )
  );
  const start = startOfLocalDay(fromY);
  const end = endOfLocalDay(toY);
  const daySpan = Math.max(1, diffLocalDays(start, end));
  return {
    dateFrom: start.toISOString(),
    dateTo: end.toISOString(),
    revenueGranularity: 'custom',
    daySpan,
  };
}

/**
 * Suggested default custom range: last 30 local days including today.
 */
export function defaultCustomRangeLast30Days(): { fromYmd: string; toYmd: string } {
  const t = new Date();
  const end = toYmd(t);
  const startD = addLocalDays(t, -29);
  const start = toYmd(startD);
  return { fromYmd: start, toYmd: end };
}

/**
 * Default: current calendar month in local time.
 */
export function defaultCustomRangeCurrentMonth(): { fromYmd: string; toYmd: string } {
  const t = new Date();
  const start = new Date(t.getFullYear(), t.getMonth(), 1);
  const end = new Date(t.getFullYear(), t.getMonth() + 1, 0);
  return { fromYmd: toYmd(start), toYmd: toYmd(end) };
}

/**
 * Wide custom range to approximate "all" history (student analytics).
 */
export function defaultCustomRangeAllTime(): { fromYmd: string; toYmd: string } {
  return { fromYmd: '2000-01-01', toYmd: toYmd(new Date()) };
}

/**
 * ~6 month window: first day of the month, 5 months back, through today.
 */
export function defaultCustomRangeSixMonths(): { fromYmd: string; toYmd: string } {
  const t = new Date();
  const start = new Date(t.getFullYear(), t.getMonth() - 5, 1);
  return { fromYmd: toYmd(start), toYmd: toYmd(t) };
}

/**
 * API series for /analytics/revenue: single bucket, daily rows, or monthly rows in range.
 */
export function resolveRevenueApiSeries(
  mode: TimeFilterMode,
  daySpan: number
): 'none' | 'per_day' | 'per_month' {
  if (mode === 'day' || mode === 'week') {
    return 'none';
  }
  return daySpan > 62 ? 'per_month' : 'per_day';
}
