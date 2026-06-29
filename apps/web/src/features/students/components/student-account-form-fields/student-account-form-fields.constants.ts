import { cn } from '@/shared/lib/utils';
import { ADMIN_FORM_INPUT_CLASS } from '@/shared/lib/admin-control-theme';

export const FORM_INPUT_CLASS_NAME = ADMIN_FORM_INPUT_CLASS;

export const TEXTAREA_CLASS_NAME = cn(
  ADMIN_FORM_INPUT_CLASS,
  'h-auto min-h-[6rem] resize-y py-2',
);

export const FORM_READONLY_FIELD_CLASS =
  'flex h-11 min-h-11 items-center rounded-[15px] border border-[rgba(14,14,16,0.07)] bg-muted/40 px-4 text-sm';

export function formFieldId(idPrefix: string, id: string): string {
  return idPrefix ? `${idPrefix}-${id}` : id;
}
