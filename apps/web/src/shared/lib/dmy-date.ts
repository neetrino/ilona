export const DMY_DATE_RE = /^(\d{2})\/(\d{2})\/(\d{4})$/;
export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

function buildDmyString(digits: string): string {
  if (digits.length === 0) return '';
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function isValidYearPrefix(prefix: string): boolean {
  if (prefix.length === 0) return true;
  if (prefix.length === 1) return prefix === '1' || prefix === '2';
  if (prefix.length === 2) {
    if (prefix.startsWith('1')) return prefix === '19';
    if (prefix.startsWith('2')) return prefix === '20' || prefix === '21';
    return false;
  }
  if (prefix.length === 3) {
    const num = Number(prefix);
    if (prefix.startsWith('19')) return num >= 190 && num <= 199;
    if (prefix.startsWith('20')) return num >= 200 && num <= 209;
    if (prefix.startsWith('21')) return num === 210;
    return false;
  }
  const year = Number(prefix);
  return year >= MIN_YEAR && year <= MAX_YEAR;
}

function clampSegment(twoDigits: string, min: number, max: number): string {
  let num = Number(twoDigits);
  if (Number.isNaN(num) || num < min) num = min;
  if (num > max) num = max;
  return String(num).padStart(2, '0');
}

function consumeDay(digits: string, start: number): { consumed: string; index: number } {
  if (start >= digits.length) return { consumed: '', index: start };

  const d0 = digits[start];
  const n0 = Number(d0);

  if (start + 1 >= digits.length) {
    if (n0 >= 4 && n0 <= 9) return { consumed: `0${d0}`, index: start + 1 };
    if (n0 <= 3) return { consumed: d0, index: start + 1 };
    return { consumed: '', index: start };
  }

  const d1 = digits[start + 1];
  return { consumed: clampSegment(d0 + d1, 1, 31), index: start + 2 };
}

function consumeMonth(digits: string, start: number): { consumed: string; index: number } {
  if (start >= digits.length) return { consumed: '', index: start };

  const m0 = digits[start];
  const n0 = Number(m0);

  if (start + 1 >= digits.length) {
    if (m0 === '0') return { consumed: m0, index: start + 1 };
    if (n0 >= 2 && n0 <= 9) return { consumed: `0${m0}`, index: start + 1 };
    if (m0 === '1') return { consumed: m0, index: start + 1 };
    return { consumed: '', index: start };
  }

  const m1 = digits[start + 1];
  return { consumed: clampSegment(m0 + m1, 1, 12), index: start + 2 };
}

function consumeYear(digits: string, start: number): { consumed: string; index: number } {
  let consumed = '';
  for (let i = start; i < digits.length && consumed.length < 4; i += 1) {
    const candidate = consumed + digits[i];
    if (!isValidYearPrefix(candidate)) break;
    consumed = candidate;
  }
  return { consumed, index: start + consumed.length };
}

function appendDmyDigit(current: string, digit: string): string {
  if (current.length >= 8) return current;

  const attempt = current + digit;

  if (current.length < 2) {
    const day = consumeDay(attempt, 0);
    if (day.consumed.length > current.length) {
      return day.consumed;
    }
    return current;
  }

  const dayPart = consumeDay(attempt, 0);
  if (dayPart.consumed.length < 2) {
    return current;
  }

  if (current.length < 4) {
    const month = consumeMonth(attempt, dayPart.index);
    const combined = dayPart.consumed + month.consumed;
    if (combined.length > current.length) {
      return combined;
    }
    return current;
  }

  const monthPart = consumeMonth(attempt, dayPart.index);
  const yearStart = dayPart.index + monthPart.consumed.length;
  const yearPart = consumeYear(attempt, yearStart);
  const combined = dayPart.consumed + monthPart.consumed + yearPart.consumed;
  if (combined.length > current.length) {
    return combined;
  }
  return current;
}

/**
 * Formats manual DD/MM/YYYY input while typing.
 * Clamps day to 01–31 and month to 01–12 while typing.
 */
export function formatDmyInputValue(raw: string, previousFormatted = ''): string {
  const allDigits = raw.replace(/\D/g, '');
  const prevDigits = previousFormatted.replace(/\D/g, '');

  if (allDigits.length < prevDigits.length) {
    return buildDmyString(allDigits);
  }

  let result = prevDigits;
  for (const digit of allDigits.slice(prevDigits.length)) {
    result = appendDmyDigit(result, digit);
  }

  return buildDmyString(result);
}

export function parseDmyToIso(value: string): string | undefined {
  const match = DMY_DATE_RE.exec(value.trim());
  if (!match) return undefined;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31 || year < MIN_YEAR || year > MAX_YEAR) {
    return undefined;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return undefined;
  }

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function resolveDmyOrIsoToIso(value?: string): string | undefined {
  if (!value?.trim()) return undefined;
  const trimmed = value.trim();
  const fromDmy = parseDmyToIso(trimmed);
  if (fromDmy) return fromDmy;
  if (ISO_DATE_RE.test(trimmed)) return trimmed;
  return undefined;
}

/** @deprecated Use resolveDmyOrIsoToIso */
export const resolveDateOfBirthToIso = resolveDmyOrIsoToIso;

export function isoToDmy(value?: string | null): string {
  if (!value?.trim()) return '';
  const trimmed = value.trim();
  if (DMY_DATE_RE.test(trimmed)) return trimmed;
  if (ISO_DATE_RE.test(trimmed)) {
    const [year, month, day] = trimmed.split('-');
    return `${day}/${month}/${year}`;
  }
  const date = new Date(trimmed);
  if (!Number.isNaN(date.getTime())) {
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }
  return trimmed;
}

export function formatIsoDateAsDmy(iso?: string | null): string {
  return isoToDmy(iso);
}
