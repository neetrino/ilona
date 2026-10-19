import { BadRequestException } from '@nestjs/common';
import { getCalendarDateInTimezone, startOfZonedDay } from '@ilona/types';

const QUARTER_KEY = /^(\d{4})-Q([1-4])$/;

export type QuarterBounds = { start: Date; end: Date };

export function quarterKeyFromDate(date: Date): string {
  const [year, month] = getCalendarDateInTimezone(date).split('-').map(Number);
  return `${year}-Q${Math.ceil(month / 3)}`;
}

export function previousQuarterKey(quarterKey: string): string {
  const { year, quarter } = parseQuarterKey(quarterKey);
  if (quarter === 1) {
    return `${year - 1}-Q4`;
  }
  return `${year}-Q${quarter - 1}`;
}

const QUARTER_LAST_DAY: Record<number, string> = {
  1: '03-31',
  2: '06-30',
  3: '09-30',
  4: '12-31',
};

export type QuarterSendProgress = {
  daysPassed: number;
  daysLeft: number;
  sendOn: string;
};

export function quarterSendProgress(quarterKey: string, now: Date): QuarterSendProgress {
  const { year, quarter } = parseQuarterKey(quarterKey);
  const startOn = `${year}-${padMonth((quarter - 1) * 3 + 1)}-01`;
  const sendOn = `${year}-${QUARTER_LAST_DAY[quarter]}`;
  const today = calendarIndex(getCalendarDateInTimezone(now));
  return {
    daysPassed: Math.max(0, today - calendarIndex(startOn) + 1),
    daysLeft: Math.max(0, calendarIndex(sendOn) - today),
    sendOn,
  };
}

export function quarterBounds(quarterKey: string): QuarterBounds {
  const { year, quarter } = parseQuarterKey(quarterKey);
  const startMonth = (quarter - 1) * 3 + 1;
  const endYear = quarter === 4 ? year + 1 : year;
  const endMonth = quarter === 4 ? 1 : startMonth + 3;
  return {
    start: startOfZonedDay(`${year}-${padMonth(startMonth)}-01`),
    end: startOfZonedDay(`${endYear}-${padMonth(endMonth)}-01`),
  };
}

function parseQuarterKey(quarterKey: string): { year: number; quarter: number } {
  const match = QUARTER_KEY.exec(quarterKey);
  if (!match) {
    throw new BadRequestException('Invalid quarter');
  }
  return { year: Number(match[1]), quarter: Number(match[2]) };
}

function padMonth(month: number): string {
  return String(month).padStart(2, '0');
}

function calendarIndex(ymd: string): number {
  const [year, month, day] = ymd.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}
