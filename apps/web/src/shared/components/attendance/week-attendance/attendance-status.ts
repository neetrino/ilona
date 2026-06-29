import type { AttendanceStatus } from './types';

export function getStatusStyles(status: AttendanceStatus) {
  const styles = {
    present: 'bg-green-100 hover:bg-green-200 border-2 border-green-400 text-green-800 font-semibold',
    absent_justified:
      'bg-amber-100 hover:bg-amber-200 border-2 border-amber-400 text-amber-800 font-semibold',
    absent_unjustified: 'bg-red-100 hover:bg-red-200 border-2 border-red-400 text-red-800 font-semibold',
    not_marked: 'bg-white hover:bg-slate-50 border-2 border-slate-300 text-slate-600',
  };
  return styles[status];
}

export function getStatusIcon(status: AttendanceStatus) {
  const icons = {
    present: '✓',
    absent_justified: 'J',
    absent_unjustified: '✗',
    not_marked: '',
  };
  return icons[status];
}

export function formatDayHeader(date: Date, locale: string) {
  const dayName = date.toLocaleDateString(locale, { weekday: 'short' });
  const dayNum = date.getDate();
  const month = date.toLocaleDateString(locale, { month: 'short' });
  return { dayName, dayNum, month };
}

type TranslateFn = (key: string, values?: Record<string, string | number>) => string;

export function createStatusLabelHelpers(t: TranslateFn) {
  const getStatusLabel = (status: AttendanceStatus): string => {
    switch (status) {
      case 'present':
        return t('present');
      case 'absent_justified':
        return t('absentJustifiedLegend');
      case 'absent_unjustified':
        return t('absentUnjustifiedLegend');
      default:
        return t('notMarked');
    }
  };

  const getNextMarkLabel = (status: AttendanceStatus): string => {
    switch (status) {
      case 'not_marked':
        return t('markPresentNext');
      case 'present':
        return t('markAbsentJustifiedNext');
      case 'absent_justified':
        return t('markAbsentUnjustifiedNext');
      default:
        return t('markNotMarkedNext');
    }
  };

  return { getStatusLabel, getNextMarkLabel };
}
