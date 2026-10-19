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
