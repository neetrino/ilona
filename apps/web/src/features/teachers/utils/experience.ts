const MIN_EXPERIENCE_YEARS = 0;

export function getExperienceYearsFromHireDate(hireDate?: string | Date | null): number {
  if (!hireDate) return MIN_EXPERIENCE_YEARS;
  const parsedDate = new Date(hireDate);
  if (Number.isNaN(parsedDate.getTime())) return MIN_EXPERIENCE_YEARS;
  const currentYear = new Date().getFullYear();
  return Math.max(MIN_EXPERIENCE_YEARS, currentYear - parsedDate.getFullYear());
}

export function formatExperienceLabel(experienceYears: number): string {
  return `${experienceYears} ${experienceYears === 1 ? 'year' : 'years'} experience`;
}
