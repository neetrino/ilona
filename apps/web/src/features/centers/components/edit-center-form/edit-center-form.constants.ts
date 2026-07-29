import { cn } from '@/shared/lib/utils';
import { ADMIN_FORM_INPUT_CLASS } from '@/shared/lib/admin-control-theme';

export const ADMIN_TEXTAREA_CLASS = cn(ADMIN_FORM_INPUT_CLASS, 'h-auto min-h-[5.5rem] resize-none py-2');

export const EDIT_CENTER_DIALOG_GRID_ROWS =
  'h-[calc(94dvh+7px)] grid-rows-[auto_auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-t-[22px] border border-slate-200 bg-[#f8f9fb] shadow-xl';
