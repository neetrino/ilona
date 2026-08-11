import type { LucideIcon } from 'lucide-react';
import {
  BookOpenText,
  Headphones,
  Mic,
  PenLine,
  SpellCheck2,
  Trophy,
} from 'lucide-react';
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

export const DAILY_PLAN_KIND_ICON: Record<DailyPlanResourceKind, LucideIcon> = {
  READING: BookOpenText,
  LISTENING: Headphones,
  WRITING: PenLine,
  SPEAKING: Mic,
  GRAMMAR: SpellCheck2,
  CHALLENGE: Trophy,
};

export const DAILY_PLAN_KIND_ICON_SURFACE_CLASS: Record<DailyPlanResourceKind, string> = {
  READING: 'bg-sky-100 text-sky-700',
  LISTENING: 'bg-teal-100 text-teal-700',
  WRITING: 'bg-amber-100 text-amber-800',
  SPEAKING: 'bg-rose-100 text-rose-700',
  GRAMMAR: 'bg-emerald-100 text-emerald-700',
  CHALLENGE: 'bg-orange-100 text-orange-800',
};

export const DAILY_PLAN_KIND_SURFACE_CLASS: Record<DailyPlanResourceKind, string> = {
  READING: 'border-sky-200 bg-sky-50/70',
  LISTENING: 'border-teal-200 bg-teal-50/70',
  WRITING: 'border-amber-200 bg-amber-50/70',
  SPEAKING: 'border-rose-200 bg-rose-50/70',
  GRAMMAR: 'border-emerald-200 bg-emerald-50/70',
  CHALLENGE: 'border-orange-200 bg-orange-50/70',
};

export const DAILY_PLAN_KIND_TITLE_CLASS: Record<DailyPlanResourceKind, string> = {
  READING: 'text-sky-800',
  LISTENING: 'text-teal-800',
  WRITING: 'text-amber-900',
  SPEAKING: 'text-rose-800',
  GRAMMAR: 'text-emerald-800',
  CHALLENGE: 'text-orange-900',
};

export const DAILY_PLAN_KIND_ADD_BUTTON_CLASS: Record<DailyPlanResourceKind, string> = {
  READING: 'border-sky-300 text-sky-700 hover:border-sky-400 hover:bg-sky-50',
  LISTENING: 'border-teal-300 text-teal-700 hover:border-teal-400 hover:bg-teal-50',
  WRITING: 'border-amber-300 text-amber-800 hover:border-amber-400 hover:bg-amber-50',
  SPEAKING: 'border-rose-300 text-rose-700 hover:border-rose-400 hover:bg-rose-50',
  GRAMMAR: 'border-emerald-300 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50',
  CHALLENGE: 'border-orange-300 text-orange-800 hover:border-orange-400 hover:bg-orange-50',
};
