import { computeAgeFromDob } from './student-account-form.schema';
import type { CreateStudentFormData } from './student-account-form.schema';

/** For live UI: watch only `dateOfBirth` and `manualAge` instead of the whole form. */
export function resolveAgeFromDobAndManual(
  dateOfBirth?: string,
  manualAge?: string | number,
): number | undefined {
  const fromDob = computeAgeFromDob(dateOfBirth?.trim() || undefined);
  if (fromDob !== undefined) return fromDob;
  const m = typeof manualAge === 'string' ? Number(manualAge) : manualAge;
  if (typeof m !== 'number' || !Number.isFinite(m)) return undefined;
  const t = Math.trunc(m);
  return t >= 1 && t <= 120 ? t : undefined;
}

/** Effective age for UI (parent section) and API: date of birth wins over manual age. */
export function resolveStudentCreateAge(data: CreateStudentFormData): number | undefined {
  return resolveAgeFromDobAndManual(data.dateOfBirth, data.manualAge);
}

export function combineParentDisplayName(
  first?: string,
  surname?: string,
): string | undefined {
  const merged = `${first ?? ''} ${surname ?? ''}`.trim();
  return merged === '' ? undefined : merged;
}
