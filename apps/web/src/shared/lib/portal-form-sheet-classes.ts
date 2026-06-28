import { cn } from '@/shared/lib/utils';

export const PORTAL_FORM_SHEET_OVERLAY_CLASS =
  'fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0';

export function portalFormSheetContentClass(maxWidth: 'xl' | '2xl' = '2xl'): string {
  return cn(
    'fixed inset-x-0 bottom-[7px] top-auto z-50 grid w-full translate-y-0 lg:bottom-0 [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:bottom-0',
    'duration-700 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out min-[1367px]:duration-350 min-[1367px]:ease-[cubic-bezier(0.22,1,0.36,1)]',
    'data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full',
    'h-[calc(94dvh+7px)] [@media(min-width:1024px)_and_(max-width:1366px)_and_(min-height:1000px)]:h-[56dvh] grid-rows-[auto_auto_1fr] gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-[#f8f9fb] shadow-xl',
    'min-[1367px]:inset-0 min-[1367px]:m-auto min-[1367px]:w-[95vw] min-[1367px]:h-auto min-[1367px]:max-h-[90vh] min-[1367px]:translate-x-0 min-[1367px]:translate-y-0 min-[1367px]:rounded-2xl',
    'min-[1367px]:data-[state=open]:fade-in-0 min-[1367px]:data-[state=closed]:fade-out-0 min-[1367px]:data-[state=open]:slide-in-from-bottom-0 min-[1367px]:data-[state=closed]:slide-out-to-bottom-0',
    maxWidth === 'xl' ? 'min-[1367px]:max-w-xl' : 'min-[1367px]:max-w-2xl',
  );
}

export const PORTAL_FORM_SHEET_HEADER_CLASS =
  'shrink-0 bg-[#f8f9fb] px-4 pb-4 pt-3 min-[1367px]:px-6 min-[1367px]:pb-5 min-[1367px]:pt-6';

export const PORTAL_FORM_SHEET_SCROLL_CLASS =
  'min-h-0 overflow-y-auto overscroll-y-contain [touch-action:pan-y] [-webkit-overflow-scrolling:touch] px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] min-[1367px]:px-6 min-[1367px]:pb-6';

export const PORTAL_FORM_SHEET_DRAG_HANDLE_CLASS =
  'relative flex h-9 w-full items-center justify-center bg-[#f8f9fb] min-[1367px]:hidden';

export const PORTAL_FORM_SHEET_CLOSE_BUTTON_CLASS =
  'hidden h-8 w-8 shrink-0 items-center justify-center rounded-[15px] text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 min-[1367px]:inline-flex';
