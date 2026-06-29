import { cn } from '@/shared/lib/utils';
import { PORTAL_DESKTOP_SIDE_SHEET_CLASS } from '@/shared/lib/portal-form-sheet-classes';

export const CREATE_GROUP_CHAT_SHEET_CLASS = cn(
  'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0 lg:bottom-0 [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:bottom-0',
  'duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out min-[1367px]:duration-350 min-[1367px]:ease-[cubic-bezier(0.22,1,0.36,1)]',
  'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
  'h-[calc(94dvh+7px)] [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:h-[56dvh] grid-rows-[auto_auto_1fr_auto] gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-[#f8f9fb] shadow-xl',
  PORTAL_DESKTOP_SIDE_SHEET_CLASS,
);

export const CREATE_GROUP_CHAT_DRAG_CLOSE_THRESHOLD_PX = 110;
export const CREATE_GROUP_CHAT_DRAG_MAX_OFFSET_PX = 340;
