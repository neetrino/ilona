import { cn } from '@/shared/lib/utils';

export const JUSTIFICATION_DIALOG_CONTENT_CLASS = cn(
  'w-[calc(100%-1.5rem)] max-w-md rounded-[20px] p-6 duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:w-full',
  'gap-6',
);

export const JUSTIFICATION_DIALOG_HEADER_CLASS = 'space-y-3';

export const JUSTIFICATION_DIALOG_STUDENT_NAME_CLASS =
  'text-lg font-semibold text-slate-900';

export const JUSTIFICATION_DIALOG_BODY_CLASS = 'space-y-4';

export const JUSTIFICATION_DIALOG_INPUT_CLASS = cn(
  'h-11 min-h-11 w-full rounded-[15px] border-0 bg-slate-50 px-4 py-0 text-sm text-[#3b3b40] shadow-none',
  'placeholder:text-muted-foreground focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
);

export const JUSTIFICATION_DIALOG_COMMENT_BOX_CLASS =
  'rounded-[15px] bg-slate-50 p-4 text-sm leading-relaxed text-slate-800';
