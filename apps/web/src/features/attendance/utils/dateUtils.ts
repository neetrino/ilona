/**
 * Date utility functions for attendance register views
 */

export type ViewMode = 'day' | 'week' | 'month';

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get the start of week (Monday) for a given date
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

/**
 * Get the end of week (Sunday) for a given date
 */
export function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return weekEnd;
}

/**
 * Get all dates in a week (Monday to Sunday)
 */
export function getWeekDates(date: Date): Date[] {
  const weekStart = getWeekStart(date);
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    dates.push(d);
  }
  return dates;
}

/**
 * Get the start of month for a given date
 */
export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get the end of month for a given date
 */
export function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Get all dates in a month
 */
export function getMonthDates(date: Date): Date[] {
  const monthStart = getMonthStart(date);
  const monthEnd = getMonthEnd(date);
  const dates: Date[] = [];
  
  // Start from Monday of the week containing the first day of month
  const firstDay = getWeekStart(monthStart);
  
  // End on Sunday of the week containing the last day of month
  const lastDay = getWeekEnd(monthEnd);
  
  const current = new Date(firstDay);
  while (current <= lastDay) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

/**
 * Navigate to previous week
 */
export function getPreviousWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - 7);
  return d;
}

/**
 * Navigate to next week
 */
export function getNextWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + 7);
  return d;
}

/**
 * Navigate to previous month
 */
export function getPreviousMonth(date: Date): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() - 1);
  return d;
}

/**
 * Navigate to next month
 */
export function getNextMonth(date: Date): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  return d;
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Format date for display
 */
export function formatDateDisplay(date: Date, options?: Intl.DateTimeFormatOptions): string {
  return date.toLocaleDateString('en-US', options || {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format week range for display
 */
export function formatWeekRange(date: Date): string {
  const weekStart = getWeekStart(date);
  const weekEnd = getWeekEnd(date);
  const startStr = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startStr} - ${endStr}`;
}

/**
 * Format month for display
 */
export function formatMonthDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is in the current month
 */
export function isCurrentMonth(date: Date, currentMonth: Date): boolean {
  return (
    date.getMonth() === currentMonth.getMonth() &&
    date.getFullYear() === currentMonth.getFullYear()
  );
}

