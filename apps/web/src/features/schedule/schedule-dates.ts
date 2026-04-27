/**
 * Date helpers for schedule week/month views (week starts on Monday).
 */

export function formatScheduleDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getWeekDates(anchor: Date): Date[] {
  const current = new Date(anchor);
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(current.setDate(diff));
  return Array.from({ length: 7 }, (_, idx) => {
    const item = new Date(monday);
    item.setDate(monday.getDate() + idx);
    return item;
  });
}

export function getMonthDates(anchor: Date): (Date | null)[][] {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay() || 7;
  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = [];

  for (let i = 1; i < startDay; i += 1) {
    currentWeek.push(null);
  }
  for (let d = 1; d <= lastDay.getDate(); d += 1) {
    currentWeek.push(new Date(year, month, d));
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  while (currentWeek.length > 0 && currentWeek.length < 7) {
    currentWeek.push(null);
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
}

export type ScheduleViewMode = 'week' | 'month';
