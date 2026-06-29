import {
  EXPERIENCE_YEAR_START_DAY,
  EXPERIENCE_YEAR_START_MONTH,
} from './teacher-crud.constants';

export function getHireDateFromExperienceYears(experienceYears: number): Date {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - experienceYears;
    return new Date(startYear, EXPERIENCE_YEAR_START_MONTH, EXPERIENCE_YEAR_START_DAY);
  }
