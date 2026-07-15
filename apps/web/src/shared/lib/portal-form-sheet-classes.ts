import { cn } from '@/shared/lib/utils';

export const PORTAL_FORM_SHEET_OVERLAY_CLASS =
  'fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0';

/** Bottom sheet on phone; overridden from tablet (744px — all iPads) by PORTAL_DESKTOP_SIDE_SHEET_CLASS. */
export const PORTAL_FORM_SHEET_MOBILE_BASE_CLASS =
  'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0 duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full h-[calc(94dvh+7px)] grid-rows-[auto_auto_1fr] gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-[#f8f9fb] shadow-xl';

/** Right-side panel: 75% on iPad/tablet; original half-width from 1367px (desktop unchanged). Flex so body can scroll to end. */
export const PORTAL_DESKTOP_SIDE_SHEET_CLASS =
  'tablet:fixed tablet:inset-y-0 tablet:right-0 tablet:left-auto tablet:top-0 tablet:bottom-0 tablet:!w-[75%] tablet:!max-w-none tablet:h-full tablet:max-h-none tablet:m-0 tablet:translate-x-0 tablet:translate-y-0 tablet:rounded-none tablet:rounded-l-2xl tablet:border-y-0 tablet:border-r-0 tablet:border-l tablet:border-slate-200 tablet:shadow-2xl tablet:flex tablet:flex-col tablet:overflow-hidden tablet:duration-350 tablet:ease-[cubic-bezier(0.22,1,0.36,1)] tablet:data-[state=open]:slide-in-from-right tablet:data-[state=closed]:slide-out-to-right tablet:data-[state=open]:fade-in-0 tablet:data-[state=closed]:fade-out-0 tablet:data-[state=open]:slide-in-from-bottom-0 tablet:data-[state=closed]:slide-out-to-bottom-0 tablet:data-[state=open]:zoom-in-100 tablet:data-[state=closed]:zoom-out-100 min-[1367px]:!w-1/2';

/** Same layout for custom drawer panels (non-Radix). */
export const CUSTOM_DESKTOP_SIDE_PANEL_CLASS =
  'tablet:fixed tablet:inset-y-0 tablet:right-0 tablet:left-auto tablet:top-0 tablet:bottom-0 tablet:!w-[75%] tablet:!max-w-none tablet:h-full tablet:max-h-none tablet:rounded-none tablet:rounded-l-2xl tablet:border-l tablet:border-slate-200 tablet:shadow-2xl tablet:flex tablet:flex-col tablet:overflow-hidden tablet:animate-in tablet:slide-in-from-right tablet:duration-350 tablet:ease-[cubic-bezier(0.22,1,0.36,1)] min-[1367px]:!w-1/2';

/** Overlay for hand-rolled modals. */
export const CUSTOM_MODAL_OVERLAY_CLASS = 'fixed inset-0 z-50 bg-black/50 tablet:bg-black/60';

/** Centered card below tablet; right panel from tablet up. */
export const CUSTOM_MODAL_PANEL_CLASS = cn(
  'fixed z-50 flex w-full flex-col overflow-hidden bg-white shadow-xl',
  'left-1/2 top-1/2 max-h-[90vh] -translate-x-1/2 -translate-y-1/2 rounded-xl',
  'tablet:left-auto tablet:top-auto tablet:max-h-none tablet:translate-x-0 tablet:translate-y-0 tablet:rounded-none',
  CUSTOM_DESKTOP_SIDE_PANEL_CLASS,
);

/** DialogContent tablet+ right side sheet; half width restored on desktop 1367+. */
export const DIALOG_LG_DESKTOP_SIDE_SHEET_CLASS =
  'tablet:fixed tablet:inset-y-0 tablet:right-0 tablet:left-auto tablet:top-0 tablet:bottom-0 tablet:!w-[75%] tablet:!max-w-none tablet:h-full tablet:max-h-none tablet:m-0 tablet:translate-x-0 tablet:translate-y-0 tablet:rounded-none tablet:rounded-l-2xl tablet:border-y-0 tablet:border-r-0 tablet:border-l tablet:border-slate-200 tablet:shadow-2xl tablet:overflow-hidden tablet:flex tablet:flex-col tablet:gap-0 tablet:p-0 tablet:duration-300 tablet:ease-[cubic-bezier(0.22,1,0.36,1)] tablet:data-[state=open]:slide-in-from-right tablet:data-[state=closed]:slide-out-to-right tablet:data-[state=open]:fade-in-0 tablet:data-[state=closed]:fade-out-0 tablet:data-[state=open]:slide-in-from-bottom-0 tablet:data-[state=closed]:slide-out-to-bottom-0 tablet:data-[state=open]:zoom-in-100 tablet:data-[state=closed]:zoom-out-100 min-[1367px]:!w-1/2';


export function portalFormSheetContentClass(_maxWidth: 'xl' | '2xl' | '3xl' = '2xl'): string {
  return cn(PORTAL_FORM_SHEET_MOBILE_BASE_CLASS, PORTAL_DESKTOP_SIDE_SHEET_CLASS);
}

export const PORTAL_FORM_SHEET_HEADER_CLASS =
  'shrink-0 border-b border-slate-200/80 bg-[#f8f9fb] px-4 pb-4 pt-3 tablet:px-6 tablet:pb-5 tablet:pt-6';

/** Clear fixed bottom nav below `lg`; compact padding when nav is hidden. */
export const PORTAL_FORM_SHEET_SCROLL_CLASS =
  'min-h-0 flex-1 overflow-y-auto overscroll-y-contain [touch-action:pan-y] [-webkit-overflow-scrolling:touch] px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] tablet:px-6 tablet:pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8';

export const PORTAL_FORM_SHEET_DRAG_HANDLE_CLASS =
  'relative flex h-9 w-full items-center justify-center bg-[#f8f9fb] tablet:hidden';

export const PORTAL_FORM_SHEET_CLOSE_BUTTON_CLASS =
  'hidden h-8 w-8 shrink-0 items-center justify-center rounded-[15px] border-0 border-transparent bg-transparent text-slate-500 outline-none transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 tablet:inline-flex';
