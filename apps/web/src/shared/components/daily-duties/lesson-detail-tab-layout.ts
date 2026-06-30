import { cn } from '@/shared/lib/utils';

export function lessonDetailTabShellClass(embeddedInSheet: boolean): string {
  return embeddedInSheet ? 'pb-4 lg:p-6' : 'p-4 sm:p-6';
}

export function lessonDetailTabHeaderClass(embeddedInSheet: boolean): string {
  return cn('mb-6', embeddedInSheet && 'mb-4 lg:mb-6');
}
