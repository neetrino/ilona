import { cn } from '@/shared/lib/utils';

export const PORTAL_FORM_SHEET_OVERLAY_CLASS =
  'fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0';

/** Bottom sheet on mobile/tablet; unchanged below desktop breakpoint. */
export const PORTAL_FORM_SHEET_MOBILE_BASE_CLASS =
  'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0 lg:bottom-0 [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:bottom-0 duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full h-[calc(94dvh+7px)] [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:h-[56dvh] grid-rows-[auto_auto_1fr] gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-[#f8f9fb] shadow-xl';

/** Right-side half-width panel on desktop (min-width 1367px). */
export const PORTAL_DESKTOP_SIDE_SHEET_CLASS =
  'min-[1367px]:fixed min-[1367px]:inset-y-0 min-[1367px]:right-0 min-[1367px]:left-auto min-[1367px]:top-0 min-[1367px]:bottom-0 min-[1367px]:!w-1/2 min-[1367px]:!max-w-none min-[1367px]:h-full min-[1367px]:max-h-none min-[1367px]:m-0 min-[1367px]:translate-x-0 min-[1367px]:translate-y-0 min-[1367px]:rounded-none min-[1367px]:rounded-l-2xl min-[1367px]:border-y-0 min-[1367px]:border-r-0 min-[1367px]:border-l min-[1367px]:border-slate-200 min-[1367px]:shadow-2xl min-[1367px]:grid-rows-[auto_1fr] min-[1367px]:duration-350 min-[1367px]:ease-[cubic-bezier(0.22,1,0.36,1)] min-[1367px]:data-[state=open]:slide-in-from-right min-[1367px]:data-[state=closed]:slide-out-to-right min-[1367px]:data-[state=open]:fade-in-0 min-[1367px]:data-[state=closed]:fade-out-0 min-[1367px]:data-[state=open]:slide-in-from-bottom-0 min-[1367px]:data-[state=closed]:slide-out-to-bottom-0 min-[1367px]:data-[state=open]:zoom-in-100 min-[1367px]:data-[state=closed]:zoom-out-100';

/** Same layout for custom drawer panels (non-Radix). */
export const CUSTOM_DESKTOP_SIDE_PANEL_CLASS =
  'min-[1367px]:fixed min-[1367px]:inset-y-0 min-[1367px]:right-0 min-[1367px]:left-auto min-[1367px]:top-0 min-[1367px]:bottom-0 min-[1367px]:!w-1/2 min-[1367px]:!max-w-none min-[1367px]:h-full min-[1367px]:max-h-none min-[1367px]:rounded-none min-[1367px]:rounded-l-2xl min-[1367px]:border-l min-[1367px]:border-slate-200 min-[1367px]:shadow-2xl min-[1367px]:animate-in min-[1367px]:slide-in-from-right min-[1367px]:duration-350 min-[1367px]:ease-[cubic-bezier(0.22,1,0.36,1)]';

/** Overlay for hand-rolled modals. */
export const CUSTOM_MODAL_OVERLAY_CLASS = 'fixed inset-0 z-50 bg-black/50 min-[1367px]:bg-black/60';

/** Centered card below desktop; right half-width panel on desktop. */
export const CUSTOM_MODAL_PANEL_CLASS = cn(
  'fixed z-50 flex w-full flex-col overflow-hidden bg-white shadow-xl',
  'left-1/2 top-1/2 max-h-[90vh] -translate-x-1/2 -translate-y-1/2 rounded-xl',
  'min-[1367px]:left-auto min-[1367px]:top-auto min-[1367px]:max-h-none min-[1367px]:translate-x-0 min-[1367px]:translate-y-0 min-[1367px]:rounded-none',
  CUSTOM_DESKTOP_SIDE_PANEL_CLASS,
);

/** DialogContent lg+ right side sheet (half viewport). */
export const DIALOG_LG_DESKTOP_SIDE_SHEET_CLASS =
  'lg:fixed lg:inset-y-0 lg:right-0 lg:left-auto lg:top-0 lg:bottom-0 lg:!w-1/2 lg:!max-w-none lg:h-full lg:max-h-none lg:m-0 lg:translate-x-0 lg:translate-y-0 lg:rounded-none lg:rounded-l-2xl lg:border-y-0 lg:border-r-0 lg:border-l lg:border-slate-200 lg:shadow-2xl lg:overflow-hidden lg:grid lg:grid-rows-[auto_1fr] lg:gap-0 lg:p-0 lg:duration-300 lg:ease-[cubic-bezier(0.22,1,0.36,1)] lg:data-[state=open]:slide-in-from-right lg:data-[state=closed]:slide-out-to-right lg:data-[state=open]:fade-in-0 lg:data-[state=closed]:fade-out-0 lg:data-[state=open]:slide-in-from-bottom-0 lg:data-[state=closed]:slide-out-to-bottom-0 lg:data-[state=open]:zoom-in-100 lg:data-[state=closed]:zoom-out-100';

export function portalFormSheetContentClass(_maxWidth: 'xl' | '2xl' | '3xl' = '2xl'): string {
  return cn(PORTAL_FORM_SHEET_MOBILE_BASE_CLASS, PORTAL_DESKTOP_SIDE_SHEET_CLASS);
}

export const PORTAL_FORM_SHEET_HEADER_CLASS =
  'shrink-0 border-b border-slate-200/80 bg-[#f8f9fb] px-4 pb-4 pt-3 min-[1367px]:px-6 min-[1367px]:pb-5 min-[1367px]:pt-6';

export const PORTAL_FORM_SHEET_SCROLL_CLASS =
  'min-h-0 flex-1 overflow-y-auto overscroll-y-contain [touch-action:pan-y] [-webkit-overflow-scrolling:touch] px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] min-[1367px]:px-6 min-[1367px]:pb-6';

export const PORTAL_FORM_SHEET_DRAG_HANDLE_CLASS =
  'relative flex h-9 w-full items-center justify-center bg-[#f8f9fb] min-[1367px]:hidden';

export const PORTAL_FORM_SHEET_CLOSE_BUTTON_CLASS =
  'hidden h-8 w-8 shrink-0 items-center justify-center rounded-[15px] border-0 border-transparent bg-transparent text-slate-500 outline-none transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 min-[1367px]:inline-flex';
