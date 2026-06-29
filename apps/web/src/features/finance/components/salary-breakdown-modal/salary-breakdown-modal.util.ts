import type { SalaryBreakdownLesson } from '../../types';

export function initialsFromLabel(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    const w = parts[0];
    return w.slice(0, 2).toUpperCase();
  }
  const a = parts[0][0] ?? '';
  const b = parts[parts.length - 1][0] ?? '';
  return `${a}${b}`.toUpperCase() || '?';
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) {
    return '';
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatMonth(monthStr: string): string {
  if (!monthStr || monthStr.trim() === '') {
    return '';
  }
  const [year, monthNum] = monthStr.split('-');
  if (!year || !monthNum) {
    return '';
  }
  const yearNum = parseInt(year, 10);
  const monthNumParsed = parseInt(monthNum, 10);
  if (isNaN(yearNum) || isNaN(monthNumParsed) || monthNumParsed < 1 || monthNumParsed > 12) {
    return '';
  }
  const date = new Date(yearNum, monthNumParsed - 1);
  if (isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

export function sortLessons(
  lessons: SalaryBreakdownLesson[],
  sortBy: string,
  sortOrder: 'asc' | 'desc',
): SalaryBreakdownLesson[] {
  return [...lessons].sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;

    if (sortBy === 'lessonDate') {
      const aDate = a.lessonDate ? new Date(a.lessonDate) : new Date(0);
      const bDate = b.lessonDate ? new Date(b.lessonDate) : new Date(0);
      aVal = isNaN(aDate.getTime()) ? 0 : aDate.getTime();
      bVal = isNaN(bDate.getTime()) ? 0 : bDate.getTime();
    } else if (sortBy === 'lessonName') {
      aVal = a.lessonName.toLowerCase();
      bVal = b.lessonName.toLowerCase();
    } else if (sortBy === 'salary') {
      aVal = a.salary;
      bVal = b.salary;
    } else if (sortBy === 'total') {
      aVal = a.total;
      bVal = b.total;
    } else {
      return 0;
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
}

export function computeLessonTotals(lessons: SalaryBreakdownLesson[]) {
  return {
    totalSalary: lessons.reduce((sum, lesson) => sum + lesson.salary, 0),
    totalDeduction: lessons.reduce((sum, lesson) => sum + lesson.deduction, 0),
    totalNet: lessons.reduce((sum, lesson) => sum + lesson.total, 0),
  };
}
