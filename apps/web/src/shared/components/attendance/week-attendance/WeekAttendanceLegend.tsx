'use client';

import { ATTENDANCE_RADIUS_CLASS } from '@/shared/components/attendance/attendance-button-theme';

interface WeekAttendanceLegendProps {
  t: (key: string) => string;
}

export function WeekAttendanceLegend({ t }: WeekAttendanceLegendProps) {
  const swatchClass = `flex h-6 w-6 items-center justify-center border-2 shadow-sm ${ATTENDANCE_RADIUS_CLASS}`;

  return (
    <div
      className={`flex flex-wrap items-center gap-4 border-2 border-slate-300 bg-slate-100 px-5 py-4 text-sm md:gap-6 ${ATTENDANCE_RADIUS_CLASS}`}
    >
      <span className="text-base font-bold text-slate-900">{t('legend')}</span>
      <div className="flex items-center gap-2">
        <span className={`${swatchClass} border-green-400 bg-green-100 text-sm font-bold text-green-800`}>
          ✓
        </span>
        <span className="font-semibold text-slate-800">{t('present')}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`${swatchClass} border-amber-400 bg-amber-100 text-sm font-bold text-amber-800`}>
          J
        </span>
        <span className="font-semibold text-slate-800">{t('absentJustifiedLegend')}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`${swatchClass} border-red-400 bg-red-100 text-sm font-bold text-red-800`}>
          ✗
        </span>
        <span className="font-semibold text-slate-800">{t('absentUnjustifiedLegend')}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`h-6 w-6 border-2 border-slate-300 bg-white shadow-sm ${ATTENDANCE_RADIUS_CLASS}`} />
        <span className="font-semibold text-slate-800">{t('notMarked')}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`${swatchClass} border-slate-300 bg-white text-xs text-slate-400`}>
          —
        </span>
        <span className="font-semibold text-slate-800">{t('noSession')}</span>
      </div>
      <div className="ml-auto hidden text-xs text-slate-600 md:block md:text-sm">
        <span className="font-medium">{t('legendTipLabel')}</span> {t('legendTip')}
      </div>
    </div>
  );
}
