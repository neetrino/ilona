import { cn } from '@/shared/lib/utils';
import { ADMIN_FORM_INPUT_CLASS } from '@/shared/lib/admin-control-theme';

export const CRM_LAYOUT_SECTION_HEADING = 'text-sm font-semibold text-[#3b3b40]';

export const CRM_LAYOUT_TEXTAREA_CLASS = cn(
  ADMIN_FORM_INPUT_CLASS,
  'h-auto min-h-[5.5rem] resize-none py-2',
);

export function crmLayoutFieldId(idPrefix: string, id: string): string {
  return idPrefix ? `${idPrefix}-${id}` : id;
}
