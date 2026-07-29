import { cn } from '@/shared/lib/utils';
import { PORTAL_DESKTOP_SIDE_SHEET_CLASS } from '@/shared/lib/portal-form-sheet-classes';

export const CREATE_GROUP_CHAT_SHEET_CLASS = cn(
  'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0',
  'duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out',
  'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
  'h-[calc(94dvh+7px)] grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-[#f8f9fb] shadow-xl',
  PORTAL_DESKTOP_SIDE_SHEET_CLASS,
);

export const CREATE_GROUP_CHAT_DRAG_CLOSE_THRESHOLD_PX = 110;
export const CREATE_GROUP_CHAT_DRAG_MAX_OFFSET_PX = 340;
