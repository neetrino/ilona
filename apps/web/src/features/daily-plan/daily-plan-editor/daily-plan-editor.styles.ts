import { cn } from '@/shared/lib/utils';
import { ADMIN_FORM_INPUT_CLASS } from '@/shared/lib/admin-control-theme';

export const dailyPlanTextareaClass = cn(
  ADMIN_FORM_INPUT_CLASS,
  'h-auto min-h-[3.5rem] resize-y overflow-auto py-2',
);
