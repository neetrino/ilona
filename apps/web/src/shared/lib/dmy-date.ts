export const DMY_DATE_RE = /^(\d{2})\/(\d{2})\/(\d{4})$/;
export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

type SegmentLengths = [number, number, number];

function buildDmyString(digits: string): string {
  if (digits.length === 0) return '';
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function parseSegmentLengths(formatted: string): SegmentLengths {
  const [day = '', month = '', year = ''] = formatted.split('/');
  return [
    day.replace(/\D/g, '').length,
    month.replace(/\D/g, '').length,
    year.replace(/\D/g, '').length,
  ];
}

function joinByLengths(digits: string, lengths: SegmentLengths): string {
  let offset = 0;
  const day = digits.slice(offset, offset + lengths[0]);
  offset += lengths[0];
  const month = digits.slice(offset, offset + lengths[1]);
  offset += lengths[1];
  const year = digits.slice(offset, offset + lengths[2]);

  let nextDay = day;
  let nextMonth = month;
  if (nextDay.length === 2) nextDay = clampSegment(nextDay, 1, 31);
  if (nextMonth.length === 2) nextMonth = clampSegment(nextMonth, 1, 12);

  if (!nextMonth && !year) return nextDay;
  if (!year) return `${nextDay}/${nextMonth}`;
  return `${nextDay}/${nextMonth}/${year}`;
}

function lengthsAfterDeleting(
  lengths: SegmentLengths,
  deleteAt: number,
  removed: number,
): SegmentLengths {
  const deleteEnd = deleteAt + removed;
  let pos = 0;
  const next: SegmentLengths = [0, 0, 0];
  for (let index = 0; index < 3; index += 1) {
    const start = pos;
    const end = pos + lengths[index];
    const overlap = Math.max(0, Math.min(end, deleteEnd) - Math.max(start, deleteAt));
    next[index] = lengths[index] - overlap;
    pos = end;
  }
  return next;
}

function lengthsAfterInserting(
  lengths: SegmentLengths,
  insertAt: number,
  insertedCount: number,
): SegmentLengths {
  const maxBySegment: SegmentLengths = [2, 2, 4];
  let pos = 0;
  const next: SegmentLengths = [...lengths];
  for (let index = 0; index < 3; index += 1) {
    const start = pos;
    const end = pos + lengths[index];
    if (insertAt >= start && insertAt <= end) {
      next[index] = Math.min(maxBySegment[index], lengths[index] + insertedCount);
      return next;
    }
    pos = end;
  }
  next[2] = Math.min(4, lengths[2] + insertedCount);
  return next;
}

export function countDigitsBefore(value: string, caret: number): number {
  let count = 0;
  const limit = Math.max(0, Math.min(caret, value.length));
  for (let index = 0; index < limit; index += 1) {
    if (/\d/.test(value[index] ?? '')) count += 1;
  }
  return count;
}

export function caretPosAfterDigits(formatted: string, digitCount: number): number {
  if (digitCount <= 0) return 0;
  let counted = 0;
  for (let index = 0; index < formatted.length; index += 1) {
    if (/\d/.test(formatted[index] ?? '')) {
      counted += 1;
      if (counted === digitCount) return index + 1;
    }
  }
  return formatted.length;
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

function formatAppendedDigits(prevDigits: string, nextDigits: string): string {
  let result = prevDigits;
  for (const digit of nextDigits.slice(prevDigits.length)) {
    result = appendDmyDigit(result, digit);
  }
  return buildDmyString(result);
}

/**
 * Formats manual DD/MM/YYYY input while typing.
 * Pass `caretStart` so mid-field edits keep day/month/year segments instead of
 * re-packing digits from scratch (which made Backspace jump to the year).
 */
export function formatDmyInputValue(
  raw: string,
  previousFormatted = '',
  caretStart: number | null = null,
): string {
  const allDigitsRaw = raw.replace(/\D/g, '');
  const prevDigits = previousFormatted.replace(/\D/g, '');
  const prevLengths = parseSegmentLengths(previousFormatted);

  // Digits unchanged (e.g. only a slash was deleted) — restore separators.
  if (allDigitsRaw === prevDigits) {
    if (!prevDigits) return '';
    if (prevLengths[0] + prevLengths[1] + prevLengths[2] === prevDigits.length) {
      return joinByLengths(prevDigits, prevLengths);
    }
    return buildDmyString(prevDigits);
  }

  if (!prevDigits) {
    return formatAppendedDigits('', allDigitsRaw.slice(0, 8));
  }

  if (allDigitsRaw.length > prevDigits.length && allDigitsRaw.startsWith(prevDigits)) {
    return formatAppendedDigits(prevDigits, allDigitsRaw.slice(0, 8));
  }

  if (allDigitsRaw.length < prevDigits.length && prevDigits.startsWith(allDigitsRaw) && caretStart === null) {
    return buildDmyString(allDigitsRaw);
  }

  if (allDigitsRaw.length === prevDigits.length && allDigitsRaw.length === 8) {
    return joinByLengths(allDigitsRaw, [2, 2, 4]);
  }

  if (caretStart === null) {
    if (allDigitsRaw.length < prevDigits.length) {
      return buildDmyString(allDigitsRaw.slice(0, 8));
    }
    return formatAppendedDigits(prevDigits, allDigitsRaw.slice(0, 8));
  }

  const digitsBeforeCaret = countDigitsBefore(raw, caretStart);

  if (allDigitsRaw.length < prevDigits.length) {
    const removed = prevDigits.length - allDigitsRaw.length;
    const deleteAt = digitsBeforeCaret;
    const nextDigits = prevDigits.slice(0, deleteAt) + prevDigits.slice(deleteAt + removed);
    const nextLengths = lengthsAfterDeleting(prevLengths, deleteAt, removed);
    return joinByLengths(nextDigits, nextLengths);
  }

  if (allDigitsRaw.length > prevDigits.length) {
    const insertedCount = allDigitsRaw.length - prevDigits.length;
    const insertAt = Math.max(0, digitsBeforeCaret - insertedCount);
    const insertedDigits = allDigitsRaw.slice(insertAt, insertAt + insertedCount);
    const targetLengths = lengthsAfterInserting(prevLengths, insertAt, insertedCount);
    const maxDigits = targetLengths[0] + targetLengths[1] + targetLengths[2];

    if (prevDigits.length >= maxDigits) {
      const overwriteAt = Math.min(insertAt, Math.max(0, prevDigits.length - 1));
      const nextDigits =
        prevDigits.slice(0, overwriteAt) +
        (insertedDigits[0] ?? '') +
        prevDigits.slice(overwriteAt + 1);
      const lengthsForFull: SegmentLengths =
        prevLengths[0] + prevLengths[1] + prevLengths[2] === 8 ? [2, 2, 4] : prevLengths;
      return joinByLengths(nextDigits.slice(0, 8), lengthsForFull);
    }

    const nextDigits = (
      prevDigits.slice(0, insertAt) +
      insertedDigits +
      prevDigits.slice(insertAt)
    ).slice(0, maxDigits);
    return joinByLengths(nextDigits, targetLengths);
  }

  if (prevLengths[0] + prevLengths[1] + prevLengths[2] === allDigitsRaw.length) {
    return joinByLengths(allDigitsRaw, prevLengths);
  }

  return buildDmyString(allDigitsRaw.slice(0, 8));
}

export type DmyInputChangeResult = {
  value: string;
  caret: number;
};

/** Formats the next value and returns where the caret should sit after React updates. */
export function applyDmyInputChange(
  raw: string,
  previousFormatted: string,
  caretStart: number | null,
): DmyInputChangeResult {
  const value = formatDmyInputValue(raw, previousFormatted, caretStart);
  const digitCount =
    caretStart === null ? value.replace(/\D/g, '').length : countDigitsBefore(raw, caretStart);
  return {
    value,
    caret: caretPosAfterDigits(value, digitCount),
  };
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
