import { z } from 'zod';

export function normalizeExperienceYearsInput(value: unknown): number | undefined {
  if (value === '' || value === null || value === undefined) return undefined;
  if (typeof value === 'number' && Number.isNaN(value)) return undefined;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function getExperienceYearsFromHireDate(hireDate?: string | Date | null): number | null {
  if (!hireDate) return null;
  const parsedDate = new Date(hireDate);
  if (Number.isNaN(parsedDate.getTime())) return null;
  const currentYear = new Date().getFullYear();
  const years = Math.max(0, currentYear - parsedDate.getFullYear());
  return years > 0 ? years : null;
}

export function formatExperienceLabel(experienceYears: number | null | undefined): string | null {
  if (experienceYears === null || experienceYears === undefined || experienceYears <= 0) {
    return null;
  }
  return `${experienceYears} ${experienceYears === 1 ? 'year' : 'years'} experience`;
}

export function getExperienceLabelFromHireDate(hireDate?: string | Date | null): string | null {
  return formatExperienceLabel(getExperienceYearsFromHireDate(hireDate));
}

export function createOptionalExperienceYearsSchema(tVal: (key: string) => string) {
  return z.preprocess(
    normalizeExperienceYearsInput,
    z
      .number()
      .int(tVal('experienceInt'))
      .min(0, tVal('experienceMin'))
      .max(80, tVal('experienceMax'))
      .optional(),
  );
}

export const experienceYearsFieldRegisterOptions = {
  setValueAs: normalizeExperienceYearsInput,
} as const;
