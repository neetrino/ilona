import { APP_TIMEZONE, getZonedParts, wallTimeToUtc } from '@ilona/types';

export { APP_TIMEZONE, getZonedParts, wallTimeToUtc };

export function getAppTimeLocaleTag(locale: string): string {
  return locale === 'hy' ? 'hy-AM' : 'en-GB';
}

/** Format lesson/event time in the project timezone (same for every user). */
export function formatAppTime(
  date: Date | string,
  locale: string = 'en',
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString(getAppTimeLocaleTag(locale) === 'hy-AM' ? 'hy-AM' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: APP_TIMEZONE,
    ...options,
  });
}

/** Format lesson/event date in the project timezone. */
export function formatAppDate(
  date: Date | string,
  locale: string = 'en',
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(getAppTimeLocaleTag(locale), {
    timeZone: APP_TIMEZONE,
    ...options,
  });
}

/** `HH:mm` wall clock in app timezone. */
export function formatAppTimeHHmm(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '--:--';
  return getZonedParts(d).timeHHmm;
}

/** Lesson start–end range (`HH:mm–HH:mm`) in app timezone. */
export function formatAppTimeRange(
  start: Date | string,
  durationMinutes: number | null | undefined,
): string {
  const startDate = typeof start === 'string' ? new Date(start) : start;
  if (Number.isNaN(startDate.getTime())) return '--:--';
  const startLabel = formatAppTimeHHmm(startDate);
  const duration =
    typeof durationMinutes === 'number' && Number.isFinite(durationMinutes) && durationMinutes > 0
      ? durationMinutes
      : null;
  if (duration == null) return startLabel;
  const endDate = new Date(startDate.getTime() + duration * 60_000);
  return `${startLabel}–${formatAppTimeHHmm(endDate)}`;
}

/** Date + time inputs → ISO stored for lessons (app timezone wall clock). */
export function lessonWallTimeToIso(ymd: string, timeHHmm: string): string {
  return wallTimeToUtc(ymd, timeHHmm).toISOString();
}

/** Medium date + short time in app timezone (e.g. lesson subtitles). */
export function formatAppDateTime(date: Date | string, locale: string = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(getAppTimeLocaleTag(locale), {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: APP_TIMEZONE,
  });
}
