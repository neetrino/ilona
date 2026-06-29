import { cn } from '@/shared/lib/utils';
import {
  ADMIN_ICON_BUTTON_SM_CLASS,
  ADMIN_OUTLINE_BUTTON_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
} from '@/shared/lib/admin-control-theme';

export const ATTENDANCE_PRIMARY_BUTTON_CLASS = cn(
  ADMIN_PRIMARY_BUTTON_CLASS,
  'bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-md hover:shadow-lg transition-all',
);

export const ATTENDANCE_EDIT_ICON_BUTTON_CLASS = cn(
  ADMIN_ICON_BUTTON_SM_CLASS,
  'h-9 w-9 border border-[rgba(14,14,16,0.12)] text-slate-700 hover:bg-slate-50',
);

export const ATTENDANCE_SMALL_OUTLINE_BUTTON_CLASS = cn(
  ADMIN_OUTLINE_BUTTON_CLASS,
  'h-7 min-h-7 px-2 text-xs',
);

export const ATTENDANCE_NOTE_BUTTON_CLASS =
  'rounded-[15px] bg-slate-800 px-2.5 py-1 text-xs font-bold tracking-wide text-white shadow-md hover:bg-slate-700';

/** Shared 15px corner radius for attendance register cards, panels, cells, and controls. */
export const ATTENDANCE_RADIUS_CLASS = 'rounded-[15px]';

export const ATTENDANCE_CELL_RADIUS_CLASS = ATTENDANCE_RADIUS_CLASS;

/** Outermost page surface wrapping controls + attendance views. */
export const ATTENDANCE_PAGE_SHELL_CLASS =
  'overflow-hidden rounded-[15px] border border-[rgba(14,14,16,0.07)] bg-white p-4 shadow-sm sm:p-6';

/** Inner group section shell on attendance register views. */
export const ATTENDANCE_GROUP_CARD_CLASS = cn(
  ATTENDANCE_RADIUS_CLASS,
  'overflow-hidden border border-[rgba(14,14,16,0.08)] bg-white p-6 shadow-[0_2px_12px_rgba(19,28,71,0.06)] md:border-2 md:border-[rgba(14,14,16,0.12)] md:p-6 md:shadow-sm',
);

export const ATTENDANCE_PAGER_INDICATOR_CLASS = cn(
  ADMIN_PRIMARY_BUTTON_CLASS,
  'h-9 min-w-9 bg-[#1010a3] px-3 text-xs font-semibold text-white hover:bg-[#1010a3]',
);

export function attendancePagerButtonClass(enabled: boolean) {
  return cn(
    ADMIN_OUTLINE_BUTTON_CLASS,
    'h-9 w-9 shrink-0 px-0',
    enabled
      ? 'border-[rgba(14,14,16,0.12)] bg-white text-[#3b3b40] hover:bg-[#f6f6f7]'
      : 'border-[#d9dde8] bg-[#f1f1f4] text-[#9aa3b5]',
  );
}
