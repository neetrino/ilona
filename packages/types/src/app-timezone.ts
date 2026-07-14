/** Canonical project timezone for lesson wall-clock times. */
export const APP_TIMEZONE = 'Asia/Yerevan';

export type ZonedDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  ymd: string;
  timeHHmm: string;
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function readZonedPartsMap(date: Date, timeZone: string): Record<string, string> {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const map: Record<string, string> = {};
  for (const part of dtf.formatToParts(date)) {
    if (part.type !== 'literal') {
      map[part.type] = part.value;
    }
  }
  return map;
}

/** Calendar date `YYYY-MM-DD` for an instant in a timezone. */
export function getCalendarDateInTimezone(date: Date, timeZone = APP_TIMEZONE): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Convert a wall-clock timestamp in `timeZone` to a UTC `Date`.
 * month is 1–12.
 */
export function zonedWallClockToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  ms: number,
  timeZone = APP_TIMEZONE,
): Date {
  const desiredUtc = Date.UTC(year, month - 1, day, hour, minute, second, ms);
  let ts = desiredUtc;

  for (let i = 0; i < 5; i++) {
    const p = readZonedPartsMap(new Date(ts), timeZone);
    const actualUtc = Date.UTC(
      Number(p.year),
      Number(p.month) - 1,
      Number(p.day),
      Number(p.hour),
      Number(p.minute),
      Number(p.second),
    );
    const diff = desiredUtc - actualUtc;
    if (Math.abs(diff) < 1) {
      break;
    }
    ts += diff;
  }

  return new Date(ts);
}

/** `YYYY-MM-DD` + `HH:mm` wall time in app timezone → UTC instant. */
export function wallTimeToUtc(
  ymd: string,
  timeHHmm: string,
  timeZone = APP_TIMEZONE,
): Date {
  const [year, month, day] = ymd.split('-').map(Number);
  const [hour, minute] = timeHHmm.split(':').map(Number);
  if (![year, month, day, hour, minute].every((n) => Number.isFinite(n))) {
    throw new Error(`Invalid wall time: ${ymd} ${timeHHmm}`);
  }
  return zonedWallClockToUtc(year, month, day, hour, minute, 0, 0, timeZone);
}

/** Start of calendar day (00:00:00.000) in app timezone. */
export function startOfZonedDay(ymd: string, timeZone = APP_TIMEZONE): Date {
  const [year, month, day] = ymd.split('-').map(Number);
  return zonedWallClockToUtc(year, month, day, 0, 0, 0, 0, timeZone);
}

/** End of calendar day (23:59:59.999) in app timezone. */
export function endOfZonedDay(ymd: string, timeZone = APP_TIMEZONE): Date {
  const [year, month, day] = ymd.split('-').map(Number);
  return zonedWallClockToUtc(year, month, day, 23, 59, 59, 999, timeZone);
}

/** Read wall-clock parts of an instant in app timezone. */
export function getZonedParts(date: Date, timeZone = APP_TIMEZONE): ZonedDateTimeParts {
  const p = readZonedPartsMap(date, timeZone);
  const year = Number(p.year);
  const month = Number(p.month);
  const day = Number(p.day);
  const hour = Number(p.hour);
  const minute = Number(p.minute);
  const second = Number(p.second);
  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    ymd: `${year}-${pad2(month)}-${pad2(day)}`,
    timeHHmm: `${pad2(hour)}:${pad2(minute)}`,
  };
}

/** Weekday for a calendar `YYYY-MM-DD` (0=Sunday … 6=Saturday). */
export function ymdWeekday(ymd: string): number {
  const [year, month, day] = ymd.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).getUTCDay();
}

/** Add calendar days to a `YYYY-MM-DD` string. */
export function addCalendarDays(ymd: string, days: number): string {
  const [year, month, day] = ymd.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  return `${next.getUTCFullYear()}-${pad2(next.getUTCMonth() + 1)}-${pad2(next.getUTCDate())}`;
}

/** Inclusive list of `YYYY-MM-DD` values from start through end. */
export function enumerateYmdRange(startYmd: string, endYmd: string): string[] {
  const out: string[] = [];
  let cur = startYmd;
  while (cur <= endYmd) {
    out.push(cur);
    cur = addCalendarDays(cur, 1);
  }
  return out;
}

/** Normalize API date input to `YYYY-MM-DD` (date-only prefix or zoned calendar day). */
export function toYmd(input: string | Date, timeZone = APP_TIMEZONE): string {
  if (typeof input === 'string') {
    const match = /^(\d{4}-\d{2}-\d{2})/.exec(input.trim());
    if (match) {
      return match[1];
    }
    return getCalendarDateInTimezone(new Date(input), timeZone);
  }
  return getCalendarDateInTimezone(input, timeZone);
}
