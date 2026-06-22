export const DMY_DATE_RE = /^(\d{2})\/(\d{2})\/(\d{4})$/;
export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function formatDmyInputValue(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function parseDmyToIso(value: string): string | undefined {
  const match = DMY_DATE_RE.exec(value.trim());
  if (!match) return undefined;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) {
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

export function resolveDateOfBirthToIso(value?: string): string | undefined {
  if (!value?.trim()) return undefined;
  const trimmed = value.trim();
  const fromDmy = parseDmyToIso(trimmed);
  if (fromDmy) return fromDmy;
  if (ISO_DATE_RE.test(trimmed)) return trimmed;
  return undefined;
}

export function isoToDmy(value?: string | null): string {
  if (!value?.trim()) return '';
  const trimmed = value.trim();
  if (DMY_DATE_RE.test(trimmed)) return trimmed;
  if (!ISO_DATE_RE.test(trimmed)) return trimmed;
  const [year, month, day] = trimmed.split('-');
  return `${day}/${month}/${year}`;
}
