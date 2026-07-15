import type { DailyPlanResourceKind } from '../types';

export const DAILY_PLAN_RESOURCE_KINDS: DailyPlanResourceKind[] = [
  'READING',
  'LISTENING',
  'WRITING',
  'SPEAKING',
  'GRAMMAR',
  'CHALLENGE',
];

export const DAILY_PLAN_DESCRIPTION_ONLY_KINDS = new Set<DailyPlanResourceKind>([
  'CHALLENGE',
]);
