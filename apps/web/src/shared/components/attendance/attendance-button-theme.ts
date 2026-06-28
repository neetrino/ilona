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

export const ATTENDANCE_CELL_RADIUS_CLASS = 'rounded-[15px]';

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
