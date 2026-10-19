import {
  APP_TIMEZONE,
  endOfZonedDay,
  getCalendarDateInTimezone,
  startOfZonedDay,
} from '@ilona/types';

export function zonedDayRange(date: Date, timeZone = APP_TIMEZONE): {
  start: Date;
  end: Date;
  ymd: string;
} {
  const ymd = getCalendarDateInTimezone(date, timeZone);
  return {
    start: startOfZonedDay(ymd, timeZone),
    end: new Date(endOfZonedDay(ymd, timeZone).getTime() + 1),
    ymd,
  };
}

export function isQuarterEnd(ymd: string): boolean {
  return ymd.endsWith('-03-31') || ymd.endsWith('-06-30') || ymd.endsWith('-09-30') || ymd.endsWith('-12-31');
}
